// Máy chủ MCP của blog: https://www.realusers.net/api/mcp (local: http://localhost:3100/api/mcp).
// AI (Claude Code, Claude Desktop…) gọi kèm "Authorization: Bearer <API key>". Tạo key ở /admin → MCP → API key.
// Key chạy dưới quyền tài khoản đã tạo nó: tài khoản writer chỉ lưu nháp, editor/admin được đăng và hẹn giờ.
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import type { Access, Field, PayloadRequest, RelationshipField } from 'payload'
import { z } from 'zod'

import { isAdmin, isAdminField, roleOf } from '@/access'

import { SERVER_INSTRUCTIONS, writeBlogPostPrompt } from './guide'
import { blogOverview, cancelSchedule, createPost, getPost, listTopics, saveCategory, saveTopic, schedulePost, ToolError, updatePost, uploadImage } from './tools'

type Text = { content: { type: 'text'; text: string }[] }
const adminOr =
  (fallback: Access | undefined): Access =>
  (args) =>
    roleOf(args.req) === 'admin' ? true : fallback ? fallback(args) : false

const text = (t: string): Text => ({ content: [{ type: 'text', text: t }] })

function errorMessage(err: unknown): string {
  if (err instanceof ToolError) return err.message
  const e = err as { message?: string; data?: { errors?: { path?: string; message?: string }[] } }
  const details = e?.data?.errors?.map((x) => `${x.path}: ${x.message}`).join('; ')
  return [e?.message ?? String(err), details].filter(Boolean).join(' — ')
}

const tool = <A>(name: string, description: string, parameters: z.ZodRawShape, fn: (req: PayloadRequest, args: A) => Promise<unknown>) => ({
  name,
  description,
  parameters,
  handler: async (args: Record<string, unknown>, req: PayloadRequest): Promise<Text> => {
    try {
      return text(JSON.stringify(await fn(req, args as A), null, 2))
    } catch (err) {
      req.payload.logger.warn({ err }, `[mcp] ${name} lỗi`)
      return text(`Lỗi: ${errorMessage(err)}`)
    }
  },
})

const locale = z.enum(['vi', 'en'])
const action = z
  .enum(['draft', 'publish', 'schedule'])
  .optional()
  .describe('draft = lưu nháp (mặc định, bản đang đăng không đổi); publish = đăng ngay; schedule = hẹn giờ, cần publishAt')
const topicId = z.number().int().optional().describe('Id chủ đề trong "Chủ đề chờ viết" (listTopics) mà bài này viết cho. Chủ đề tự chuyển sang "Đã viết" và gắn bài.')
const topicStatus = z.enum(['cho-viet', 'dang-viet', 'da-viet', 'bo'])
const publishAt = z.string().optional().describe('Giờ hẹn đăng, ISO có múi giờ, ví dụ "2026-11-23T08:00:00+07:00". Chỉ dùng với action "schedule".')

const postFields = {
  excerpt: z.string().describe('Sapo 1–2 câu, 120–160 ký tự'),
  markdown: z.string().describe('Thân bài bằng markdown. Không có H1, bắt đầu từ "##". Có thể dùng <Callout> và <Cta> (xem hướng dẫn).'),
  category: z.string().describe('Slug hoặc id chuyên mục (xem blogOverview)'),
  author: z.string().optional().describe('Slug hoặc id tác giả. Bỏ trống khi tạo bài thì lấy tác giả mặc định.'),
  slug: z.string().optional().describe('Đường dẫn: chữ thường không dấu, gạch ngang. Bỏ trống thì sinh từ tiêu đề.'),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })).optional().describe('3–5 câu hỏi thường gặp'),
  metaTitle: z.string().optional().describe('Tiêu đề trên Google nếu muốn khác title (≤ 60 ký tự, site tự thêm " | RealUsers")'),
  metaDescription: z.string().optional().describe('Mô tả trên Google (120–160 ký tự). Bỏ trống thì dùng sapo.'),
  coverImageId: z.number().int().nullable().optional().describe('Id ảnh đầu bài (từ uploadImage). null để bỏ ảnh.'),
  featured: z.boolean().optional().describe('Bài nổi bật đầu trang /blog/'),
}

