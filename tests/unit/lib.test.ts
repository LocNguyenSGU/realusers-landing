import { describe, expect, it } from 'vitest'

import { pageWindow } from '@/components/Pagination'
import { dayKey, formatDateVN } from '@/lib/format'
import { blogPostingJsonLd, breadcrumbJsonLd, faqJsonLd, serializeJsonLd } from '@/lib/jsonld'
import { headingIds, readingMinutes, tableOfContents, type RichTextValue } from '@/lib/lexical'
import { postMetadata, postOgImage } from '@/lib/seo'
import { absoluteUrl, paths, SITE_URL } from '@/lib/site'
import { slugify } from '@/lib/slugify'
import type { Post } from '@/payload-types'

const text = (t: string) => ({ type: 'text', text: t })
const heading = (tag: string, t: string) => ({ type: 'heading', tag, children: [text(t)] })
const para = (t: string) => ({ type: 'paragraph', children: [text(t)] })
const doc = (...children: object[]) => ({ root: { type: 'root', children } }) as unknown as RichTextValue

describe('slugify', () => {
  it('bỏ dấu tiếng Việt, đ thành d, nối bằng gạch ngang', () => {
    expect(slugify('Đăng bài Threads thế nào?')).toBe('dang-bai-threads-the-nao')
    expect(slugify('  Cách tăng tương tác: 7 việc!  ')).toBe('cach-tang-tuong-tac-7-viec')
    expect(slugify('Bắt đầu')).toBe('bat-dau')
  })
})

describe('lexical', () => {
  it('phút đọc làm tròn lên, tối thiểu 1', () => {
    expect(readingMinutes(doc(para('một hai ba')))).toBe(1)
    expect(readingMinutes(doc(para(Array(401).fill('chữ').join(' '))))).toBe(3)
    expect(readingMinutes(null)).toBe(1)
  })

  it('id heading trùng chữ thì thêm hậu tố, mục lục chỉ lấy H2/H3', () => {
    const d = doc(heading('h2', 'Mở đầu'), para('x'), heading('h3', 'Ví dụ'), heading('h2', 'Ví dụ'), heading('h4', 'Chi tiết'))
    expect(headingIds(d).map((h) => h.id)).toEqual(['mo-dau', 'vi-du', 'vi-du-2', 'chi-tiet'])
    expect(tableOfContents(d)).toEqual([
      { id: 'mo-dau', text: 'Mở đầu', level: 2 },
      { id: 'vi-du', text: 'Ví dụ', level: 3 },
      { id: 'vi-du-2', text: 'Ví dụ', level: 2 },
    ])
  })
})

describe('đường dẫn', () => {
  it('trang HTML luôn có / cuối, trang 1 không có /trang/1/', () => {
    expect(paths.post('abc')).toBe('/blog/abc/')
    expect(paths.blogPage(1)).toBe('/blog/')
    expect(paths.blogPage(3)).toBe('/blog/trang/3/')
    expect(paths.category('viet-bai', 2)).toBe('/blog/chu-de/viet-bai/trang/2/')
    expect(absoluteUrl('/blog/')).toBe(`${SITE_URL}/blog/`)
  })

  it('phân trang giữ trang đầu, cuối và hai bên trang hiện tại', () => {
    expect(pageWindow(1, 1)).toEqual([1])
    expect(pageWindow(5, 10)).toEqual([1, 'gap', 4, 5, 6, 'gap', 10])
    expect(pageWindow(2, 3)).toEqual([1, 2, 3])
  })
})

describe('JSON-LD', () => {
  it('breadcrumb đánh số từ 1, link tuyệt đối', () => {
    const b = breadcrumbJsonLd([
      { name: 'Trang chủ', path: '/' },
      { name: 'Blog', path: '/blog/' },
    ])
    expect(b.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog/` },
    ])
  })

  it('BlogPosting không có tác giả thì lấy tổ chức RealUsers', () => {
    const j = blogPostingJsonLd({
      title: 'T',
      description: 'D',
      path: '/blog/t/',
      image: '/anh/x.jpg',
      publishedAt: '2026-10-20T01:00:00.000Z',
      updatedAt: '2026-10-21T01:00:00.000Z',
      author: null,
    }) as unknown as Record<string, any>
    expect(j['@type']).toBe('BlogPosting')
    expect(j.author['@type']).toBe('Organization')
    expect(j.image).toEqual([`${SITE_URL}/anh/x.jpg`])
    expect(j.mainEntityOfPage['@id']).toBe(`${SITE_URL}/blog/t/`)
  })

  it('FAQ rỗng thì không sinh FAQPage', () => {
    expect(faqJsonLd([])).toBeNull()
    expect(faqJsonLd([{ question: 'Hỏi?', answer: 'Đáp.' }])?.mainEntity).toHaveLength(1)
  })

  it('chặn </script> trong dữ liệu', () => {
    expect(serializeJsonLd({ a: '</script><b>' })).not.toContain('</script>')
  })
})

describe('SEO bài viết', () => {
  const base = {
    id: 1,
    title: 'Bài thử',
    slug: 'bai-thu',
    excerpt: 'Sapo bài thử',
    updatedAt: '2026-11-01T00:00:00.000Z',
    createdAt: '2026-10-20T00:00:00.000Z',
    publishedAt: '2026-10-20T00:00:00.000Z',
    content: { root: { type: 'root', children: [] } },
    category: { id: 1, name: 'Viết bài', slug: 'viet-bai' },
  } as unknown as Post

  it('không có ảnh thì dùng ảnh tự vẽ /blog/<slug>/og.png', () => {
    expect(postOgImage(base)).toBe('/blog/bai-thu/og.png')
  })

  it('metadata: canonical có / cuối, og:type article, mô tả lấy sapo khi trống SEO', () => {
    const m = postMetadata(base)
    expect(m.alternates?.canonical).toBe(`${SITE_URL}/blog/bai-thu/`)
    expect((m.openGraph as { type?: string }).type).toBe('article')
    expect(m.description).toBe('Sapo bài thử')
    expect(m.robots).toMatchObject({ index: true })
  })

  it('bản nháp hoặc bài tick noindex thì không cho Google index', () => {
    expect(postMetadata(base, { draft: true }).robots).toMatchObject({ index: false })
    expect(postMetadata({ ...base, noindex: true }).robots).toMatchObject({ index: false })
  })
})

describe('ngày giờ', () => {
  it('hiển thị theo giờ Việt Nam', () => {
    expect(formatDateVN('2026-10-19T18:00:00.000Z')).toBe('20/10/2026')
    expect(dayKey('2026-10-19T18:00:00.000Z')).toBe('2026-10-20')
  })
})
