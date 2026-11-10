import type { Metadata } from 'next'

import type { Post } from '@/payload-types'

import { asAuthor, asCategory, asMedia } from './data-helpers'
import { mediaUrl } from './media'
import { absoluteUrl, BLOG_NAME, DEFAULT_OG_IMAGE, LOCALE, paths, SITE_NAME } from './site'

/** Ảnh chia sẻ của bài: ảnh SEO > ảnh đầu bài (cỡ 1200x630) > ảnh tự vẽ /blog/<slug>/og.png. */
export function postOgImage(post: Pick<Post, 'slug' | 'meta' | 'coverImage'>): string {
  const metaImage = asMedia(post.meta?.image)
  const cover = asMedia(post.coverImage)
  return mediaUrl(metaImage, 'og') || mediaUrl(cover, 'og') || paths.postOgImage(post.slug as string)
}

export function postDescription(post: Pick<Post, 'meta' | 'excerpt'>): string {
  return (post.meta?.description || post.excerpt || '').trim()
}

export function postTitle(post: Pick<Post, 'meta' | 'title'>): string {
  return post.meta?.title || `${post.title} | ${SITE_NAME}`
}

export function postMetadata(post: Post, opts: { draft?: boolean } = {}): Metadata {
  const url = absoluteUrl(paths.post(post.slug as string))
  const image = absoluteUrl(postOgImage(post))
  const description = postDescription(post)
  const title = postTitle(post)
  const author = asAuthor(post.author)
  const category = asCategory(post.category)
  const noindex = Boolean(post.noindex || opts.draft)
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url, types: { 'application/rss+xml': absoluteUrl(paths.rss) } },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true, 'max-image-preview': 'large' },
    openGraph: {
      type: 'article',
      url,
      siteName: SITE_NAME,
      locale: LOCALE,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt,
      section: category?.name,
      authors: author ? [absoluteUrl(paths.author(author.slug as string))] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export function listingMetadata(args: { title: string; description: string; path: string; page?: number }): Metadata {
  const url = absoluteUrl(args.path)
  const title = args.page && args.page > 1 ? `${args.title} — Trang ${args.page}` : args.title
  const image = absoluteUrl(DEFAULT_OG_IMAGE)
  return {
    title: { absolute: title },
    description: args.description,
    alternates: { canonical: url, types: { 'application/rss+xml': absoluteUrl(paths.rss) } },
    openGraph: {
      type: 'website',
      url,
      siteName: SITE_NAME,
      locale: LOCALE,
      title,
      description: args.description,
      images: [{ url: image, width: 1200, height: 630, alt: BLOG_NAME }],
    },
    twitter: { card: 'summary_large_image', title, description: args.description, images: [image] },
  }
}
