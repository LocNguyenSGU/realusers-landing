// Đổi qua lại giữa markdown (AI viết) và Lexical (định dạng Payload lưu nội dung bài).
import {
  convertLexicalToMarkdown,
  convertMarkdownToLexical,
  editorConfigFactory,
  type SanitizedServerEditorConfig,
} from '@payloadcms/richtext-lexical'
import type { Payload } from 'payload'

import { postContentEditor } from '@/collections/Posts'

/**
 * Chuẩn hoá markdown trước khi đổi sang Lexical. Hàm thuần, test được.
 * - Thân bài không có H1 (H1 là tiêu đề bài, mỗi trang chỉ một H1): bỏ dòng H1 đầu bài
 *   (AI hay chép lại tiêu đề), các H1 còn lại hạ xuống H2.
 * - H5, H6 nâng lên H4 (trình soạn thảo chỉ có H2–H4).
 */
export function normalizePostMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  const firstText = lines.findIndex((l) => l.trim() !== '')
  if (firstText >= 0 && /^#\s/.test(lines[firstText])) lines.splice(firstText, 1)
  let inFence = false
  const out = lines.map((line) => {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
    if (inFence) return line
    if (/^#\s/.test(line)) return `#${line}`
    if (/^#{5,6}\s/.test(line)) return line.replace(/^#{5,6}/, '####')
    return line
  })
  return out.join('\n').trim() + '\n'
}

let editorConfig: Promise<SanitizedServerEditorConfig> | null = null

function postEditorConfig(payload: Payload): Promise<SanitizedServerEditorConfig> {
  editorConfig ??= editorConfigFactory.fromEditor({ config: payload.config, editor: postContentEditor })
  return editorConfig
}

export async function markdownToPostContent(payload: Payload, markdown: string) {
  return convertMarkdownToLexical({ editorConfig: await postEditorConfig(payload), markdown: normalizePostMarkdown(markdown) })
}

export async function postContentToMarkdown(payload: Payload, content: unknown): Promise<string> {
  if (!content || typeof content !== 'object' || !('root' in content)) return ''
  return convertLexicalToMarkdown({ data: content as never, editorConfig: await postEditorConfig(payload) })
}