export const blogMcpPlugin = mcpPlugin({
  collections: {},
  overrideApiKeyCollection: (collection) => ({
    ...collection,
    labels: { singular: 'API key cho AI', plural: 'API key cho AI (MCP)' },
    admin: {
      ...collection.admin,
      group: 'Hệ thống',
      description: 'Key để AI viết và đăng bài qua MCP. Key mang quyền của tài khoản chọn ở ô User. Bỏ tick công cụ nào thì AI không dùng được công cụ đó.',
    },
    // Chỉ admin cấp key và quản lý mọi key (kể cả key gắn tài khoản AI). Tài khoản khác chỉ thấy key của chính mình.
    access: {
      ...collection.access,
      create: isAdmin,
      read: adminOr(collection.access?.read),
      update: adminOr(collection.access?.update),
      delete: adminOr(collection.access?.delete),
    },
    // Admin được chọn key chạy dưới tài khoản nào (vd tài khoản "RealUsers AI" vai trò editor),
    // để bài AI đăng ghi đúng người và AI không có quyền admin. Không ai đổi được tài khoản của key đã tạo.
    fields: collection.fields.map((f): Field =>
      f.type === 'relationship' && f.name === 'user'
        ? ({
            ...f,
            access: { create: isAdminField, update: () => false },
            admin: { ...f.admin, description: 'Key chạy dưới quyền tài khoản này. Nên tạo tài khoản riêng cho AI, vai trò editor.' },
          } as RelationshipField)
        : f,
    ),
  }),
  mcp: {
    serverOptions: { instructions: SERVER_INSTRUCTIONS, serverInfo: { name: 'realusers-blog', version: '1.0.0' } },
    handlerOptions: { maxDuration: 60 },
    tools: [
      tool('blogOverview', 'Xem toàn cảnh blog: chuyên mục, tác giả, mọi bài (nháp + đã đăng, có bản tiếng Anh chưa) và lịch hẹn đăng. Gọi đầu tiên.', {}, (req) => blogOverview(req)),
      tool(
        'getPost',
        'Đọc một bài (bản mới nhất, kể cả nháp) kèm thân bài dạng markdown để sửa.',
        { id: z.number().int().optional(), slug: z.string().optional(), locale: locale.optional().describe('Mặc định vi') },
        getPost,
      ),
      tool(
        'createPost',
        'Tạo bài mới bằng tiếng Việt. Mặc định lưu nháp; action "publish" đăng ngay; "schedule" + publishAt để hẹn giờ.',
        { title: z.string().describe('Tiêu đề bài (H1), 50–65 ký tự'), ...postFields, action, publishAt, topicId },
        createPost,
      ),
      tool(
        'updatePost',
        'Sửa bài hoặc thêm bản dịch (locale "en"). Chỉ gửi ô cần đổi. Mặc định lưu thành nháp (bản đang đăng giữ nguyên tới khi publish).',
        {
          id: z.number().int(),
          locale: locale.optional().describe('Ngôn ngữ đang sửa. "en" để viết bản tiếng Anh. Mặc định vi.'),
          title: z.string().optional(),
          ...Object.fromEntries(Object.entries(postFields).map(([k, v]) => [k, v.optional()])),
          action,
          publishAt,
          topicId,
        },
        updatePost,
      ),
      tool(
        'schedulePost',
        'Hẹn giờ đăng một bài đã có (thay lịch cũ nếu có). Bài lên trong vòng ~15 phút sau giờ hẹn.',
        {
          id: z.number().int(),
          publishAt: z.string().describe('ISO có múi giờ, ví dụ "2026-11-23T08:00:00+07:00"'),
          locale: locale.optional().describe('Chỉ đăng một ngôn ngữ. Bỏ trống = đăng mọi ngôn ngữ đã viết.'),
        },
        schedulePost,
      ),
      tool('cancelSchedule', 'Huỷ lịch hẹn đăng của một bài.', { id: z.number().int() }, cancelSchedule),
      tool(
        'listTopics',
        'Danh sách "Chủ đề chờ viết" do MKT nhập ở /admin: từ khoá, tiêu đề gợi ý, góc viết, ngày muốn đăng. Mặc định các chủ đề chờ viết, ngày sớm nhất trước. Viết bài thì lấy chủ đề đầu tiên.',
        {
          status: z.union([topicStatus, z.literal('all')]).optional().describe('Mặc định "cho-viet"'),
          limit: z.number().int().optional().describe('Mặc định 20, tối đa 200'),
        },
        listTopics,
      ),
      tool(
        'saveTopic',
        'Thêm chủ đề chờ viết, hoặc sửa chủ đề có sẵn (truyền id): từ khoá, ngày muốn đăng, trạng thái. Dùng khi lên kế hoạch nội dung hoặc khi bỏ một chủ đề.',
        {
          id: z.number().int().optional().describe('Bỏ trống để thêm mới'),
          keyword: z.string().optional().describe('Từ khoá chính (bắt buộc khi thêm mới)'),
          title: z.string().optional(),
          supportingKeywords: z.string().optional(),
          notes: z.string().optional().describe('Góc viết, ghi chú cho người viết'),
          keywordEn: z.string().optional(),
          titleEn: z.string().optional(),
          publishOn: z.string().nullable().optional().describe('Ngày muốn đăng YYYY-MM-DD (giờ Việt Nam)'),
          status: topicStatus.optional(),
          category: z.string().nullable().optional().describe('Slug hoặc id chuyên mục'),
        },
        saveTopic,
      ),
      tool(
        'saveCategory',
        'Tạo chuyên mục mới (hoặc sửa chuyên mục cùng slug), kèm tên tiếng Anh. Chỉ tạo khi chưa có chuyên mục hợp (xem blogOverview).',
        {
          name: z.string().describe('Tên tiếng Việt, vd "Seeding"'),
          slug: z.string().optional().describe('Slug tiếng Việt, bỏ trống thì sinh từ tên'),
          description: z.string().optional().describe('Mô tả trang chuyên mục, 120–160 ký tự'),
          nameEn: z.string().optional(),
          slugEn: z.string().optional(),
          descriptionEn: z.string().optional(),
          order: z.number().int().optional().describe('Thứ tự trên tab, số nhỏ đứng trước'),
        },
        saveCategory,
      ),
      tool(
        'uploadImage',
        'Tải ảnh từ một link công khai vào thư viện ảnh, trả về id để làm ảnh đầu bài (coverImageId).',
        { url: z.string().describe('Link ảnh http(s)'), alt: z.string().describe('Mô tả ảnh tiếng Việt'), altEn: z.string().optional().describe('Mô tả ảnh tiếng Anh') },
        uploadImage,
      ),
    ],
    prompts: [
      {
        name: 'writeBlogPost',
        title: 'Viết bài blog RealUsers',
        description: 'Luật viết bài blog RealUsers và các bước dùng công cụ để tạo bài.',
        argsSchema: {
          topic: z.string().optional().describe('Chủ đề bài'),
          keyword: z.string().optional().describe('Từ khoá chính'),
          notes: z.string().optional().describe('Ghi chú thêm (ngày đăng, góc viết…)'),
        },
        handler: (args) => ({ messages: [{ role: 'user', content: { type: 'text', text: writeBlogPostPrompt(args as never) } }] }),
      },
    ],
  },
})
