import type { MetadataRoute } from 'next'

import { DEFAULT_LOCALE, LOCALES, pathsFor, type Locale } from '@/i18n'
import { getAllPublishedSlugs, getAuthors, getCategories, getCategoryAlternates, getPostAlternates } from '@/lib/data'
import { languageAlternates } from '@/lib/seo'
import { absoluteUrl } from '@/lib/site'

const langs = (alts: Partial<Record<Locale, string>>) => {
  const l = languageAlternates(alts)
  return l ? { languages: l } : undefined
}

// Đọc thẳng từ DB: bài mới đăng/sửa thì hook revalidate làm mới file này, lastmod là giờ sửa thật.
// Mỗi ngôn ngữ một dòng, kèm link sang bản dịch (hreflang) khi bài đã được dịch.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Landing có đủ mọi ngôn ngữ (file tĩnh public/landing*.html), nên luôn khai đủ và trỏ chéo nhau.
  const homeAlts = Object.fromEntries(LOCALES.map((l) => [l, pathsFor(l).home]))
  const out: MetadataRoute.Sitemap = LOCALES.map((l) => ({
    url: absoluteUrl(pathsFor(l).home),
    changeFrequency: 'weekly' as const,
    priority: l === DEFAULT_LOCALE ? 1 : 0.9,
    alternates: langs(homeAlts),
  }))
  const blogAlts = Object.fromEntries(LOCALES.map((l) => [l, pathsFor(l).blog]))

  for (const locale of LOCALES) {
    const p = pathsFor(locale)
    const [posts, categories, authors] = await Promise.all([getAllPublishedSlugs(locale), getCategories(locale), getAuthors(locale)])
    if (locale !== DEFAULT_LOCALE && posts.length === 0) continue
    const latest = posts.reduce<string | undefined>((max, x) => (!max || x.updatedAt > max ? x.updatedAt : max), undefined)
    out.push({ url: absoluteUrl(p.blog), lastModified: latest, changeFrequency: 'daily', priority: 0.8, alternates: langs(blogAlts) })
    for (const post of posts) {
      out.push({
        url: absoluteUrl(p.post(post.slug)),
        lastModified: post.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.7,
        alternates: langs(await getPostAlternates(post.id)),
      })
    }
    for (const c of categories.filter((c) => c.count > 0)) {
      out.push({
        url: absoluteUrl(p.category(c.slug as string)),
        changeFrequency: 'weekly',
        priority: 0.5,
        alternates: langs(await getCategoryAlternates(c.id)),
      })
    }
    for (const a of authors) {
      out.push({ url: absoluteUrl(p.author(a.slug as string)), changeFrequency: 'monthly', priority: 0.3 })
    }
  }
  return out
}
