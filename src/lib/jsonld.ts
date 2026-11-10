// Dữ liệu có cấu trúc (schema.org) cho Google. Hàm thuần: nhận dữ liệu đã chuẩn hoá, trả object JSON-LD.
import type { BlogPosting, BreadcrumbList, CollectionPage, FAQPage, Organization, ProfilePage, WithContext } from 'schema-dts'

import { absoluteUrl, BLOG_NAME, SITE_NAME, SITE_URL } from './site'

export const organization = (): Organization => ({
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  logo: { '@type': 'ImageObject', url: absoluteUrl('/anh/og-realusers.jpg') },
})

export type Crumb = { name: string; path: string }

export function breadcrumbJsonLd(crumbs: Crumb[]): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  }
}

export type PostForJsonLd = {
  title: string
  description: string
  path: string
  image: string
  publishedAt: string
  updatedAt: string
  section?: string
  wordCount?: number
  author: { name: string; path?: string; sameAs?: string[] } | null
}

export function blogPostingJsonLd(p: PostForJsonLd): WithContext<BlogPosting> {
  const url = absoluteUrl(p.path)
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: p.title,
    description: p.description,
    image: [absoluteUrl(p.image)],
    datePublished: p.publishedAt,
    dateModified: p.updatedAt,
    inLanguage: 'vi',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    ...(p.section ? { articleSection: p.section } : {}),
    ...(p.wordCount ? { wordCount: p.wordCount } : {}),
    author: p.author
      ? {
          '@type': 'Person',
          name: p.author.name,
          ...(p.author.path ? { url: absoluteUrl(p.author.path) } : {}),
          ...(p.author.sameAs?.length ? { sameAs: p.author.sameAs } : {}),
        }
      : organization(),
    publisher: organization(),
  }
}

export function faqJsonLd(items: { question: string; answer: string }[]): WithContext<FAQPage> | null {
  const valid = items.filter((i) => i.question?.trim() && i.answer?.trim())
  if (!valid.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: valid.map((i) => ({
      '@type': 'Question',
      name: i.question,
      acceptedAnswer: { '@type': 'Answer', text: i.answer },
    })),
  }
}

export function collectionPageJsonLd(args: { name: string; description: string; path: string }): WithContext<CollectionPage> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: args.name,
    description: args.description,
    url: absoluteUrl(args.path),
    inLanguage: 'vi',
    isPartOf: { '@type': 'Blog', name: BLOG_NAME, url: absoluteUrl('/blog/') },
    publisher: organization(),
  }
}

export function profilePageJsonLd(args: { name: string; description?: string; path: string; image?: string; sameAs?: string[] }): WithContext<ProfilePage> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: absoluteUrl(args.path),
    mainEntity: {
      '@type': 'Person',
      name: args.name,
      ...(args.description ? { description: args.description } : {}),
      ...(args.image ? { image: absoluteUrl(args.image) } : {}),
      ...(args.sameAs?.length ? { sameAs: args.sameAs } : {}),
    },
  }
}

/** Chuỗi an toàn để nhét vào <script type="application/ld+json">: chặn `</script>` trong dữ liệu. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
