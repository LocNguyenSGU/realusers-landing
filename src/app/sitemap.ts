import type { MetadataRoute } from 'next'

import { getAllPublishedSlugs, getAuthors, getCategories } from '@/lib/data'
import { absoluteUrl, paths } from '@/lib/site'

// Đọc thẳng từ DB: bài mới đăng/sửa thì hook revalidate làm mới file này, lastmod là giờ sửa thật.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, authors] = await Promise.all([getAllPublishedSlugs(), getCategories(), getAuthors()])
  const latest = posts.reduce<string | undefined>((max, p) => (!max || p.updatedAt > max ? p.updatedAt : max), undefined)
  return [
    { url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/blog/'), lastModified: latest, changeFrequency: 'daily', priority: 0.8 },
    ...posts.map((p) => ({
      url: absoluteUrl(paths.post(p.slug)),
      lastModified: p.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...categories
      .filter((c) => c.count > 0)
      .map((c) => ({ url: absoluteUrl(paths.category(c.slug as string)), changeFrequency: 'weekly' as const, priority: 0.5 })),
    ...authors.map((a) => ({ url: absoluteUrl(paths.author(a.slug as string)), changeFrequency: 'monthly' as const, priority: 0.3 })),
  ]
}
