// Công cụ MCP cho AI viết và đăng bài blog. Mỗi hàm nhận PayloadRequest đã gắn tài khoản của API key,
// chạy với overrideAccess: false nên quyền theo vai trò tài khoản (writer chỉ lưu nháp, editor/admin được đăng).
import type { Payload, PayloadRequest, Where } from 'payload'

import { roleOf } from '@/access'
import { DEFAULT_LOCALE, pathsFor, type Locale } from '@/i18n'
import { absoluteUrl, SITE_NAME } from '@/lib/site'
import { slugify } from '@/lib/slugify'
import type { Post, Topic } from '@/payload-types'
import { TOPIC_STATUSES, type TopicStatus } from '@/collections/Topics'

import { hasMarkdownTable, markdownToPostContent, postContentToMarkdown } from './markdown'

/** Lỗi trả nguyên văn cho AI đọc và tự sửa. */
export class ToolError extends Error {}

export const TIMEZONE = 'Asia/Ho_Chi_Minh'
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export type PublishAction = 'draft' | 'publish' | 'schedule'

export type PostInput = {
  title?: string
  excerpt?: string
  markdown?: string
  category?: string
  author?: string
  slug?: string
  faq?: { question: string; answer: string }[]
  metaTitle?: string
  metaDescription?: string
  coverImageId?: number | null
  featured?: boolean
}

// ---------- hàm thuần (test đơn vị) ----------

/** Giờ hẹn phải có múi giờ và ở tương lai. */
export function parsePublishAt(value: string, now: Date = new Date()): Date {
  const v = value.trim()
  if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(v)) {
    throw new ToolError('publishAt phải ghi múi giờ, ví dụ "2026-11-23T08:00:00+07:00" (giờ Việt Nam).')
  }
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) throw new ToolError(`publishAt không đọc được: "${value}".`)
  if (d.getTime() <= now.getTime() + 60_000) {
    throw new ToolError('publishAt phải ở tương lai (ít nhất 1 phút nữa). Muốn đăng ngay thì dùng action "publish".')
  }
  return d
}

/** Tiêu đề Google lưu ở meta.title là tiêu đề đầy đủ (site dùng nguyên văn): thêm " | RealUsers" nếu thiếu. */
export function fullMetaTitle(title: string): string {
  const t = title.trim()
  return new RegExp(`\\|\\s*${SITE_NAME}$`, 'i').test(t) ? t : `${t} | ${SITE_NAME}`
}

/** Ngày theo giờ Việt Nam, dạng YYYY-MM-DD. */
export function vnDate(d: Date | string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(d))
}

export function vnTime(d: Date | string): string {
  return new Intl.DateTimeFormat('vi-VN', { timeZone: TIMEZONE, dateStyle: 'short', timeStyle: 'short' }).format(new Date(d))
}

// ---------- tiện ích ----------

function requireUser(req: PayloadRequest) {
  if (!req.user) throw new ToolError('Chưa đăng nhập (API key không gắn tài khoản).')
  return req.user
}

function requirePublisher(req: PayloadRequest) {
  requireUser(req)
  if (!['admin', 'editor'].includes(roleOf(req) ?? '')) {
    throw new ToolError('Tài khoản của API key là người viết (writer): chỉ lưu nháp được. Đăng hoặc hẹn giờ cần tài khoản editor/admin.')
  }
}

const ops = (req: PayloadRequest) => ({ req, overrideAccess: false as const, user: req.user })

const adminUrl = (id: number) => absoluteUrl(`/admin/collections/posts/${id}`)

async function resolveCategory(req: PayloadRequest, ref: string): Promise<number> {
  const { payload } = req
  if (/^\d+$/.test(ref)) return Number(ref)
  for (const locale of ['vi', 'en'] as const) {
    const res = await payload.find({ collection: 'categories', locale, where: { slug: { equals: ref } }, limit: 1, depth: 0, ...ops(req) })
    if (res.docs[0]) return res.docs[0].id
  }
  const all = await payload.find({ collection: 'categories', locale: 'vi', limit: 100, depth: 0, ...ops(req) })
  throw new ToolError(`Không có chuyên mục "${ref}". Chuyên mục đang có: ${all.docs.map((c) => `${c.slug} (id ${c.id})`).join(', ') || '(chưa có)'}.`)
}

