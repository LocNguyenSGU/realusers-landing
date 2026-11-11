import type { GlobalConfig } from 'payload'

import { anyone, isAdminOrEditor } from '@/access'
import { revalidateBlog } from '@/hooks/revalidate'

/** Chữ mặc định theo ngôn ngữ đang sửa trong trang quản trị. */
const byLocale = (vi: string, en: string) => ({ locale }: { locale?: string }) => (locale === 'en' ? en : vi)

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
        { name: 'heroLabel', label: 'Nhãn nhỏ', type: 'text', localized: true, defaultValue: byLocale('Blog RealUsers', 'RealUsers Blog') },
        { name: 'heroTitle', label: 'Tiêu đề (H1)', type: 'text', localized: true, required: true, defaultValue: byLocale('Làm thương hiệu trên Threads', 'Build your brand on Threads') },
        {
          name: 'heroIntro',
          label: 'Câu giới thiệu',
          type: 'textarea', localized: true,
          defaultValue: byLocale('Hướng dẫn thực tế cho chủ shop và người làm marketing: viết bài sao cho có người trả lời, tăng tương tác, và có mặt đúng lúc khách đang hỏi.', 'Practical guides for shop owners and marketers: write posts people reply to, grow engagement, and show up when customers are asking.'),
        },
        {
          name: 'metaTitle',
          label: 'Tiêu đề cho Google (trang /blog/)',
          type: 'text', localized: true,
          required: true,
          defaultValue: byLocale('Blog RealUsers: làm thương hiệu trên Threads', 'RealUsers Blog: building a brand on Threads'),
        },
        {
          name: 'metaDescription',
          label: 'Mô tả cho Google (trang /blog/)',
          type: 'textarea', localized: true,
          defaultValue: byLocale('Hướng dẫn thực tế để thương hiệu và shop nhỏ ở Việt Nam làm Threads: viết bài, tăng tương tác, tham gia đúng cuộc trò chuyện.', 'Practical guides for brands and small shops on Threads: writing posts, growing engagement, and joining the right conversations.'),
        },
      ],
    },
    {
      name: 'cta',
      label: 'Khối kêu gọi cuối bài',
      type: 'group',
      fields: [
        { name: 'title', label: 'Tiêu đề', type: 'text', localized: true, defaultValue: byLocale('Muốn làm đều mà không mất cả buổi mỗi ngày?', 'Want to post consistently without losing half your day?') },
        {
          name: 'text',
          label: 'Nội dung',
          type: 'textarea', localized: true,
          defaultValue: byLocale('RealUsers soạn sẵn bài mở chủ đề theo giọng thương hiệu của bạn và tìm những thảo luận trên Threads đang nói đúng thứ bạn bán. Bạn chỉ cần duyệt trước khi đăng.', 'RealUsers drafts conversation starters in your brand voice and finds Threads discussions about exactly what you sell. You just approve before anything goes out.'),
        },
        { name: 'buttonLabel', label: 'Chữ trên nút', type: 'text', localized: true, defaultValue: byLocale('Tạo tài khoản miễn phí', 'Create a free account') },
        { name: 'url', label: 'Link nút', type: 'text', localized: true, defaultValue: byLocale('https://app.realusers.net/dang-ky', 'https://app.realusers.net/dang-ky') },
      ],
    },
  ],
  hooks: { afterChange: [({ doc, req }) => (revalidateBlog(req), doc)] },
}
