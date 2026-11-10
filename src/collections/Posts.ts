import { APIError, slugField, type CollectionConfig, type TextField } from 'payload'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { isAdminOrEditor, loggedIn, publishedOrLoggedIn, roleOf } from '@/access'
import { CalloutBlock, CtaBlock } from '@/blocks'
import { revalidateBlog } from '@/hooks/revalidate'
import { readingMinutes } from '@/lib/lexical'
import { paths, RESERVED_POST_SLUGS } from '@/lib/site'
import { slugify } from '@/lib/slugify'

export const postContentEditor = lexicalEditor({
  features: ({ rootFeatures }) => [
    // Thân bài bắt đầu từ H2: H1 là tiêu đề bài, mỗi trang chỉ có một H1.
    ...rootFeatures.filter((f) => f.key !== 'heading'),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
    BlocksFeature({ blocks: [CtaBlock, CalloutBlock] }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
    HorizontalRuleFeature(),
  ],
})

const previewUrl = (slug: unknown): string | null => {
  if (typeof slug !== 'string' || !slug) return null
  const params = new URLSearchParams({ path: paths.post(slug), previewSecret: process.env.PREVIEW_SECRET || '' })
  return `/next/preview?${params.toString()}`
}

export const Posts: CollectionConfig<'posts'> = {
  slug: 'posts',
  labels: { singular: 'Bài viết', plural: 'Bài viết' },
  access: {
    read: publishedOrLoggedIn,
    create: loggedIn,
    update: loggedIn,
    delete: isAdminOrEditor,
  },
  defaultPopulate: {
    title: true,
    slug: true,
    excerpt: true,
    coverImage: true,
    category: true,
    author: true,
    publishedAt: true,
    readingMinutes: true,
  },
  defaultSort: '-publishedAt',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', '_status', 'publishedAt', 'updatedAt'],
    group: 'Nội dung',
    preview: (doc) => previewUrl(doc?.slug),
  },
  fields: [
    { name: 'title', label: 'Tiêu đề (H1)', type: 'text', required: true },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Nội dung',
          fields: [
            {
              name: 'excerpt',
              label: 'Sapo (đoạn mở đầu)',
              type: 'textarea',
              required: true,
              admin: { description: 'Hiện dưới tiêu đề và trên thẻ bài. Dùng làm mô tả Google nếu tab SEO để trống.' },
            },
            { name: 'coverImage', label: 'Ảnh đầu bài', type: 'upload', relationTo: 'media' },
            { name: 'content', label: false, type: 'richText', required: true, editor: postContentEditor },
            {
              name: 'faq',
              label: 'Câu hỏi thường gặp',
              type: 'array',
              admin: { description: 'Hiện cuối bài và khai báo FAQPage cho Google.' },
              labels: { singular: 'Câu hỏi', plural: 'Câu hỏi' },
              fields: [
                { name: 'question', label: 'Câu hỏi', type: 'text', required: true },
                { name: 'answer', label: 'Trả lời', type: 'textarea', required: true },
              ],
            },
          ],
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({ titlePath: 'meta.title', descriptionPath: 'meta.description', imagePath: 'meta.image' }),
            MetaTitleField({ hasGenerateFn: true }),
            MetaDescriptionField({ hasGenerateFn: true }),
            MetaImageField({ relationTo: 'media' }),
            PreviewField({ hasGenerateFn: true, titlePath: 'meta.title', descriptionPath: 'meta.description' }),
          ],
        },
      ],
    },
    {
      name: 'category',
      label: 'Chuyên mục',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      admin: { position: 'sidebar' },
    },
    { name: 'author', label: 'Tác giả', type: 'relationship', relationTo: 'authors', admin: { position: 'sidebar' } },
    {
      name: 'publishedAt',
      label: 'Ngày đăng',
      type: 'date',
      index: true,
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd/MM/yyyy HH:mm' } },
    },
    {
      name: 'featured',
      label: 'Bài nổi bật',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Bài nổi bật mới nhất hiện to đầu trang /blog/ và trong "Bài nên đọc".' },
    },
    {
      name: 'relatedPosts',
      label: 'Bài liên quan (chọn tay)',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      maxRows: 4,
      filterOptions: ({ id }) => ({ id: { not_in: [id] } }),
      admin: { position: 'sidebar', description: 'Để trống thì tự lấy bài cùng chuyên mục.' },
    },
    {
      name: 'noindex',
      label: 'Ẩn khỏi Google (noindex)',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'readingMinutes',
      label: 'Phút đọc (tự tính)',
      type: 'number',
      admin: { position: 'sidebar', readOnly: true },
    },
    slugField({
      position: 'sidebar',
      slugify: ({ valueToSlugify }) => slugify(String(valueToSlugify ?? '')),
      overrides: (row) => {
        row.fields = row.fields.map((f) => {
          if ('name' in f && f.name === 'slug') {
            const field = f as TextField
            return {
              ...field,
              label: 'Đường dẫn (slug)',
              validate: (value: string | null | undefined) => {
                if (!value) return 'Cần có đường dẫn'
                if (RESERVED_POST_SLUGS.includes(value)) return `"${value}" là đường dẫn hệ thống, chọn tên khác`
                if (value !== slugify(value)) return 'Chỉ dùng chữ thường không dấu, số và dấu gạch ngang'
                return true
              },
            } as TextField
          }
          return f
        })
        return row
      },
    }),
  ],
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        // Người viết chỉ lưu nháp. Đăng bài là việc của biên tập hoặc admin.
        if (data?._status === 'published' && roleOf(req) === 'writer') {
          throw new APIError('Tài khoản người viết chỉ được lưu nháp. Nhờ biên tập đăng bài.', 403, null, true)
        }
        if (data?.content) data.readingMinutes = readingMinutes(data.content)
        if (data?._status === 'published' && !data.publishedAt) data.publishedAt = new Date().toISOString()
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        // Đổi slug của bài đã đăng: tự thêm chuyển hướng 301 từ link cũ, Google và link cũ không bị 404.
        const oldSlug = previousDoc?.slug
        if (
          operation === 'update' &&
          doc._status === 'published' &&
          previousDoc?._status === 'published' &&
          oldSlug &&
          oldSlug !== doc.slug
        ) {
          const from = paths.post(oldSlug)
          const existing = await req.payload.count({ collection: 'redirects', where: { from: { equals: from } }, req })
          if (existing.totalDocs === 0) {
            await req.payload.create({
              collection: 'redirects',
              data: { from, to: { type: 'reference', reference: { relationTo: 'posts', value: doc.id } }, type: '301' },
              req,
            })
          }
        }
        if (doc._status === 'published' || previousDoc?._status === 'published') revalidateBlog(req)
        return doc
      },
    ],
    afterDelete: [({ doc, req }) => (revalidateBlog(req), doc)],
  },
  versions: {
    drafts: { autosave: { interval: 2000 }, schedulePublish: true },
    maxPerDoc: 50,
  },
}
