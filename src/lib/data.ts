// Đọc dữ liệu blog qua Payload Local API (gọi thẳng DB, không qua HTTP).
// overrideAccess: false => áp đúng quyền của khách: chỉ thấy bài đã đăng.
// Mọi hàm nhận `locale`; fallbackLocale: false => bài chưa dịch sang ngôn ngữ đó thì coi như không có.
import 'server-only'

import config from '@payload-config'
import { draftMode } from 'next/headers'
import { getPayload, type Where } from 'payload'
import { cache } from 'react'

import { DICT, LOCALES, pathsFor, type Locale } from '@/i18n'
import type { Author, BlogSetting, Category, Post } from '@/payload-types'

import { PAGE_SIZE } from './site'

export const payloadClient = cache(() => getPayload({ config }))

const published: Where = { _status: { equals: 'published' } }
/** Bài/chuyên mục đã có bản ở ngôn ngữ đang xem. */
const translated: Where = { title: { exists: true } }
const loc = (locale: Locale) => ({ locale, fallbackLocale: false as const })

export type PostListResult = { docs: Post[]; totalPages: number; totalDocs: number; page: number }

export const getPostList = cache(
  async (
    locale: Locale,
    page = 1,
    opts: { categoryId?: number; authorId?: number; excludeId?: number; limit?: number } = {},
  ): Promise<PostListResult> => {
    const payload = await payloadClient()
    const and: Where[] = [published, translated]
    if (opts.categoryId) and.push({ category: { equals: opts.categoryId } })
    if (opts.authorId) and.push({ author: { equals: opts.authorId } })
    if (opts.excludeId) and.push({ id: { not_equals: opts.excludeId } })
    const res = await payload.find({
      collection: 'posts',
      ...loc(locale),
      where: { and },
      sort: '-publishedAt',
      page,
      limit: opts.limit ?? PAGE_SIZE,
      depth: 1,
      overrideAccess: false,
      draft: false,
      select: { content: false, faq: false, relatedPosts: false },
    })
    return { docs: res.docs as Post[], totalPages: res.totalPages, totalDocs: res.totalDocs, page: res.page ?? 1 }
  },
)

/** Bài nổi bật mới nhất; không có thì bài mới nhất. */
export const getFeaturedPost = cache(async (locale: Locale): Promise<Post | null> => {
  const payload = await payloadClient()
  for (const where of [{ and: [published, translated, { featured: { equals: true } }] }, { and: [published, translated] }] as Where[]) {
    const res = await payload.find({
      collection: 'posts',
      ...loc(locale),
      where,
      sort: '-publishedAt',
      limit: 1,
      depth: 1,
      overrideAccess: false,
      select: { content: false, faq: false, relatedPosts: false },
    })
    if (res.docs[0]) return res.docs[0] as Post
  }
  return null
})

/** "Bài nên đọc" ở cột phụ: bài gắn nổi bật trước, thiếu thì bù bài mới nhất. */
export const getPicks = cache(async (locale: Locale, limit = 5): Promise<Post[]> => {
  const payload = await payloadClient()
  const featured = await payload.find({
    collection: 'posts',
    ...loc(locale),
    where: { and: [published, translated, { featured: { equals: true } }] },
    sort: '-publishedAt',
    limit,
    depth: 0,
    overrideAccess: false,
    select: { title: true, slug: true, publishedAt: true },
  })
  const picks = featured.docs as Post[]
  if (picks.length < limit) {
    const rest = await payload.find({
      collection: 'posts',
      ...loc(locale),
      where: { and: [published, translated, { id: { not_in: picks.map((p) => p.id) } }] },
      sort: '-publishedAt',
      limit: limit - picks.length,
      depth: 0,
      overrideAccess: false,
      select: { title: true, slug: true, publishedAt: true },
    })
    picks.push(...(rest.docs as Post[]))
  }
  return picks
})

export const getPostBySlug = cache(async (locale: Locale, slug: string): Promise<Post | null> => {
  const { isEnabled: draft } = await draftMode()
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'posts',
    ...loc(locale),
    where: { and: [{ slug: { equals: slug } }, translated] },
    limit: 1,
    depth: 2,
    draft,
    overrideAccess: draft,
    pagination: false,
  })
  return (res.docs[0] as Post) ?? null
})

/** Đường dẫn của cùng một bài ở mọi ngôn ngữ đã dịch (cho hreflang và nút đổi ngôn ngữ). */
export const getPostAlternates = cache(async (id: number): Promise<Partial<Record<Locale, string>>> => {
  const payload = await payloadClient()
  const out: Partial<Record<Locale, string>> = {}
  for (const locale of LOCALES) {
    const res = await payload.find({
      collection: 'posts',
      ...loc(locale),
      where: { and: [{ id: { equals: id } }, published, translated] },
      limit: 1,
      depth: 0,
      overrideAccess: false,
      select: { slug: true },
    })
    const slug = res.docs[0]?.slug
    if (slug) out[locale] = pathsFor(locale).post(slug)
  }
  return out
})

export const getAllPublishedSlugs = cache(async (locale: Locale): Promise<{ id: number; slug: string; updatedAt: string }[]> => {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'posts',
    ...loc(locale),
    where: { and: [published, translated, { noindex: { not_equals: true } }] },
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: false,
    select: { slug: true, updatedAt: true },
  })
  return res.docs.filter((d) => d.slug).map((d) => ({ id: d.id as number, slug: d.slug as string, updatedAt: d.updatedAt }))
})