async function resolveAuthor(req: PayloadRequest, ref: string): Promise<number> {
  const { payload } = req
  if (/^\d+$/.test(ref)) return Number(ref)
  const res = await payload.find({ collection: 'authors', where: { slug: { equals: ref } }, limit: 1, depth: 0, ...ops(req) })
  if (res.docs[0]) return res.docs[0].id
  const all = await payload.find({ collection: 'authors', limit: 100, depth: 0, ...ops(req) })
  throw new ToolError(`Không có tác giả "${ref}". Tác giả đang có: ${all.docs.map((a) => `${a.slug} (id ${a.id})`).join(', ') || '(chưa có)'}.`)
}

/** Tác giả mặc định: tác giả tạo sớm nhất (thường là "Đội RealUsers"). */
async function defaultAuthor(req: PayloadRequest): Promise<number | undefined> {
  const res = await req.payload.find({ collection: 'authors', sort: 'createdAt', limit: 1, depth: 0, ...ops(req) })
  return res.docs[0]?.id
}

async function assertSlugFree(req: PayloadRequest, slug: string, locale: Locale, selfId?: number) {
  const where: Where = { and: [{ slug: { equals: slug } }, ...(selfId ? [{ id: { not_equals: selfId } }] : [])] }
  const res = await req.payload.find({ collection: 'posts', locale, where, draft: true, limit: 1, depth: 0, ...ops(req) })
  if (res.docs[0]) throw new ToolError(`Đường dẫn "${slug}" (${locale}) đã dùng cho bài id ${res.docs[0].id}. Chọn slug khác.`)
}

async function buildData(req: PayloadRequest, input: PostInput, existing?: Post): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {}
  if (input.title !== undefined) data.title = input.title.trim()
  if (input.excerpt !== undefined) data.excerpt = input.excerpt.trim()
  if (input.markdown !== undefined) {
    if (!input.markdown.trim()) throw new ToolError('markdown đang trống.')
    if (hasMarkdownTable(input.markdown)) {
      throw new ToolError('Blog chưa hỗ trợ bảng markdown (sẽ hiện thành chữ có dấu "|"). Viết lại bảng thành danh sách gạch đầu dòng.')
    }
    data.content = await markdownToPostContent(req.payload, input.markdown)
  }
  if (input.faq !== undefined) data.faq = input.faq.map(({ question, answer }) => ({ question: question.trim(), answer: answer.trim() }))
  if (input.category !== undefined) data.category = await resolveCategory(req, input.category)
  if (input.author !== undefined) data.author = await resolveAuthor(req, input.author)
  if (input.coverImageId !== undefined) data.coverImage = input.coverImageId
  if (input.featured !== undefined) data.featured = input.featured
  if (input.metaTitle !== undefined || input.metaDescription !== undefined) {
    const meta = { ...(existing?.meta ?? {}) } as Record<string, unknown>
    if (input.metaTitle !== undefined) meta.title = input.metaTitle.trim() ? fullMetaTitle(input.metaTitle) : null
    if (input.metaDescription !== undefined) meta.description = input.metaDescription.trim() || null
    if (meta.image && typeof meta.image === 'object') meta.image = (meta.image as { id: number }).id
    data.meta = meta
  }
  return data
}

type ScheduledJob = { jobId: number | string; postId: number; locale: string; publishAt: string; publishAtVN: string }

async function upcomingJobs(payload: Payload, postId?: number): Promise<ScheduledJob[]> {
  const and: Where[] = [{ taskSlug: { equals: 'schedulePublish' } }, { completedAt: { exists: false } }, { hasError: { not_equals: true } }, { 'input.doc.relationTo': { equals: 'posts' } }]
  if (postId !== undefined) and.push({ 'input.doc.value': { equals: String(postId) } })
  const res = await payload.find({ collection: 'payload-jobs', where: { and }, sort: 'waitUntil', limit: 200, depth: 0, overrideAccess: true })
  return res.docs.map((job) => {
    const input = (job.input ?? {}) as { doc?: { value?: string | number }; locale?: string; type?: string }
    const waitUntil = String(job.waitUntil)
    return { jobId: job.id, postId: Number(input.doc?.value), locale: input.locale || 'all', publishAt: waitUntil, publishAtVN: vnTime(waitUntil) }
  })
}

