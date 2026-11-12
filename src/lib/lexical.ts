// Đọc nội dung Lexical (JSON) của bài: lấy chữ, tính phút đọc, dựng mục lục.
// Hàm thuần, không phụ thuộc Payload, để test được và dùng chung server/hook.
import { slugify } from './slugify'

type Node = {
  type?: string
  tag?: string
  text?: string
  children?: Node[]
  [key: string]: unknown
}

export type RichTextValue = { root: Node } | null | undefined

export type TocItem = { id: string; text: string; level: 2 | 3 }

/** Ghép toàn bộ chữ trong một node (kể cả node con). */
export function nodeText(node: Node | undefined): string {
  if (!node) return ''
  if (typeof node.text === 'string') return node.text
  if (!Array.isArray(node.children)) return ''
  const sep = node.type === 'root' || node.type === 'list' ? '\n' : ''
  return node.children.map(nodeText).join(sep)
}

export function plainText(value: RichTextValue): string {
  return value?.root ? nodeText(value.root) : ''
}

export function countWords(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean)
  return words.length
}

/** Phút đọc, làm tròn lên, tối thiểu 1. Mặc định 200 từ/phút. */
export function readingMinutes(value: RichTextValue, wordsPerMinute = 200): number {
  const words = countWords(plainText(value))
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

/**
 * Gán id cho mọi heading theo thứ tự xuất hiện (h2, h3, h4). Trùng chữ thì thêm -2, -3.
 * Trang bài dùng cùng danh sách này để render id và dựng mục lục, nên hai bên luôn khớp.
 */
export function headingIds(value: RichTextValue): { id: string; text: string; tag: string }[] {
  const out: { id: string; text: string; tag: string }[] = []
  const seen = new Map<string, number>()
  for (const node of value?.root?.children ?? []) {
    if (node.type !== 'heading' || !node.tag) continue
    const text = nodeText(node).trim()
    const base = slugify(text) || 'muc'
    const n = (seen.get(base) ?? 0) + 1
    seen.set(base, n)
    out.push({ id: n === 1 ? base : `${base}-${n}`, text, tag: node.tag })
  }
  return out
}

/** Mục lục: chỉ H2 và H3. */
export function tableOfContents(value: RichTextValue): TocItem[] {
  return headingIds(value)
    .filter((h) => h.tag === 'h2' || h.tag === 'h3')
    .map((h) => ({ id: h.id, text: h.text, level: h.tag === 'h2' ? 2 : 3 }))
}
