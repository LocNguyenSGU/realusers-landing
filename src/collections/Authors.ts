import { slugField, type CollectionConfig } from 'payload'

import { anyone, isAdminOrEditor } from '@/access'
import { revalidateBlog } from '@/hooks/revalidate'
import { slugify } from '@/lib/slugify'

/**
 * Tác giả hiển thị trên bài (khác tài khoản đăng nhập). Có trang riêng /blog/tac-gia/<slug>/
 * để Google thấy người viết là người thật, có lý lịch (yếu tố uy tín E-E-A-T).
 */
export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: { singular: 'Tác giả', plural: 'Tác giả' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'jobTitle', 'updatedAt'], group: 'Nội dung' },
  access: {
    read: anyone,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: 'name', label: 'Tên hiển thị', type: 'text', required: true },
    { name: 'jobTitle', label: 'Chức danh', type: 'text' },
    { name: 'avatar', label: 'Ảnh đại diện', type: 'upload', relationTo: 'media' },
    { name: 'bio', label: 'Giới thiệu ngắn', type: 'textarea' },
    {
      name: 'sameAs',
      label: 'Trang cá nhân khác (Threads, LinkedIn…)',
      type: 'array',
      fields: [{ name: 'url', type: 'text', required: true }],
    },
    slugField({ useAsSlug: 'name', slugify: ({ valueToSlugify }) => slugify(String(valueToSlugify ?? '')) }),
  ],
  hooks: {
    afterChange: [({ doc, req }) => (revalidateBlog(req), doc)],
    afterDelete: [({ doc, req }) => (revalidateBlog(req), doc)],
  },
}