async function cancelJobs(req: PayloadRequest, postId: number): Promise<number> {
  const jobs = await upcomingJobs(req.payload, postId)
  if (!jobs.length) return 0
  await req.payload.delete({
    collection: 'payload-jobs',
    where: { and: [{ id: { in: jobs.map((j) => j.jobId) } }, { processing: { equals: false } }] },
    overrideAccess: true,
    req,
  })
  return jobs.length
}

async function summary(req: PayloadRequest, id: number, locale: Locale) {
  const { payload } = req
  const latest = (await payload.findByID({ collection: 'posts', id, locale, fallbackLocale: false, draft: true, depth: 0, ...ops(req) })) as Post
  const live = (await payload.findByID({ collection: 'posts', id, locale, fallbackLocale: false, draft: false, depth: 0, ...ops(req) })) as Post
  const published = live._status === 'published'
  return {
    id,
    locale,
    status: published ? 'published' : 'draft',
    hasUnpublishedChanges: published && latest.updatedAt !== live.updatedAt,
    title: latest.title ?? null,
    slug: latest.slug ?? null,
    publishedAt: live.publishedAt ?? null,
    url: published && live.slug ? absoluteUrl(pathsFor(locale).post(live.slug)) : null,
    adminUrl: adminUrl(id),
    scheduled: await upcomingJobs(payload, id),
  }
}

// ---------- công cụ ----------

export async function blogOverview(req: PayloadRequest) {
  const user = requireUser(req)
  const { payload } = req
  // Chạy lần lượt, không Promise.all: Payload ghi locale vào req dùng chung, chạy song song thì truy vấn
  // tiếng Việt có thể chạy với locale "en" và trả về ô trống (lỗi đã gặp khi thử qua /api/mcp).
  const catVi = await payload.find({ collection: 'categories', locale: 'vi', fallbackLocale: false, limit: 100, depth: 0, ...ops(req) })
  const catEn = await payload.find({ collection: 'categories', locale: 'en', fallbackLocale: false, limit: 100, depth: 0, ...ops(req) })
  const authors = await payload.find({ collection: 'authors', locale: 'vi', limit: 100, depth: 0, ...ops(req) })
  // draft: true = bản mới nhất (kể cả nháp, bản dịch chưa đăng); draft: false = bản đang hiện trên site.
  const postsBy = async (locale: Locale, draft: boolean) =>
    payload.find({
      collection: 'posts',
      locale,
      fallbackLocale: false,
      draft,
      limit: 300,
      depth: 0,
      sort: '-createdAt',
      select: { title: true, slug: true, _status: true, publishedAt: true, category: true },
      ...ops(req),
    })
  const latestVi = await postsBy('vi', true)
  const latestEn = new Map((await postsBy('en', true)).docs.map((p) => [p.id, p]))
  const liveVi = new Map((await postsBy('vi', false)).docs.map((p) => [p.id, p]))
  const liveEn = new Map((await postsBy('en', false)).docs.map((p) => [p.id, p]))
  return {
    now: new Date().toISOString(),
    nowVN: vnTime(new Date()),
    timezone: TIMEZONE,
    you: { email: (user as { email?: string }).email, role: roleOf(req) },
    categories: catVi.docs.map((c) => {
      const e = catEn.docs.find((x) => x.id === c.id)
      return { id: c.id, slug: c.slug, name: c.name, slugEn: e?.slug ?? null, nameEn: e?.name ?? null }
    }),
    authors: authors.docs.map((a) => ({ id: a.id, slug: a.slug, name: a.name, kind: a.kind })),
    posts: latestVi.docs.map((p) => {
      const live = liveVi.get(p.id)
      const liveE = liveEn.get(p.id)
      const published = live?._status === 'published'
      return {
        id: p.id,
        status: published ? 'published' : 'draft',
        category: p.category,
        title: p.title ?? null,
        slug: p.slug ?? null,
        url: published && live?.slug ? pathsFor('vi').post(live.slug) : null,
        titleEn: latestEn.get(p.id)?.title ?? null,
        slugEn: latestEn.get(p.id)?.slug ?? null,
        urlEn: published && liveE?.slug && liveE?.title ? pathsFor('en').post(liveE.slug) : null,
        publishedAt: live?.publishedAt ?? null,
      }
    }),
    scheduled: await upcomingJobs(payload),
    topics: (await listTopics(req, { status: 'cho-viet', limit: 10 })).topics,
  }
}

