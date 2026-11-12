import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { Breadcrumb } from '@/components/Breadcrumb'
import { JsonLd } from '@/components/JsonLd'
import { PostCard } from '@/components/PostCard'
import { DICT, isLocale, LOCALES, pathsFor } from '@/i18n'
import { localeOf } from '@/i18n/server'
import { asMedia, getAuthorBySlug, getAuthors, getPostList } from '@/lib/data'
import { profilePageJsonLd } from '@/lib/jsonld'
import { mediaUrl } from '@/lib/media'
import { listingMetadata } from '@/lib/seo'

type Args = { params: Promise<{ lang: string; slug: string }> }

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) return []
  const authors = await getAuthors(params.lang)
  return authors.map((a) => ({ slug: a.slug as string }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const locale = await localeOf(params)
  const { slug } = await params
  const a = await getAuthorBySlug(locale, decodeURIComponent(slug))
  if (!a) return {}
  // Slug tác giả giống nhau ở mọi ngôn ngữ, nên bản dịch của trang này luôn có.
  const alternates = Object.fromEntries(LOCALES.map((l) => [l, pathsFor(l).author(a.slug as string)]))
  return listingMetadata({
    title: `${a.name} | ${DICT[locale].blogName}`,
    description: a.bio || DICT[locale].authorFallback(a.name),
    path: pathsFor(locale).author(a.slug as string),
    locale,
    alternates,
  })
}

export default async function AuthorPage({ params }: Args) {
  const locale = await localeOf(params)
  const d = DICT[locale]
  const paths = pathsFor(locale)
  const { slug } = await params
  const author = await getAuthorBySlug(locale, decodeURIComponent(slug))
  if (!author) notFound()
  const posts = await getPostList(locale, 1, { authorId: author.id, limit: 100 })
  const avatar = mediaUrl(asMedia(author.avatar), 'thumb')
  const path = paths.author(author.slug as string)

  return (
    <main className="wrap">
      <Breadcrumb
        label={d.breadcrumb}
        items={[
          { name: d.home, path: paths.home },
          { name: d.blog, path: paths.blog },
          { name: author.name, path },
        ]}
      />
      <JsonLd
        data={profilePageJsonLd({
          name: author.name,
          kind: author.kind === 'organization' ? 'organization' : 'person',
          description: author.bio ?? undefined,
          path,
          image: avatar ?? undefined,
          sameAs: (author.sameAs ?? []).map((s) => s.url),
        })}
      />
      <section className="author-hero">
        <div className="avatar">
          {avatar ? <Image src={avatar} alt={author.name} width={96} height={96} /> : author.name.replace(/^(Đội|Team)\s+/i, '').charAt(0)}
        </div>
        <div>
          <h1>{author.name}</h1>
          {author.jobTitle ? <div className="job">{author.jobTitle}</div> : null}
          {author.bio ? <p>{author.bio}</p> : null}
        </div>
      </section>
      <section className="lien-quan" aria-labelledby="bai-cua-tac-gia" style={{ paddingTop: 0 }}>
        <h2 id="bai-cua-tac-gia">{d.posts(posts.totalDocs)}</h2>
        <div className="posts three">
          {posts.docs.map((p) => (
            <PostCard key={p.id} post={p} locale={locale} headingLevel="h3" />
          ))}
        </div>
      </section>
    </main>
  )
}
