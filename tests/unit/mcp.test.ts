import { describe, expect, it } from 'vitest'

import { hasMarkdownTable, normalizePostMarkdown } from '@/mcp/markdown'
import { fullMetaTitle, parsePublishAt, parsePublishOn, ToolError, vnDate } from '@/mcp/tools'

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

describe('hasMarkdownTable', () => {
  it('nhận ra bảng markdown, không bắt nhầm dòng có dấu |', () => {
    expect(hasMarkdownTable('Mở bài\n\n| A | B |\n|---|---|\n| 1 | 2 |\n')).toBe(true)
    expect(hasMarkdownTable('| A | B |\n| :--- | ---: |\n')).toBe(true)
    expect(hasMarkdownTable('Giá 100k | ship 20k\n\n---\n')).toBe(false)
  })
})

describe('ngày muốn đăng', () => {
  it('lưu 00:00 giờ Việt Nam, đọc lại đúng ngày Việt Nam', () => {
    const iso = parsePublishOn('2026-12-01')
    expect(iso).toBe('2026-11-30T17:00:00.000Z')
    expect(vnDate(iso)).toBe('2026-12-01')
    expect(() => parsePublishOn('01/12/2026')).toThrow(ToolError)
  })
})