export async function getPost(req: PayloadRequest, args: { id?: number; slug?: string; locale?: Locale }) {
  requireUser(req)
  const { payload } = req
  const locale = args.locale ?? DEFAULT_LOCALE
  let id = args.id
  if (id === undefined) {
    if (!args.slug) throw new ToolError('Cần id hoặc slug.')
    const res = await payload.find({ collection: 'posts', locale, where: { slug: { equals: args.slug } }, draft: true, limit: 1, depth: 0, ...ops(req) })
    if (!res.docs[0]) throw new ToolError(`Không có bài slug "${args.slug}" (${locale}).`)
    id = res.docs[0].id
  }
  const doc = (await payload.findByID({ collection: 'posts', id, locale, fallbackLocale: false, draft: true, depth: 0, ...ops(req) })) as Post
  return {
    ...(await summary(req, id, locale)),
    excerpt: doc.excerpt ?? null,
    markdown: await postContentToMarkdown(payload, doc.content),
    faq: (doc.faq ?? []).map(({ question, answer }) => ({ question, answer })),
    category: doc.category,
    author: doc.author ?? null,
    coverImageId: typeof doc.coverImage === 'object' ? (doc.coverImage?.id ?? null) : (doc.coverImage ?? null),
    metaTitle: doc.meta?.title ?? null,
    metaDescription: doc.meta?.description ?? null,
    featured: Boolean(doc.featured),
  }
}

export async function createPost(
  req: PayloadRequest,
  args: PostInput & { title: string; excerpt: string; markdown: string; category: string; action?: PublishAction; publishAt?: string; topicId?: number },
) {
  requireUser(req)
  if (args.topicId !== undefined) await req.payload.findByID({ collection: 'topics', id: args.topicId, depth: 0, ...ops(req) })
  const action = args.action ?? 'draft'
  if (action !== 'draft') requirePublisher(req)
  const publishAt = action === 'schedule' ? parsePublishAt(args.publishAt ?? '') : null

  const data = await buildData(req, args)
  const slug = slugify(args.slug || args.title)
  if (!slug) throw new ToolError('Không tạo được slug từ tiêu đề, hãy truyền slug.')
  await assertSlugFree(req, slug, 'vi')
  data.slug = slug
  data.generateSlug = false
  if (args.author === undefined) data.author = await defaultAuthor(req)
  data._status = action === 'publish' ? 'published' : 'draft'

  const doc = await req.payload.create({ collection: 'posts', locale: 'vi', data: data as never, draft: action !== 'publish', depth: 0, ...ops(req) })
  if (publishAt) await queueSchedule(req, doc.id, publishAt)
  if (args.topicId !== undefined) await markTopicWritten(req, args.topicId, doc.id)
  return summary(req, doc.id, 'vi')
}

export async function updatePost(
  req: PayloadRequest,
  args: PostInput & { id: number; locale?: Locale; action?: PublishAction; publishAt?: string; topicId?: number },
) {
  requireUser(req)
  const locale = args.locale ?? DEFAULT_LOCALE
  const action = args.action ?? 'draft'
  if (action !== 'draft') requirePublisher(req)
  const publishAt = action === 'schedule' ? parsePublishAt(args.publishAt ?? '') : null

  const existing = (await req.payload.findByID({ collection: 'posts', id: args.id, locale, fallbackLocale: false, draft: true, depth: 0, ...ops(req) })) as Post
  const data = await buildData(req, args, existing)
  if (args.slug) {
    data.slug = slugify(args.slug)
  } else if (!existing.slug && (args.title || existing.title)) {
    // Bản dịch mới chưa có đường dẫn: sinh từ tiêu đề ngôn ngữ đó.
    data.slug = slugify(args.title || existing.title)
  }
  if (data.slug) {
    await assertSlugFree(req, data.slug as string, locale, args.id)
    data.generateSlug = false
  }
  if (action === 'publish') data._status = 'published'

  await req.payload.update({ collection: 'posts', id: args.id, locale, data: data as never, draft: action !== 'publish', depth: 0, ...ops(req) })
  if (publishAt) await queueSchedule(req, args.id, publishAt)
  // Đăng ngay thì bỏ lịch hẹn cũ: để lại, tới giờ job sẽ tự đăng bản nháp mới nhất dù chưa ai duyệt.
  if (action === 'publish') await cancelJobs(req, args.id)
  if (args.topicId !== undefined) await markTopicWritten(req, args.topicId, args.id)
  return summary(req, args.id, locale)
}

