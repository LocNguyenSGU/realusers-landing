import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { draftMode } from 'next/headers'
import { notFound, permanentRedirect, redirect } from 'next/navigation'

import { Breadcrumb } from '@/components/Breadcrumb'
import { JsonLd } from '@/components/JsonLd'
import { PostCard } from '@/components/PostCard'
import { RichText } from '@/components/RichText'
import { ShareButtons } from '@/components/ShareButtons'
import {
  asAuthor,
  asCategory,
  asMedia,
  getAllPublishedSlugs,
  getBlogSettings,
  getPostBySlug,
  getRedirectFor,
  getRelatedPosts,
} from '@/lib/data'
import { dayKey, formatDateVN } from '@/lib/format'
import { blogPostingJsonLd, faqJsonLd } from '@/lib/jsonld'
import { countWords, plainText, tableOfContents, type RichTextValue } from '@/lib/lexical'
import { mediaUrl } from '@/lib/media'
import { postDescription, postMetadata, postOgImage } from '@/lib/seo'
import { absoluteUrl, paths } from '@/lib/site'

type Args = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs()
  return slugs.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(decodeURIComponent(slug))
  if (!post) return {}
  const { isEnabled: draft } = await draftMode()
  return postMetadata(post, { draft })
}

export default async function PostPage({ params }: Args) {
  const { slug: raw } = await params
  const slug = decodeURIComponent(raw)
  const post = await getPostBySlug(slug)

  if (!post) {
    const r = await getRedirectFor(paths.post(slug))
    if (r) (r.permanent ? permanentRedirect : redirect)(r.to)
    notFound()
  }

  const [settings, related] = await Promise.all([getBlogSettings(), getRelatedPosts(post)])
  const category = asCategory(post.category)
  const author = asAuthor(post.author)
  const cover = asMedia(post.coverImage)
  const coverSrc = mediaUrl(cover, 'hero')
  const toc = tableOfContents(post.content as RichTextValue)
  const url = absoluteUrl(paths.post(post.slug as string))
  const updated = post.publishedAt && dayKey(post.updatedAt) > dayKey(post.publishedAt) ? post.updatedAt : null
  const faq = (post.faq ?? []).filter((f) => f.question && f.answer)
  const cta = settings.cta

  const crumbs = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Blog', path: '/blog/' },
    ...(category ? [{ name: category.name, path: paths.category(category.slug as string) }] : []),
    { name: post.title, path: paths.post(post.slug as string) },
  ]

  return (
    <main className="wrap">
      <Breadcrumb items={crumbs} />
      <JsonLd
        data={blogPostingJsonLd({
          title: post.title,
          description: postDescription(post),
          path: paths.post(post.slug as string),
          image: postOgImage(post),
          publishedAt: post.publishedAt || post.createdAt,
          updatedAt: post.updatedAt,
          section: category?.name,
          wordCount: countWords(plainText(post.content as RichTextValue)),
          author: author
            ? { name: author.name, path: paths.author(author.slug as string), sameAs: (author.sameAs ?? []).map((s) => s.url) }
            : null,
        })}
      />
      {faq.length ? <JsonLd data={faqJsonLd(faq.map((f) => ({ question: f.question, answer: f.answer })))} /> : null}

      <article>
        <header className="post-head">
          {category ? (
            <Link className="tag" href={paths.category(category.slug as string)}>
              {category.name}
            </Link>
          ) : null}
          <h1>{post.title}</h1>
          {post.excerpt ? <p className="sapo">{post.excerpt}</p> : null}
          <p className="byline">
            {author ? <Link href={paths.author(author.slug as string)}>{author.name}</Link> : <span>Đội RealUsers</span>}
            {post.publishedAt ? (
              <span>
                Đăng <time dateTime={post.publishedAt}>{formatDateVN(post.publishedAt)}</time>
              </span>
            ) : null}
            {updated ? (
              <span>
                Cập nhật <time dateTime={updated}>{formatDateVN(updated)}</time>
              </span>
            ) : null}
            {post.readingMinutes ? <span>{post.readingMinutes} phút đọc</span> : null}
          </p>
        </header>

        {coverSrc ? (
          <figure className="cover">
            <Image src={coverSrc} alt={cover?.alt || post.title} width={1600} height={840} sizes="(max-width:1200px) 100vw, 1152px" priority />
          </figure>
        ) : null}

        <div className="post-layout">
          <div className="post-main">
            {toc.length >= 3 ? (
              <details className="toc-mobile">
                <summary>Mục lục</summary>
                <ol>
                  {toc.map((t) => (
                    <li key={t.id} className={`l${t.level}`}>
                      <a href={`#${t.id}`}>{t.text}</a>
                    </li>
                  ))}
                </ol>
              </details>
            ) : null}

            <RichText data={post.content} />

            {faq.length ? (
              <section className="faq" aria-labelledby="cau-hoi">
                <h2 id="cau-hoi">Câu hỏi thường gặp</h2>
                {faq.map((f) => (
                  <details key={f.id ?? f.question}>
                    <summary>{f.question}</summary>
                    <p>{f.answer}</p>
                  </details>
                ))}
              </section>
            ) : null}

            <ShareButtons url={url} title={post.title} />

            {cta?.title ? (
              <aside className="chot">
                <h2>{cta.title}</h2>
                {cta.text ? <p>{cta.text}</p> : null}
                {cta.url ? (
                  <a className="btn btn-primary" href={cta.url}>
                    {cta.buttonLabel || 'Bắt đầu ngay'}
                  </a>
                ) : null}
              </aside>
            ) : null}

            {author ? (
              <aside className="author-box" aria-label="Về tác giả">
                <div className="avatar">
                  {mediaUrl(asMedia(author.avatar), 'thumb') ? (
                    <Image src={mediaUrl(asMedia(author.avatar), 'thumb') as string} alt={author.name} width={64} height={64} />
                  ) : (
                    author.name.replace(/^Đội\s+/i, '').charAt(0)
                  )}
                </div>
                <div>
                  <span className="label">Về tác giả</span>
                  <h2>
                    <Link href={paths.author(author.slug as string)}>{author.name}</Link>
                  </h2>
                  {author.bio ? <p>{author.bio}</p> : null}
                </div>
              </aside>
            ) : null}
          </div>

          {toc.length >= 3 ? (
            <nav className="toc" aria-label="Mục lục">
              <h2>Mục lục</h2>
              <ol>
                {toc.map((t) => (
                  <li key={t.id} className={`l${t.level}`}>
                    <a href={`#${t.id}`}>{t.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
        </div>
      </article>

      {related.length ? (
        <section className="lien-quan" aria-labelledby="doc-them">
          <h2 id="doc-them">Bài viết liên quan</h2>
          <div className="posts">
            {related.map((p) => (
              <PostCard key={p.id} post={p} headingLevel="h3" />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}
