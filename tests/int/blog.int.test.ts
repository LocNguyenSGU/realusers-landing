// Test tích hợp với Payload + Postgres thật (DB test riêng, xem vitest.config.mts).
import fs from 'fs'
import path from 'path'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@payload-config'
import { seedOldPosts, type OldPostsFile } from '@/seed/oldPosts'

let payload: Payload
const root = process.cwd()
const oldPosts = JSON.parse(fs.readFileSync(path.join(root, 'seed/old-posts.json'), 'utf8')) as OldPostsFile
const ctx = { disableRevalidate: true }

const emptyContent = (t: string) =>
  ({
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          textFormat: 0,
          children: [{ type: 'text', text: t, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
        },
      ],
    },
  }) as never

async function wipe() {
  for (const collection of ['redirects', 'posts', 'categories', 'authors', 'media', 'users'] as const) {
    await payload.delete({ collection, where: { id: { exists: true } }, context: ctx })
  }
}

beforeAll(async () => {
  payload = await getPayload({ config })
  await wipe()
})

afterAll(async () => {
  await wipe()
  await payload.destroy()
})

describe('chuyển 3 bài cũ', () => {
  it('tạo đủ 3 bài đã đăng, giữ slug và ngày 20/10/2026; chạy lại không tạo trùng', async () => {
    const first = await seedOldPosts(payload, oldPosts, { imagesDir: path.join(root, 'public/anh') })
    expect(first.created).toEqual(oldPosts.posts.map((p) => p.slug))

    const again = await seedOldPosts(payload, oldPosts, { imagesDir: path.join(root, 'public/anh') })
    expect(again.created).toEqual([])
    expect(again.skipped).toHaveLength(3)

    const { docs } = await payload.find({ collection: 'posts', overrideAccess: false, depth: 1, limit: 10 })
    expect(docs).toHaveLength(3)
    for (const p of docs) {
      expect(p._status).toBe('published')
      expect(p.publishedAt?.startsWith('2026-10-20')).toBe(true)
      // Bài cũ giữ ngày sửa = ngày đăng (không hiện "Cập nhật hôm nay", sitemap không báo đổi)
      expect(p.updatedAt).toBe(p.publishedAt)
      expect(p.readingMinutes).toBeGreaterThan(0)
      expect(typeof p.coverImage === 'object' && p.coverImage?.alt).toBeTruthy()
      expect(p.meta?.title?.endsWith('| RealUsers')).toBe(true)
    }
  })
})

describe('quyền', () => {
  it('tài khoản đầu tiên tự thành admin', async () => {
    const u = await payload.create({ collection: 'users', data: { email: 'admin@test.vn', password: 'matkhau-123', name: 'Admin', role: 'writer' } })
    expect(u.role).toBe('admin')
  })

  it('khách không thấy bản nháp', async () => {
    const cat = await payload.find({ collection: 'categories', limit: 1 })
    const draft = await payload.create({
      collection: 'posts',
      draft: true,
      context: ctx,
      data: { title: 'Bài nháp', slug: 'bai-nhap', excerpt: 'x', content: emptyContent('nháp'), category: cat.docs[0].id, _status: 'draft' },
    })
    const publicView = await payload.find({ collection: 'posts', where: { slug: { equals: 'bai-nhap' } }, overrideAccess: false })
    expect(publicView.docs).toHaveLength(0)
    await payload.delete({ collection: 'posts', id: draft.id, context: ctx })
  })

  it('người viết lưu nháp được nhưng không đăng được', async () => {
    const writer = await payload.create({
      collection: 'users',
      data: { email: 'writer@test.vn', password: 'matkhau-123', name: 'Writer', role: 'writer' },
    })
    const cat = await payload.find({ collection: 'categories', limit: 1 })
    const base = { title: 'Bài của người viết', excerpt: 'x', content: emptyContent('xin chào'), category: cat.docs[0].id }

    const saved = await payload.create({
      collection: 'posts',
      draft: true,
      user: writer,
      overrideAccess: false,
      context: ctx,
      data: { ...base, slug: 'bai-nguoi-viet', _status: 'draft' },
    })
    expect(saved._status).toBe('draft')

    await expect(
      payload.update({ collection: 'posts', id: saved.id, user: writer, overrideAccess: false, context: ctx, data: { _status: 'published' } }),
    ).rejects.toThrow(/chỉ được lưu nháp/)
    await payload.delete({ collection: 'posts', id: saved.id, context: ctx })
  })
})

