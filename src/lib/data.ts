// Đọc dữ liệu blog qua Payload Local API (gọi thẳng DB, không qua HTTP).
// overrideAccess: false => áp đúng quyền của khách: chỉ thấy bài đã đăng.
import 'server-only'

import config from '@payload-config'
import { draftMode } from 'next/headers'
import { getPayload, type Where } from 'payload'
import { cache } from 'react'

import type { Author, BlogSetting, Category, Post } from '@/payload-types'

import { PAGE_SIZE } from './site'

export const payloadClient = cache(() => getPayload({ config }))

const published: Where = { _status: { equals: 'published' } }

export type PostListResult = { docs: Post[]; totalPages: number; totalDocs: number; page: number }

export const getPostList = cache(
  async (args: { page?: number; categoryId?: number; authorId?: number; excludeId?: number; limit?: number }): Promise<PostListResult> => {
    const payload = await payloadClient()
    const and: Where[] = [published]
    if (args.categoryId) and.push({ category: { equals: args.categoryId } })
    if (args.authorId) and.push({ author: { equals: args.authorId } })
    if (args.excludeId) and.push({ id: { not_equals: args.excludeId } })
    const res = await payload.find({
      collection: 'posts',
      where: { and },
      sort: '-publishedAt',
      page: args.page ?? 1,
      limit: args.limit ?? PAGE_SIZE,
      depth: 1,
      overrideAccess: false,
      draft: false,
      select: { content: false, faq: false, relatedPosts: false },
    })
    return { docs: res.docs as Post[], totalPages: res.totalPages, totalDocs: res.totalDocs, page: res.page ?? 1 }
  },
)

/** Bài nổi bật mới nhất; không có thì bài mới nhất. */
export const getFeaturedPost = cache(async (): Promise<Post | null> => {
  const payload = await payloadClient()
  for (const where of [{ and: [published, { featured: { equals: true } }] }, published] as Where[]) {
    const res = await payload.find({
      collection: 'posts',
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
export const getPicks = cache(async (limit = 5): Promise<Post[]> => {
  const payload = await payloadClient()
  const featured = await payload.find({
    collection: 'posts',
    where: { and: [published, { featured: { equals: true } }] },
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
      where: { and: [published, { id: { not_in: picks.map((p) => p.id) } }] },
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

export const getPostBySlug = cache(async (slug: string): Promise<Post | null> => {
  const { isEnabled: draft } = await draftMode()
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
    draft,
    overrideAccess: draft,
    pagination: false,
  })
  return (res.docs[0] as Post) ?? null
})

export const getAllPublishedSlugs = cache(async (): Promise<{ slug: string; updatedAt: string }[]> => {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'posts',
    where: { and: [published, { noindex: { not_equals: true } }] },
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: false,
    select: { slug: true, updatedAt: true },
  })
  return res.docs.filter((d) => d.slug).map((d) => ({ slug: d.slug as string, updatedAt: d.updatedAt }))
})

/** Bài liên quan: chọn tay trước, thiếu thì bù bài cùng chuyên mục, rồi bài mới nhất. */
export const getRelatedPosts = cache(async (post: Post, limit = 4): Promise<Post[]> => {
  const picked = (post.relatedPosts ?? []).filter((p): p is Post => typeof p === 'object' && p?._status === 'published')
  const out = picked.slice(0, limit)
  const exclude = () => [post.id, ...out.map((p) => p.id)]
  const payload = await payloadClient()
  const categoryId = typeof post.category === 'object' ? post.category?.id : post.category
  const fill = async (extra: Where[]) => {
    if (out.length >= limit) return
    const res = await payload.find({
      collection: 'posts',
      where: { and: [published, { id: { not_in: exclude() } }, ...extra] },
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

export const getCategories = cache(async (): Promise<CategoryWithCount[]> => {
  const payload = await payloadClient()
  const res = await payload.find({ collection: 'categories', sort: 'order', limit: 100, depth: 0, overrideAccess: false })
  const withCount = await Promise.all(
    res.docs.map(async (c) => {
      const { totalDocs } = await payload.count({
        collection: 'posts',
        where: { and: [published, { category: { equals: c.id } }] },
        overrideAccess: false,
      })
      return { ...(c as Category), count: totalDocs }
    }),
  )
  return withCount
})

export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
  const payload = await payloadClient()
  const res = await payload.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  return (res.docs[0] as Category) ?? null
})

export const getAuthors = cache(async (): Promise<Author[]> => {
  const payload = await payloadClient()
  const res = await payload.find({ collection: 'authors', limit: 100, depth: 0 })
  return res.docs as Author[]
})

export const getAuthorBySlug = cache(async (slug: string): Promise<Author | null> => {
  const payload = await payloadClient()
  const res = await payload.find({ collection: 'authors', where: { slug: { equals: slug } }, limit: 1, depth: 1 })
  return (res.docs[0] as Author) ?? null
})

export const getBlogSettings = cache(async (): Promise<BlogSetting> => {
  const payload = await payloadClient()
  return (await payload.findGlobal({ slug: 'blog-settings', depth: 0 })) as BlogSetting
})

/** Chuyển hướng 301 khai báo trong trang quản trị (hoặc tự sinh khi đổi slug). */
export const getRedirectFor = cache(async (from: string): Promise<{ to: string; permanent: boolean } | null> => {
  const payload = await payloadClient()
  const variants = Array.from(new Set([from, from.endsWith('/') ? from.slice(0, -1) : `${from}/`]))
  const res = await payload.find({
    collection: 'redirects',
    where: { from: { in: variants } },
    limit: 1,
    depth: 1,
  })
  const r = res.docs[0]
  if (!r) return null
  let to: string | null = null
  if (r.to?.type === 'reference' && r.to.reference && typeof r.to.reference.value === 'object') {
    const doc = r.to.reference.value as Post
    if (doc?.slug) to = `/blog/${doc.slug}/`
  } else if (r.to?.url) {
    to = r.to.url
  }
  if (!to) return null
  return { to, permanent: (r as { type?: string }).type !== '302' }
})

export { asAuthor, asCategory, asMedia } from './data-helpers'
