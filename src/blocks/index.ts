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
    { name: 'url', label: 'Link nút', type: 'text', required: true, defaultValue: 'https://app.realusers.net/' },
  ],
  // Viết bằng markdown (công cụ MCP): <Cta title="..." buttonLabel="..." url="...">Nội dung</Cta>
  jsx: {
    import: ({ children, props }) => ({
      title: String(props.title ?? ''),
      text: children.trim() || undefined,
      buttonLabel: String(props.buttonLabel ?? 'Tạo tài khoản miễn phí'),
      url: String(props.url ?? 'https://app.realusers.net/'),
    }),
    export: ({ fields }) => ({
      props: { title: fields.title, buttonLabel: fields.buttonLabel, url: fields.url },
      children: typeof fields.text === 'string' ? fields.text : '',
    }),
  },
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
  // Viết bằng markdown (công cụ MCP): <Callout tone="tip|warning|example" title="...">Nội dung</Callout>
  jsx: {
    import: ({ children, props }) => ({
      tone: ['tip', 'warning', 'example'].includes(props.tone) ? props.tone : 'tip',
      title: props.title ? String(props.title) : undefined,
      text: children.trim(),
    }),
    export: ({ fields }) => ({
      props: { tone: fields.tone, ...(fields.title ? { title: fields.title } : {}) },
      children: typeof fields.text === 'string' ? fields.text : '',
    }),
  },
}
