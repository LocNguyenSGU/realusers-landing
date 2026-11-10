import Image from 'next/image'
import Link from 'next/link'

import type { Post } from '@/payload-types'

import { asAuthor, asCategory, asMedia } from '@/lib/data-helpers'
import { formatDateVN } from '@/lib/format'
import { mediaUrl } from '@/lib/media'
import { paths } from '@/lib/site'

export function PostMetaLine({ post }: { post: Post }) {
  const author = asAuthor(post.author)
  return (
    <span className="meta">
      {author ? `${author.name} · ` : ''}
      {post.publishedAt ? <time dateTime={post.publishedAt}>{formatDateVN(post.publishedAt)}</time> : null}
      {post.readingMinutes ? ` · ${post.readingMinutes} phút đọc` : ''}
    </span>
  )
}

/** Thẻ bài trong lưới. headingLevel: h2 ở trang danh sách, h3 ở khối "bài liên quan" (dưới H2 khác). */
export function PostCard({ post, headingLevel = 'h2', priority = false }: { post: Post; headingLevel?: 'h2' | 'h3'; priority?: boolean }) {
  const cover = asMedia(post.coverImage)
  const category = asCategory(post.category)
  const src = mediaUrl(cover, 'card')
  const H = headingLevel
  return (
    <Link className="pcard" href={paths.post(post.slug as string)}>
      {src ? (
        <div className="thumb">
          <Image src={src} alt={cover?.alt || post.title} width={800} height={450} sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 400px" priority={priority} />
        </div>
      ) : null}
      <div className="inner">
        {category ? <span className="tag">{category.name}</span> : null}
        <H>{post.title}</H>
        {post.excerpt ? <p>{post.excerpt}</p> : null}
        <PostMetaLine post={post} />
      </div>
    </Link>
  )
}

export function FeaturedPost({ post }: { post: Post }) {
  const cover = asMedia(post.coverImage)
  const category = asCategory(post.category)
  const src = mediaUrl(cover, 'hero')
  return (
    <Link className="featured" href={paths.post(post.slug as string)}>
      {src ? (
        <div className="thumb">
          <Image src={src} alt={cover?.alt || post.title} width={1200} height={630} sizes="(max-width:760px) 100vw, 640px" priority />
        </div>
      ) : null}
      <div className="body">
        <span className="badge">Bài nổi bật</span>
        {category ? <span className="tag">{category.name}</span> : null}
        <h2>{post.title}</h2>
        {post.excerpt ? <p>{post.excerpt}</p> : null}
        <PostMetaLine post={post} />
      </div>
    </Link>
  )
}
