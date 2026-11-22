// Công cụ MCP viết / đăng / hẹn giờ bài, chạy trên Payload + Postgres thật (DB test riêng).
import { createLocalReq, getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@payload-config'
import { blogOverview, cancelSchedule, createPost, getPost, saveCategory, schedulePost, updatePost } from '@/mcp/tools'
import type { User } from '@/payload-types'

let payload: Payload
let editorReq: PayloadRequest
let writerReq: PayloadRequest
const ctx = { disableRevalidate: true }

const MARKDOWN = `# Seeding Threads là gì

Seeding là gieo những cuộc trò chuyện thật quanh sản phẩm.

## Vì sao thương hiệu nhỏ nên làm

Vì khách tin người dùng khác hơn quảng cáo. Xem thêm [cách tăng tương tác](/blog/cach-tang-tuong-tac-tren-threads/).

<Callout tone="tip" title="Mẹo nhỏ">Trả lời trong 1 giờ đầu.</Callout>

### Ba bước bắt đầu

- Chọn chủ đề
- Viết câu hỏi mở
- Trả lời bình luận

<Cta title="Thử RealUsers" buttonLabel="Tạo tài khoản" url="https://app.realusers.net/dang-ky">Làm đều mỗi ngày.</Cta>
`

async function wipe() {
  for (const collection of ['payload-jobs', 'redirects', 'posts', 'categories', 'authors', 'media', 'users'] as const) {
    await payload.delete({ collection, where: { id: { exists: true } }, context: ctx, overrideAccess: true })
  }
}

async function reqFor(user: User): Promise<PayloadRequest> {
  const req = await createLocalReq({ user: { ...user, collection: 'users' } as never, context: ctx }, payload)
  return req
}

/** Giả lập tới giờ hẹn: kéo waitUntil của job về quá khứ rồi chạy hàng đợi như cron. */
async function runDueSchedules() {
  const jobs = await payload.find({ collection: 'payload-jobs', where: { completedAt: { exists: false } }, limit: 100 })
  for (const job of jobs.docs) {
    await payload.update({ collection: 'payload-jobs', id: job.id, data: { waitUntil: new Date(Date.now() - 1000).toISOString() } })
  }
  await payload.jobs.run()
}

const inOneDay = () => new Date(Date.now() + 24 * 3600_000).toISOString().replace('Z', '+00:00')

beforeAll(async () => {
  payload = await getPayload({ config })
  await wipe()
  await payload.create({ collection: 'users', data: { email: 'admin@test.vn', password: 'matkhau-123', name: 'Admin', role: 'admin' } })
  const editor = await payload.create({ collection: 'users', data: { email: 'ai@test.vn', password: 'matkhau-123', name: 'AI', role: 'editor' } })
  const writer = await payload.create({ collection: 'users', data: { email: 'w@test.vn', password: 'matkhau-123', name: 'W', role: 'writer' } })
  await payload.create({ collection: 'categories', locale: 'vi', context: ctx, data: { name: 'Seeding', slug: 'seeding', generateSlug: false } })
  await payload.create({ collection: 'authors', locale: 'vi', context: ctx, data: { name: 'Đội RealUsers', kind: 'organization', slug: 'doi-realusers', generateSlug: false } })
  editorReq = await reqFor(editor)
  writerReq = await reqFor(writer)
})

afterAll(async () => {
  await wipe()
  await payload.destroy()
})

describe('createPost', () => {
  it('đổi markdown sang nội dung bài: bỏ H1, giữ H2/H3, danh sách, link, khối Callout và Cta; lưu nháp, khách chưa thấy', async () => {
    const res = await createPost(editorReq, {
      title: 'Seeding Threads là gì? Hướng dẫn cho người mới',
      excerpt: 'Seeding Threads là gì và bắt đầu thế nào.',
      markdown: MARKDOWN,
      category: 'seeding',
      faq: [{ question: 'Seeding có phải spam không?', answer: 'Không, nếu nội dung có ích.' }],
      metaTitle: 'Seeding Threads là gì',
    })
    expect(res.status).toBe('draft')
    expect(res.slug).toBe('seeding-threads-la-gi-huong-dan-cho-nguoi-moi')
    expect(res.url).toBeNull()

    const doc = await payload.findByID({ collection: 'posts', id: res.id, draft: true, depth: 1, locale: 'vi' })
    const nodes = doc.content.root.children as { type: string; tag?: string; fields?: { blockType: string } }[]
    expect(nodes.some((n) => n.type === 'heading' && n.tag === 'h1')).toBe(false)
    expect(nodes.filter((n) => n.type === 'heading').map((n) => n.tag)).toEqual(['h2', 'h3'])
    expect(nodes.filter((n) => n.type === 'block').map((n) => n.fields?.blockType)).toEqual(['callout', 'cta'])
    expect(nodes.some((n) => n.type === 'list')).toBe(true)
    expect(doc.readingMinutes).toBeGreaterThan(0)
    expect(doc.meta?.title).toBe('Seeding Threads là gì | RealUsers')
    expect(typeof doc.author === 'object' && doc.author?.name).toBe('Đội RealUsers')

    const publicView = await payload.find({ collection: 'posts', where: { id: { equals: res.id } }, overrideAccess: false })
    expect(publicView.docs).toHaveLength(0)
  })

  it('đọc lại bằng getPost ra markdown sửa được', async () => {
    const { docs } = await payload.find({ collection: 'posts', draft: true, limit: 1 })
    const post = await getPost(editorReq, { id: docs[0].id })
    expect(post.markdown).toContain('## Vì sao thương hiệu nhỏ nên làm')
    expect(post.markdown).toMatch(/<callout[^>]*tone="tip"/i)
    expect(post.markdown).not.toMatch(/^# /m)
    // Gửi lại đúng markdown đó (AI sửa rồi lưu): khối Callout / Cta vẫn còn
    await updatePost(editorReq, { id: docs[0].id, markdown: post.markdown })
    const doc = await payload.findByID({ collection: 'posts', id: docs[0].id, draft: true, locale: 'vi' })
    const blocks = (doc.content.root.children as { type: string; fields?: { blockType: string } }[]).filter((n) => n.type === 'block')
    expect(blocks.map((b) => b.fields?.blockType)).toEqual(['callout', 'cta'])
  })

  it('không cho trùng slug', async () => {
    await expect(
      createPost(editorReq, { title: 'Seeding Threads là gì? Hướng dẫn cho người mới', excerpt: 'x', markdown: '## A\n\nB', category: 'seeding' }),
    ).rejects.toThrow(/đã dùng cho bài/)
  })

  it('chuyên mục sai thì báo kèm danh sách chuyên mục đang có', async () => {
    await expect(createPost(editorReq, { title: 'Bài X', excerpt: 'x', markdown: '## A\n\nB', category: 'khong-co' })).rejects.toThrow(/seeding \(id/)
  })

  it('tài khoản writer lưu nháp được, đăng hoặc hẹn giờ thì bị chặn', async () => {
    const draft = await createPost(writerReq, { title: 'Bài của writer', excerpt: 'x', markdown: '## A\n\nB', category: 'seeding' })
    expect(draft.status).toBe('draft')
    await expect(createPost(writerReq, { title: 'Bài writer 2', excerpt: 'x', markdown: '## A\n\nB', category: 'seeding', action: 'publish' })).rejects.toThrow(/writer/)
    await expect(schedulePost(writerReq, { id: draft.id, publishAt: inOneDay() })).rejects.toThrow(/writer/)
  })

  it('action publish đăng ngay, có link công khai và ngày đăng', async () => {
    const res = await createPost(editorReq, { title: 'Đăng ngay', excerpt: 'x', markdown: '## A\n\nB', category: 'seeding', action: 'publish' })
    expect(res.status).toBe('published')
    expect(res.url).toMatch(/\/blog\/dang-ngay\/$/)
    expect(res.publishedAt).toBeTruthy()
  })
})

describe('saveCategory', () => {
  it('tạo chuyên mục kèm tên tiếng Anh; gọi lại cùng slug thì sửa, không tạo trùng; writer bị chặn', async () => {
    const a = await saveCategory(editorReq, { name: 'Đo lường', nameEn: 'Measurement', description: 'Đo hiệu quả' })
    expect(a).toMatchObject({ created: true, slug: 'do-luong', nameEn: 'Measurement', slugEn: 'measurement' })
    const b = await saveCategory(editorReq, { name: 'Đo lường', description: 'Đo hiệu quả trên Threads' })
    expect(b).toMatchObject({ created: false, id: a.id })
    await expect(saveCategory(writerReq, { name: 'Khác' })).rejects.toThrow(/writer/)
    const post = await createPost(editorReq, { title: 'Bài đo lường', excerpt: 'x', markdown: '## A\n\nB', category: 'do-luong' })
    expect(post.status).toBe('draft')
  })
})

describe('bản tiếng Anh', () => {
  it('updatePost locale en thêm bản dịch với slug tiếng Anh, bản tiếng Việt giữ nguyên', async () => {
    const vi = await payload.find({ collection: 'posts', draft: true, where: { slug: { equals: 'seeding-threads-la-gi-huong-dan-cho-nguoi-moi' } }, locale: 'vi' })
    const id = vi.docs[0].id
    const en = await updatePost(editorReq, {
      id,
      locale: 'en',
      title: 'What is Threads seeding? A beginner guide',
      excerpt: 'What Threads seeding is and how to start.',
      markdown: '## Why small brands should do it\n\nBecause people trust people.',
    })
    expect(en.slug).toBe('what-is-threads-seeding-a-beginner-guide')
    const viAgain = await payload.findByID({ collection: 'posts', id, draft: true, locale: 'vi' })
    expect(viAgain.title).toBe('Seeding Threads là gì? Hướng dẫn cho người mới')
    expect(viAgain.slug).toBe('seeding-threads-la-gi-huong-dan-cho-nguoi-moi')
  })

  it('blogOverview liệt kê đủ tiêu đề hai ngôn ngữ (không lẫn locale giữa các truy vấn)', async () => {
    const o = await blogOverview(editorReq)
    const post = o.posts.find((p) => p.slug === 'seeding-threads-la-gi-huong-dan-cho-nguoi-moi')
    expect(post?.title).toBe('Seeding Threads là gì? Hướng dẫn cho người mới')
    expect(post?.titleEn).toBe('What is Threads seeding? A beginner guide')
    expect(o.posts.every((p) => p.title)).toBe(true)
    expect(o.categories.find((c) => c.slug === 'seeding')).toMatchObject({ name: 'Seeding' })
  })
})

describe('hẹn giờ đăng', () => {
  it('schedulePost tạo lịch; tới giờ thì bài được đăng cả hai ngôn ngữ', async () => {
    const vi = await payload.find({ collection: 'posts', draft: true, where: { slug: { equals: 'seeding-threads-la-gi-huong-dan-cho-nguoi-moi' } }, locale: 'vi' })
    const id = vi.docs[0].id

    const first = await schedulePost(editorReq, { id, publishAt: inOneDay() })
    expect(first.scheduled).toHaveLength(1)
    // Hẹn lại: lịch cũ tự huỷ, chỉ còn một lịch
    const again = await schedulePost(editorReq, { id, publishAt: new Date(Date.now() + 48 * 3600_000).toISOString() })
    expect(again.scheduled).toHaveLength(1)
    expect((await blogOverview(editorReq)).scheduled.map((s) => s.postId)).toContain(id)

    await runDueSchedules()

    const live = await payload.find({ collection: 'posts', where: { id: { equals: id } }, overrideAccess: false, locale: 'vi' })
    expect(live.docs[0]?._status).toBe('published')
    expect(live.docs[0]?.publishedAt).toBeTruthy()
    const liveEn = await payload.find({ collection: 'posts', where: { id: { equals: id } }, overrideAccess: false, locale: 'en', fallbackLocale: false })
    expect(liveEn.docs[0]?.title).toBe('What is Threads seeding? A beginner guide')
    expect((await getPost(editorReq, { id })).scheduled).toHaveLength(0)
  })

  it('sửa bài đang đăng thì lưu nháp, bản đang đăng không đổi tới khi lịch chạy', async () => {
    const vi = await payload.find({ collection: 'posts', where: { slug: { equals: 'dang-ngay' } }, locale: 'vi' })
    const id = vi.docs[0].id
    const res = await updatePost(editorReq, { id, title: 'Đăng ngay (bản sửa)', action: 'schedule', publishAt: inOneDay() })
    expect(res.status).toBe('published')
    expect(res.hasUnpublishedChanges).toBe(true)
    const before = await payload.find({ collection: 'posts', where: { id: { equals: id } }, overrideAccess: false })
    expect(before.docs[0].title).toBe('Đăng ngay')

    await runDueSchedules()
    const after = await payload.find({ collection: 'posts', where: { id: { equals: id } }, overrideAccess: false })
    expect(after.docs[0].title).toBe('Đăng ngay (bản sửa)')
    // Slug của bài đã đăng không tự đổi theo tiêu đề
    expect(after.docs[0].slug).toBe('dang-ngay')
  })

  it('cancelSchedule huỷ lịch, bài vẫn là nháp', async () => {
    const draft = await createPost(editorReq, { title: 'Bài huỷ lịch', excerpt: 'x', markdown: '## A\n\nB', category: 'seeding', action: 'schedule', publishAt: inOneDay() })
    expect(draft.scheduled).toHaveLength(1)
    const res = await cancelSchedule(editorReq, { id: draft.id })
    expect(res.cancelled).toBe(1)
    expect(res.scheduled).toHaveLength(0)
    await runDueSchedules()
    expect((await getPost(editorReq, { id: draft.id })).status).toBe('draft')
  })

  it('giờ hẹn thiếu múi giờ hoặc đã qua thì báo lỗi rõ', async () => {
    const { docs } = await payload.find({ collection: 'posts', draft: true, limit: 1 })
    await expect(schedulePost(editorReq, { id: docs[0].id, publishAt: '2026-11-23T08:00:00' })).rejects.toThrow(/múi giờ/)
    await expect(schedulePost(editorReq, { id: docs[0].id, publishAt: '2020-01-01T08:00:00+07:00' })).rejects.toThrow(/tương lai/)
  })
})