async function queueSchedule(req: PayloadRequest, postId: number, publishAt: Date, locale?: Locale) {
  const user = requireUser(req)
  await cancelJobs(req, postId)
  await req.payload.jobs.queue({
    task: 'schedulePublish' as never,
    input: {
      type: 'publish',
      doc: { relationTo: 'posts', value: String(postId) },
      ...(locale ? { locale } : {}),
      user: { relationTo: 'users', value: user.id },
    } as never,
    waitUntil: publishAt,
    req,
  })
}

export async function schedulePost(req: PayloadRequest, args: { id: number; publishAt: string; locale?: Locale }) {
  requirePublisher(req)
  const publishAt = parsePublishAt(args.publishAt)
  // Kiểm bài tồn tại và tài khoản sửa được bài này.
  await req.payload.findByID({ collection: 'posts', id: args.id, draft: true, depth: 0, ...ops(req) })
  await queueSchedule(req, args.id, publishAt, args.locale)
  return summary(req, args.id, args.locale ?? DEFAULT_LOCALE)
}

export async function cancelSchedule(req: PayloadRequest, args: { id: number }) {
  requirePublisher(req)
  const cancelled = await cancelJobs(req, args.id)
  return { cancelled, ...(await summary(req, args.id, DEFAULT_LOCALE)) }
}

export async function uploadImage(req: PayloadRequest, args: { url: string; alt: string; altEn?: string }) {
  requireUser(req)
  let url: URL
  try {
    url = new URL(args.url)
  } catch {
    throw new ToolError(`Link ảnh không hợp lệ: ${args.url}`)
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new ToolError('Chỉ nhận link http(s).')
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000), redirect: 'follow' })
  if (!res.ok) throw new ToolError(`Tải ảnh lỗi ${res.status} từ ${url.href}`)
  const mimetype = (res.headers.get('content-type') ?? '').split(';')[0].trim()
  if (!mimetype.startsWith('image/')) throw new ToolError(`Link không phải ảnh (content-type: ${mimetype || 'không rõ'}).`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length > MAX_IMAGE_BYTES) throw new ToolError('Ảnh lớn hơn 10MB.')
  const ext = mimetype.split('/')[1]?.replace('jpeg', 'jpg').replace(/\+.*$/, '') || 'jpg'
  const base = slugify(decodeURIComponent(url.pathname.split('/').pop() ?? '').replace(/\.[a-z0-9]+$/i, '')) || 'anh'
  const media = await req.payload.create({
    collection: 'media',
    locale: 'vi',
    data: { alt: args.alt.trim() },
    file: { data: buf, mimetype, name: `${base}.${ext}`, size: buf.length },
    depth: 0,
    ...ops(req),
  })
  if (args.altEn?.trim()) {
    await req.payload.update({ collection: 'media', id: media.id, locale: 'en', data: { alt: args.altEn.trim() }, depth: 0, ...ops(req) })
  }
  return { id: media.id, url: media.url, alt: media.alt }
}

/** Tạo chuyên mục mới, hoặc sửa chuyên mục đã có (tìm theo slug tiếng Việt). Cần editor/admin. */
export async function saveCategory(
  req: PayloadRequest,
  args: { name: string; slug?: string; description?: string; nameEn?: string; slugEn?: string; descriptionEn?: string; order?: number },
) {
  requirePublisher(req)
  const { payload } = req
  const slug = slugify(args.slug || args.name)
  if (!slug) throw new ToolError('Không tạo được slug từ tên chuyên mục, hãy truyền slug.')
  const found = await payload.find({ collection: 'categories', locale: 'vi', where: { slug: { equals: slug } }, limit: 1, depth: 0, ...ops(req) })
  const vi = { name: args.name.trim(), slug, generateSlug: false, ...(args.description !== undefined ? { description: args.description.trim() } : {}), ...(args.order !== undefined ? { order: args.order } : {}) }
  const doc = found.docs[0]
    ? await payload.update({ collection: 'categories', id: found.docs[0].id, locale: 'vi', data: vi, depth: 0, ...ops(req) })
    : await payload.create({ collection: 'categories', locale: 'vi', data: vi, depth: 0, ...ops(req) })
  if (args.nameEn?.trim()) {
    await payload.update({
      collection: 'categories',
      id: doc.id,
      locale: 'en',
      data: { name: args.nameEn.trim(), slug: slugify(args.slugEn || args.nameEn), generateSlug: false, ...(args.descriptionEn !== undefined ? { description: args.descriptionEn.trim() } : {}) },
      depth: 0,
      ...ops(req),
    })
  }
  const en = await payload.findByID({ collection: 'categories', id: doc.id, locale: 'en', fallbackLocale: false, depth: 0, ...ops(req) })
  return { id: doc.id, created: !found.docs[0], slug, name: vi.name, slugEn: en.slug ?? null, nameEn: en.name ?? null }
}