/** Bài liên quan: chọn tay trước, thiếu thì bù bài cùng chuyên mục, rồi bài mới nhất. */
export const getRelatedPosts = cache(async (locale: Locale, post: Post, limit = 4): Promise<Post[]> => {
  const picked = (post.relatedPosts ?? []).filter((p): p is Post => typeof p === 'object' && p?._status === 'published' && Boolean(p.title))
  const out = picked.slice(0, limit)
  const exclude = () => [post.id, ...out.map((p) => p.id)]
  const payload = await payloadClient()
  const categoryId = typeof post.category === 'object' ? post.category?.id : post.category
  const fill = async (extra: Where[]) => {
    if (out.length >= limit) return
    const res = await payload.find({
      collection: 'posts',
      ...loc(locale),
      where: { and: [published, translated, { id: { not_in: exclude() } }, ...extra] },
      sort: '-publishedAt',
      limit: limit - out.length,
      depth: 1,
      overrideAccess: false,
      select: { content: false, faq: false, relatedPosts: false },
    })
    out.push(...(res.docs as Post[]))
  }
  if (categoryId) await fill([{ category: { equals: categoryId } }])
  await fill([])
  return out
})

export type CategoryWithCount = Category & { count: number }

/** Chuyên mục đã có tên ở ngôn ngữ đang xem, kèm số bài đã đăng (đã dịch). */
export const getCategories = cache(async (locale: Locale): Promise<CategoryWithCount[]> => {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'categories',
    ...loc(locale),
    where: { name: { exists: true } },
    sort: 'order',
    limit: 100,
    depth: 0,
    overrideAccess: false,
  })
  return Promise.all(
    res.docs.map(async (c) => {
      const { totalDocs } = await payload.count({
        collection: 'posts',
        locale,
        where: { and: [published, translated, { category: { equals: c.id } }] },
        overrideAccess: false,
      })
      return { ...(c as Category), count: totalDocs }
    }),
  )
})

export const getCategoryBySlug = cache(async (locale: Locale, slug: string): Promise<Category | null> => {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'categories',
    ...loc(locale),
    where: { and: [{ slug: { equals: slug } }, { name: { exists: true } }] },
    limit: 1,
    depth: 0,
  })
  return (res.docs[0] as Category) ?? null
})

/** Đường dẫn trang chuyên mục ở mọi ngôn ngữ có tên chuyên mục. */
export const getCategoryAlternates = cache(async (id: number): Promise<Partial<Record<Locale, string>>> => {
  const payload = await payloadClient()
  const out: Partial<Record<Locale, string>> = {}
  for (const locale of LOCALES) {
    const c = await payload.findByID({ collection: 'categories', id, ...loc(locale), depth: 0 })
    if (c?.name && c.slug) out[locale] = pathsFor(locale).category(c.slug)
  }
  return out
})

export const getAuthors = cache(async (locale: Locale): Promise<Author[]> => {
  const payload = await payloadClient()
  const res = await payload.find({ collection: 'authors', ...loc(locale), limit: 100, depth: 0 })
  return res.docs as Author[]
})

export const getAuthorBySlug = cache(async (locale: Locale, slug: string): Promise<Author | null> => {
  const payload = await payloadClient()
  const res = await payload.find({ collection: 'authors', ...loc(locale), where: { slug: { equals: slug } }, limit: 1, depth: 1 })
  return (res.docs[0] as Author) ?? null
})

/** Cài đặt blog theo ngôn ngữ; ô nào chưa nhập ở ngôn ngữ đó thì lấy chữ mặc định của site. */
export const getBlogSettings = cache(async (locale: Locale): Promise<BlogSetting> => {
  const payload = await payloadClient()
  const s = (await payload.findGlobal({ slug: 'blog-settings', ...loc(locale), depth: 0 })) as BlogSetting
  const d = DICT[locale]
  return {
    ...s,
    heroLabel: s.heroLabel || d.blogName,
    heroTitle: s.heroTitle || d.blogName,
    metaTitle: s.metaTitle || d.blogName,
    cta: {
      title: s.cta?.title ?? null,
      text: s.cta?.text ?? null,
      buttonLabel: s.cta?.buttonLabel || d.signupLong,
      url: s.cta?.url || 'https://app.realusers.net/dang-ky',
    },
  }
})

/** Chuyển hướng 301 khai báo trong trang quản trị (hoặc tự sinh khi đổi slug). */
export const getRedirectFor = cache(async (locale: Locale, from: string): Promise<{ to: string; permanent: boolean } | null> => {
  const payload = await payloadClient()
  const variants = Array.from(new Set([from, from.endsWith('/') ? from.slice(0, -1) : `${from}/`]))
  const res = await payload.find({ collection: 'redirects', ...loc(locale), where: { from: { in: variants } }, limit: 1, depth: 1 })
  const r = res.docs[0]
  if (!r) return null
  let to: string | null = null
  if (r.to?.type === 'reference' && r.to.reference && typeof r.to.reference.value === 'object') {
    const doc = r.to.reference.value as Post
    if (doc?.slug) to = pathsFor(locale).post(doc.slug)
  } else if (r.to?.url) {
    to = r.to.url
  }
  if (!to) return null
  return { to, permanent: (r as { type?: string }).type !== '302' }
})

export { asAuthor, asCategory, asMedia } from './data-helpers'
