import { slugField, type CollectionConfig } from 'payload'

import { anyone, isAdminOrEditor } from '@/access'
import { revalidateBlog } from '@/hooks/revalidate'
import { slugify } from '@/lib/slugify'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Chuyên mục', plural: 'Chuyên mục' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'slug', 'updatedAt'], group: 'Nội dung' },
  access: {
    read: anyone,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  defaultSort: 'order',
  fields: [
    { name: 'name', label: 'Tên', type: 'text', required: true },
    {
      name: 'description',
      label: 'Mô tả',
      type: 'textarea',
      admin: { description: 'Hiện ở đầu trang chuyên mục và làm mô tả cho Google (120–160 ký tự là đẹp).' },
    },
    { name: 'order', label: 'Thứ tự trên tab', type: 'number', defaultValue: 10, admin: { position: 'sidebar' } },
    slugField({ useAsSlug: 'name', slugify: ({ valueToSlugify }) => slugify(String(valueToSlugify ?? '')) }),
  ],
  hooks: {
    afterChange: [({ doc, req }) => (revalidateBlog(req), doc)],
    afterDelete: [({ doc, req }) => (revalidateBlog(req), doc)],
  },
}
