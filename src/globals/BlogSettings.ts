import type { GlobalConfig } from 'payload'

import { anyone, isAdminOrEditor } from '@/access'
import { revalidateBlog } from '@/hooks/revalidate'

/** Chữ cố định của blog mà MKT tự sửa được: hero trang /blog/, khối kêu gọi cuối bài và ở cột phụ. */
export const BlogSettings: GlobalConfig = {
  slug: 'blog-settings',
  label: 'Cài đặt blog',
  admin: { group: 'Hệ thống' },
  access: { read: anyone, update: isAdminOrEditor },
  fields: [
    {
      type: 'collapsible',
      label: 'Đầu trang /blog/',
      fields: [
        { name: 'heroLabel', label: 'Nhãn nhỏ', type: 'text', defaultValue: 'Blog RealUsers' },
        { name: 'heroTitle', label: 'Tiêu đề (H1)', type: 'text', required: true, defaultValue: 'Làm thương hiệu trên Threads' },
        {
          name: 'heroIntro',
          label: 'Câu giới thiệu',
          type: 'textarea',
          defaultValue:
            'Hướng dẫn thực tế cho chủ shop và người làm marketing: viết bài sao cho có người trả lời, tăng tương tác, và có mặt đúng lúc khách đang hỏi.',
        },
        {
          name: 'metaTitle',
          label: 'Tiêu đề cho Google (trang /blog/)',
          type: 'text',
          required: true,
          defaultValue: 'Blog RealUsers: làm thương hiệu trên Threads',
        },
        {
          name: 'metaDescription',
          label: 'Mô tả cho Google (trang /blog/)',
          type: 'textarea',
          defaultValue:
            'Hướng dẫn thực tế để thương hiệu và shop nhỏ ở Việt Nam làm Threads: viết bài, tăng tương tác, tham gia đúng cuộc trò chuyện.',
        },
      ],
    },
    {
      name: 'cta',
      label: 'Khối kêu gọi cuối bài',
      type: 'group',
      fields: [
        { name: 'title', label: 'Tiêu đề', type: 'text', defaultValue: 'Muốn làm đều mà không mất cả buổi mỗi ngày?' },
        {
          name: 'text',
          label: 'Nội dung',
          type: 'textarea',
          defaultValue:
            'RealUsers soạn sẵn bài mở chủ đề theo giọng thương hiệu của bạn và tìm những thảo luận trên Threads đang nói đúng thứ bạn bán. Bạn chỉ cần duyệt trước khi đăng.',
        },
        { name: 'buttonLabel', label: 'Chữ trên nút', type: 'text', defaultValue: 'Tạo tài khoản miễn phí' },
        { name: 'url', label: 'Link nút', type: 'text', defaultValue: 'https://app.realusers.net/dang-ky' },
      ],
    },
  ],
  hooks: { afterChange: [({ doc, req }) => (revalidateBlog(req), doc)] },
}
