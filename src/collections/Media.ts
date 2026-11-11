import type { CollectionConfig } from 'payload'

import { anyone, isAdminOrEditor, loggedIn } from '@/access'

/**
 * Ảnh dùng trong blog. Alt bắt buộc: Google đọc alt để hiểu ảnh (like3s bỏ trống, mình không).
 * Production lưu file trên Cloudflare R2 (cấu hình ở payload.config.ts), máy local lưu ở ./media.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Ảnh', plural: 'Thư viện ảnh' },
  admin: { group: 'Nội dung' },
  access: {
    read: anyone,
    create: loggedIn,
    update: loggedIn,
    delete: isAdminOrEditor,
  },
  fields: [
    {
      name: 'alt',
      label: 'Mô tả ảnh (alt)',
      type: 'text',
      required: true,
      localized: true,
      admin: { description: 'Tả ngắn ảnh có gì, như kể cho người không nhìn thấy. Google dùng chữ này để hiểu ảnh.' },
    },
    { name: 'caption', label: 'Chú thích dưới ảnh', type: 'text', localized: true },
  ],
  upload: {
    // Thư mục lưu ảnh khi không dùng R2. Test tích hợp dùng thư mục riêng (MEDIA_DIR) để không đụng ảnh dev.
    staticDir: process.env.MEDIA_DIR || 'media',
    mimeTypes: ['image/*'],
    adminThumbnail: 'thumb',
    focalPoint: true,
    formatOptions: { format: 'webp', options: { quality: 82 } },
    imageSizes: [
      { name: 'thumb', width: 400, height: 225, position: 'centre', formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'card', width: 800, height: 450, position: 'centre', formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'hero', width: 1600, formatOptions: { format: 'webp', options: { quality: 82 } } },
      // Ảnh chia sẻ Facebook/Zalo/Threads: 1200x630, JPEG cho mọi nền tảng đọc được.
      { name: 'og', width: 1200, height: 630, position: 'centre', formatOptions: { format: 'jpeg', options: { quality: 85 } } },
    ],
  },
}
