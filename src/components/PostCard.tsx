import Image from 'next/image'
import Link from 'next/link'

import type { Post } from '@/payload-types'

import { asAuthor, asCategory, asMedia } from '@/lib/data-helpers'
import { DICT, pathsFor, type Locale } from '@/i18n'
import { formatDate } from '@/lib/format'
import { postImage } from '@/lib/media'

export function PostMetaLine({ post, locale }: { post: Post; locale: Locale }) {
  const author = asAuthor(post.author)
  return (
    <span className="meta">
      {author ? `${author.name} · ` : ''}
      {post.publishedAt ? <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time> : null}
      {post.readingMinutes ? ` · ${DICT[locale].minRead(post.readingMinutes)}` : ''}
    </span>
  )
}

/** Thẻ bài trong lưới. headingLevel: h2 ở trang danh sách, h3 ở khối "bài liên quan" (dưới H2 khác). */
export function PostCard({
  post,
  locale,
  headingLevel = 'h2',
  priority = false,
}: {
  post: Post
  locale: Locale
  headingLevel?: 'h2' | 'h3'
  priority?: boolean
}) {
  const cover = asMedia(post.coverImage)
  const category = asCategory(post.category)
  const img = postImage(cover, 'card', pathsFor(locale).postOgImage(post.slug as string))
  const H = headingLevel
  return (
    <Link className="pcard" href={pathsFor(locale).post(post.slug as string)}>
      <div className="thumb">
        <Image
          src={img.src}
          alt={cover?.alt || post.title}
          width={800}
          height={450}
          sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 400px"
          priority={priority}
          unoptimized={img.generated}
        />
      </div>
      <div className="inner">
        {category ? <span className="tag">{category.name}</span> : null}
        <H>{post.title}</H>
        {post.excerpt ? <p>{post.excerpt}</p> : null}
        <PostMetaLine post={post} locale={locale} />
      </div>
    </Link>
  )
}

export function FeaturedPost({ post, locale }: { post: Post; locale: Locale }) {
  const cover = asMedia(post.coverImage)
  const category = asCategory(post.category)
  const img = postImage(cover, 'hero', pathsFor(locale).postOgImage(post.slug as string))
  return (
    <Link className="featured" href={pathsFor(locale).post(post.slug as string)}>
      <div className="thumb">
        <Image src={img.src} alt={cover?.alt || post.title} width={1200} height={630} sizes="(max-width:760px) 100vw, 640px" priority unoptimized={img.generated} />
      </div>
      <div className="body">
        <span className="badge">{DICT[locale].featured}</span>
        {category ? <span className="tag">{category.name}</span> : null}
        <h2>{post.title}</h2>
        {post.excerpt ? <p>{post.excerpt}</p> : null}
        <PostMetaLine post={post} locale={locale} />
      </div>
    </Link>
  )
}
