import type { Metadata } from 'next'

import { DEFAULT_LOCALE, DICT, OG_LOCALE, pathsFor, type Locale } from '@/i18n'
import type { Post } from '@/payload-types'

import { asAuthor, asCategory, asMedia } from './data-helpers'
import { mediaUrl } from './media'
import { absoluteUrl, DEFAULT_OG_IMAGE, SITE_NAME } from './site'

export type Alternates = Partial<Record<Locale, string>>

/**
 * hreflang: mỗi ngôn ngữ đã có bản dịch một link, cộng x-default trỏ bản tiếng Việt (hoặc bản duy nhất).
 * Chỉ khai khi có từ 2 bản trở lên; một bản thì canonical là đủ.
 */
export function languageAlternates(alts: Alternates): Record<string, string> | undefined {
  const entries = Object.entries(alts).filter(([, v]) => Boolean(v)) as [Locale, string][]
  if (entries.length < 2) return undefined
  const out: Record<string, string> = {}
  for (const [l, p] of entries) out[l] = absoluteUrl(p)
  out['x-default'] = absoluteUrl(alts[DEFAULT_LOCALE] ?? entries[0][1])
  return out
}

/** Ảnh chia sẻ của bài: ảnh SEO > ảnh đầu bài (cỡ 1200x630) > ảnh tự vẽ <bài>/og.png. */
export function postOgImage(post: Pick<Post, 'slug' | 'meta' | 'coverImage'>, locale: Locale = DEFAULT_LOCALE): string {
  const metaImage = asMedia(post.meta?.image)
  const cover = asMedia(post.coverImage)
  return mediaUrl(metaImage, 'og') || mediaUrl(cover, 'og') || pathsFor(locale).postOgImage(post.slug as string)
}

export function postDescription(post: Pick<Post, 'meta' | 'excerpt'>): string {
  return (post.meta?.description || post.excerpt || '').trim()
}

export function postTitle(post: Pick<Post, 'meta' | 'title'>): string {
  return post.meta?.title || `${post.title} | ${SITE_NAME}`
}

export function postMetadata(post: Post, opts: { locale?: Locale; draft?: boolean; alternates?: Alternates } = {}): Metadata {
  const locale = opts.locale ?? DEFAULT_LOCALE
  const p = pathsFor(locale)
  const url = absoluteUrl(p.post(post.slug as string))
  const image = absoluteUrl(postOgImage(post, locale))
  const description = postDescription(post)
  const title = postTitle(post)
  const author = asAuthor(post.author)
  const category = asCategory(post.category)
  const noindex = Boolean(post.noindex || opts.draft)
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: url,
      languages: languageAlternates(opts.alternates ?? {}),
      types: { 'application/rss+xml': absoluteUrl(p.rss) },
    },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true, 'max-image-preview': 'large' },
    openGraph: {
      type: 'article',
      url,
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale],
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt,
      section: category?.name,
      authors: author ? [absoluteUrl(p.author(author.slug as string))] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export function listingMetadata(args: {
  title: string
  description: string
  path: string
  page?: number
  locale?: Locale
  alternates?: Alternates
}): Metadata {
  const locale = args.locale ?? DEFAULT_LOCALE
  const url = absoluteUrl(args.path)
  const title = args.page && args.page > 1 ? `${args.title} — ${DICT[locale].pageN(args.page)}` : args.title
  const image = absoluteUrl(DEFAULT_OG_IMAGE)
  return {
    title: { absolute: title },
    description: args.description,
    alternates: {
      canonical: url,
      languages: languageAlternates(args.alternates ?? {}),
      types: { 'application/rss+xml': absoluteUrl(pathsFor(locale).rss) },
    },
    openGraph: {
      type: 'website',
      url,
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale],
      title,
      description: args.description,
      images: [{ url: image, width: 1200, height: 630, alt: DICT[locale].blogName }],
    },
    twitter: { card: 'summary_large_image', title, description: args.description, images: [image] },
  }
}