describe('slug và chuyển hướng', () => {
  it('tạo bài qua API không gửi slug thì tự sinh slug tiếng Việt không dấu từ tiêu đề', async () => {
    const cat = await payload.find({ collection: 'categories', limit: 1 })
    const post = await payload.create({
      collection: 'posts',
      context: ctx,
      // Không có slug: kiểu dữ liệu bắt buộc slug nên ép kiểu, đúng như một lời gọi REST thiếu slug.
      data: { title: 'Đăng bài Threads lúc mấy giờ?', excerpt: 'x', content: emptyContent('x'), category: cat.docs[0].id, _status: 'published' } as never,
    })
    expect(post.slug).toBe('dang-bai-threads-luc-may-gio')
    await payload.delete({ collection: 'posts', id: post.id, context: ctx })
  })

  it('không cho dùng slug trùng đường dẫn hệ thống', async () => {
    const cat = await payload.find({ collection: 'categories', limit: 1 })
    await expect(
      payload.create({
        collection: 'posts',
        context: ctx,
        data: { title: 'Trang', slug: 'trang', generateSlug: false, excerpt: 'x', content: emptyContent('x'), category: cat.docs[0].id, _status: 'published' },
      }),
    ).rejects.toThrow()
  })

  it('đổi slug bài đã đăng thì tự thêm chuyển hướng 301 từ link cũ', async () => {
    const { docs } = await payload.find({ collection: 'posts', where: { slug: { equals: 'cach-tang-tuong-tac-tren-threads' } } })
    const post = docs[0]
    await payload.update({
      collection: 'posts',
      id: post.id,
      context: ctx,
      data: { slug: 'tang-tuong-tac-threads', generateSlug: false, _status: 'published' },
    })
    const r = await payload.find({ collection: 'redirects', where: { from: { equals: '/blog/cach-tang-tuong-tac-tren-threads/' } }, depth: 1 })
    expect(r.docs).toHaveLength(1)
    expect(r.docs[0].type).toBe('301')
    const target = r.docs[0].to?.reference?.value
    expect(typeof target === 'object' && target?.slug).toBe('tang-tuong-tac-threads')
  })
})

describe('đa ngôn ngữ', () => {
  it('bài có bản tiếng Anh: mỗi ngôn ngữ một slug, chưa dịch thì không lấy chữ tiếng Việt đắp vào', async () => {
    const { docs } = await payload.find({ collection: 'posts', locale: 'vi', where: { slug: { equals: 'threads-la-gi-thuong-hieu-co-nen-lam' } } })
    const id = docs[0].id

    const before = await payload.findByID({ collection: 'posts', id, locale: 'en', fallbackLocale: false, overrideAccess: false })
    expect(before.title ?? null).toBeNull()

    await payload.update({
      collection: 'posts',
      id,
      locale: 'en',
      context: ctx,
      data: { title: 'What is Threads?', slug: 'what-is-threads', generateSlug: false, excerpt: 'Intro', content: emptyContent('Hello'), _status: 'published' },
    })
    const en = await payload.findByID({ collection: 'posts', id, locale: 'en', fallbackLocale: false })
    const vi = await payload.findByID({ collection: 'posts', id, locale: 'vi', fallbackLocale: false })
    expect(en.slug).toBe('what-is-threads')
    expect(vi.slug).toBe('threads-la-gi-thuong-hieu-co-nen-lam')
    expect(vi.title).toContain('Threads là gì')
  })

  it('đổi slug bản tiếng Anh thì chuyển hướng từ link /en/ cũ', async () => {
    const { docs } = await payload.find({ collection: 'posts', locale: 'en', where: { slug: { equals: 'what-is-threads' } } })
    await payload.update({
      collection: 'posts',
      id: docs[0].id,
      locale: 'en',
      context: ctx,
      data: { slug: 'what-is-threads-app', generateSlug: false, _status: 'published' },
    })
    const r = await payload.find({ collection: 'redirects', where: { from: { equals: '/en/blog/what-is-threads/' } } })
    expect(r.docs).toHaveLength(1)
  })
})
