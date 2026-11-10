import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { Breadcrumb } from '@/components/Breadcrumb'
import { JsonLd } from '@/components/JsonLd'
import { PostCard } from '@/components/PostCard'
import { asMedia, getAuthorBySlug, getAuthors, getPostList } from '@/lib/data'
import { profilePageJsonLd } from '@/lib/jsonld'
import { mediaUrl } from '@/lib/media'
import { listingMetadata } from '@/lib/seo'
import { BLOG_NAME, paths } from '@/lib/site'

type Args = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const authors = await getAuthors()
  return authors.map((a) => ({ slug: a.slug as string }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const a = await getAuthorBySlug(decodeURIComponent(slug))
  if (!a) return {}
  return listingMetadata({
    title: `${a.name} | ${BLOG_NAME}`,
    description: a.bio || `Các bài viết của ${a.name} trên ${BLOG_NAME}.`,
    path: paths.author(a.slug as string),
  })
}

export default async function AuthorPage({ params }: Args) {
  const { slug } = await params
  const author = await getAuthorBySlug(decodeURIComponent(slug))
  if (!author) notFound()
  const posts = await getPostList({ authorId: author.id, limit: 100 })
  const avatar = mediaUrl(asMedia(author.avatar), 'thumb')
  const path = paths.author(author.slug as string)

  return (
    <main className="wrap">
      <Breadcrumb
        items={[
          { name: 'Trang chủ', path: '/' },
          { name: 'Blog', path: '/blog/' },
          { name: author.name, path },
        ]}
      />
      <JsonLd
        data={profilePageJsonLd({
          name: author.name,
          description: author.bio ?? undefined,
          path,
          image: avatar ?? undefined,
          sameAs: (author.sameAs ?? []).map((s) => s.url),
        })}
      />
      <section className="author-hero">
        <div className="avatar">
          {avatar ? <Image src={avatar} alt={author.name} width={96} height={96} /> : author.name.replace(/^Đội\s+/i, '').charAt(0)}
        </div>
        <div>
          <h1>{author.name}</h1>
          {author.jobTitle ? <div className="job">{author.jobTitle}</div> : null}
          {author.bio ? <p>{author.bio}</p> : null}
        </div>
      </section>
      <section className="lien-quan" aria-labelledby="bai-cua-tac-gia" style={{ paddingTop: 0 }}>
        <h2 id="bai-cua-tac-gia">Bài viết ({posts.totalDocs})</h2>
        <div className="posts three">
          {posts.docs.map((p) => (
            <PostCard key={p.id} post={p} headingLevel="h3" />
          ))}
        </div>
      </section>
    </main>
  )
}
