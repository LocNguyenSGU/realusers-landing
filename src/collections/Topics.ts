import type { CollectionConfig } from 'payload'

import { isAdminOrEditor, loggedIn } from '@/access'

export const TOPIC_STATUSES = ['cho-viet', 'dang-viet', 'da-viet', 'bo'] as const
export type TopicStatus = (typeof TOPIC_STATUSES)[number]

/**
 * Chủ đề chờ viết: hàng đợi cho người viết và AI. MKT nhập từ khoá, góc viết, ngày muốn đăng;
 * AI lấy chủ đề sớm nhất (công cụ MCP listTopics), viết bài, gắn bài vào chủ đề và chuyển sang "Đã viết".
 * Không hiện ra ngoài site: chỉ người đăng nhập trang quản trị mới đọc được.
 */
export const Topics: CollectionConfig = {
  slug: 'topics',
  labels: { singular: 'Chủ đề chờ viết', plural: 'Chủ đề chờ viết' },
  admin: {
    useAsTitle: 'keyword',
    defaultColumns: ['keyword', 'title', 'publishOn', 'status', 'post'],
    group: 'Nội dung',
    description: 'Nhập từ khoá và góc viết. AI lấy chủ đề theo "Ngày muốn đăng" sớm nhất, viết xong tự chuyển sang "Đã viết" và gắn bài.',
  },
  defaultSort: 'publishOn',
  access: {
    read: loggedIn,
    create: loggedIn,
    update: loggedIn,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: 'keyword', label: 'Từ khoá chính', type: 'text', required: true, admin: { description: 'Cụm người đọc gõ trên Google, vd "seeding threads là gì".' } },
    { name: 'title', label: 'Tiêu đề gợi ý', type: 'text' },
    { name: 'supportingKeywords', label: 'Từ khoá phụ', type: 'textarea', admin: { description: 'Cách nhau bằng dấu phẩy.' } },
    { name: 'notes', label: 'Góc viết, ghi chú cho người viết', type: 'textarea', admin: { description: 'Đối tượng đọc, ý chính cần có, điều không được nói, link nên gắn…' } },
    {
      type: 'collapsible',
      label: 'Bản tiếng Anh (tuỳ chọn)',
      admin: { initCollapsed: true },
      fields: [
        { name: 'keywordEn', label: 'Từ khoá tiếng Anh', type: 'text' },
        { name: 'titleEn', label: 'Tiêu đề tiếng Anh gợi ý', type: 'text' },
      ],
    },
    {
      name: 'publishOn',
      label: 'Ngày muốn đăng',
      type: 'date',
      index: true,
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } },
    },
    {
      name: 'status',
      label: 'Trạng thái',
      type: 'select',
      required: true,
      defaultValue: 'cho-viet',
      index: true,
      options: [
        { label: 'Chờ viết', value: 'cho-viet' },
        { label: 'Đang viết', value: 'dang-viet' },
        { label: 'Đã viết', value: 'da-viet' },
        { label: 'Bỏ', value: 'bo' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'category', label: 'Chuyên mục', type: 'relationship', relationTo: 'categories', admin: { position: 'sidebar' } },
    {
      name: 'post',
      label: 'Bài đã viết',
      type: 'relationship',
      relationTo: 'posts',
      admin: { position: 'sidebar', description: 'Tự gắn khi AI tạo bài từ chủ đề này.' },
    },
  ],
}