// ---------- chủ đề chờ viết ----------

const topicView = (t: Topic) => ({
  id: t.id,
  keyword: t.keyword,
  title: t.title ?? null,
  supportingKeywords: t.supportingKeywords ?? null,
  notes: t.notes ?? null,
  keywordEn: t.keywordEn ?? null,
  titleEn: t.titleEn ?? null,
  publishOn: t.publishOn ? vnDate(t.publishOn) : null,
  status: t.status,
  category: typeof t.category === 'object' && t.category ? (t.category.slug ?? t.category.id) : (t.category ?? null),
  postId: typeof t.post === 'object' && t.post ? t.post.id : (t.post ?? null),
})

/** Chủ đề theo trạng thái, ngày muốn đăng sớm nhất trước (chưa có ngày thì xếp cuối). */
export async function listTopics(req: PayloadRequest, args: { status?: TopicStatus | 'all'; limit?: number }) {
  requireUser(req)
  const status = args.status ?? 'cho-viet'
  const res = await req.payload.find({
    collection: 'topics',
    where: status === 'all' ? {} : { status: { equals: status } },
    sort: ['publishOn', 'createdAt'],
    limit: Math.min(Math.max(args.limit ?? 20, 1), 200),
    depth: 1,
    ...ops(req),
  })
  // Postgres xếp NULL cuối khi tăng dần, đúng ý "chưa có ngày thì để sau".
  return { total: res.totalDocs, topics: res.docs.map((t) => topicView(t as Topic)) }
}

export type TopicInput = {
  id?: number
  keyword?: string
  title?: string
  supportingKeywords?: string
  notes?: string
  keywordEn?: string
  titleEn?: string
  publishOn?: string | null
  status?: TopicStatus
  category?: string | null
}

/** Ngày muốn đăng dạng YYYY-MM-DD (giờ Việt Nam), lưu 00:00 giờ Việt Nam. */
export function parsePublishOn(value: string): string {
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) throw new ToolError(`publishOn phải dạng YYYY-MM-DD, nhận được "${value}".`)
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00+07:00`)
  if (Number.isNaN(d.getTime())) throw new ToolError(`publishOn không hợp lệ: "${value}".`)
  return d.toISOString()
}

export async function saveTopic(req: PayloadRequest, args: TopicInput) {
  requireUser(req)
  if (args.id === undefined && !args.keyword?.trim()) throw new ToolError('Chủ đề mới cần keyword.')
  if (args.status !== undefined && !TOPIC_STATUSES.includes(args.status)) throw new ToolError(`status phải là một trong: ${TOPIC_STATUSES.join(', ')}.`)
  const data: Record<string, unknown> = {}
  for (const k of ['keyword', 'title', 'supportingKeywords', 'notes', 'keywordEn', 'titleEn'] as const) {
    if (args[k] !== undefined) data[k] = args[k]!.trim()
  }
  if (args.publishOn !== undefined) data.publishOn = args.publishOn ? parsePublishOn(args.publishOn) : null
  if (args.status !== undefined) data.status = args.status
  if (args.category !== undefined) data.category = args.category ? await resolveCategory(req, args.category) : null
  const doc =
    args.id !== undefined
      ? await req.payload.update({ collection: 'topics', id: args.id, data, depth: 1, ...ops(req) })
      : await req.payload.create({ collection: 'topics', data: data as never, depth: 1, ...ops(req) })
  return topicView(doc as Topic)
}

async function markTopicWritten(req: PayloadRequest, topicId: number, postId: number) {
  await req.payload.update({ collection: 'topics', id: topicId, data: { status: 'da-viet', post: postId }, depth: 0, ...ops(req) })
}
