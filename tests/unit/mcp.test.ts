import { describe, expect, it } from 'vitest'

import { normalizePostMarkdown } from '@/mcp/markdown'
import { fullMetaTitle, parsePublishAt, ToolError } from '@/mcp/tools'

describe('normalizePostMarkdown', () => {
  it('bỏ H1 đầu bài (thường là tiêu đề chép lại), hạ các H1 khác xuống H2', () => {
    const md = '\n# Tiêu đề bài\n\nMở bài.\n\n# Mục một\n\nNội dung.\n\n## Mục hai\n'
    expect(normalizePostMarkdown(md)).toBe('Mở bài.\n\n## Mục một\n\nNội dung.\n\n## Mục hai\n')
  })

  it('nâng H5/H6 lên H4, giữ nguyên trong khối code', () => {
    const md = 'Mở bài.\n\n##### Nhỏ\n\n```\n# không phải heading\n```\n'
    expect(normalizePostMarkdown(md)).toBe('Mở bài.\n\n#### Nhỏ\n\n```\n# không phải heading\n```\n')
  })

  it('đổi xuống dòng Windows', () => {
    expect(normalizePostMarkdown('## A\r\n\r\nB')).toBe('## A\n\nB\n')
  })
})

describe('parsePublishAt', () => {
  const now = new Date('2026-11-20T00:00:00Z')

  it('nhận ISO có múi giờ ở tương lai', () => {
    expect(parsePublishAt('2026-11-23T08:00:00+07:00', now).toISOString()).toBe('2026-11-23T01:00:00.000Z')
  })

  it('từ chối giờ không ghi múi giờ', () => {
    expect(() => parsePublishAt('2026-11-23T08:00:00', now)).toThrow(ToolError)
  })

  it('từ chối giờ đã qua', () => {
    expect(() => parsePublishAt('2026-11-19T08:00:00+07:00', now)).toThrow(/tương lai/)
  })
})

describe('fullMetaTitle', () => {
  it('thêm " | RealUsers" khi thiếu, không thêm hai lần', () => {
    expect(fullMetaTitle('Seeding Threads là gì')).toBe('Seeding Threads là gì | RealUsers')
    expect(fullMetaTitle('Seeding Threads là gì | RealUsers')).toBe('Seeding Threads là gì | RealUsers')
  })
})
