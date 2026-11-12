import type { Block } from 'payload'

/** Khối kêu gọi chèn giữa bài (ví dụ "Thử RealUsers miễn phí"). */
export const CtaBlock: Block = {
  slug: 'cta',
  interfaceName: 'CtaBlock',
  labels: { singular: 'Khối kêu gọi (CTA)', plural: 'Khối kêu gọi (CTA)' },
  fields: [
    { name: 'title', label: 'Tiêu đề', type: 'text', required: true },
    { name: 'text', label: 'Nội dung', type: 'textarea' },
    { name: 'buttonLabel', label: 'Chữ trên nút', type: 'text', required: true, defaultValue: 'Tạo tài khoản miễn phí' },
    { name: 'url', label: 'Link nút', type: 'text', required: true, defaultValue: 'https://app.realusers.net/dang-ky' },
  ],
}

/** Ô ghi chú nổi bật (mẹo, lưu ý). */
export const CalloutBlock: Block = {
  slug: 'callout',
  interfaceName: 'CalloutBlock',
  labels: { singular: 'Ô ghi chú', plural: 'Ô ghi chú' },
  fields: [
    {
      name: 'tone',
      label: 'Kiểu',
      type: 'select',
      defaultValue: 'tip',
      required: true,
      options: [
        { label: 'Mẹo', value: 'tip' },
        { label: 'Lưu ý', value: 'warning' },
        { label: 'Ví dụ', value: 'example' },
      ],
    },
    { name: 'title', label: 'Tiêu đề (tuỳ chọn)', type: 'text' },
    { name: 'text', label: 'Nội dung', type: 'textarea', required: true },
  ],
}
