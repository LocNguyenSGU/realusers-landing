import { describe, expect, it } from 'vitest'

import { pageWindow } from '@/components/Pagination'
import { dayKey, formatDate, formatDateVN } from '@/lib/format'
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

describe('đa ngôn ngữ', () => {
  it('tiếng Việt giữ URL cũ không tiền tố, tiếng Anh có /en/ và tên đoạn tiếng Anh', async () => {
    const { pathsFor } = await import('@/i18n')
    expect(pathsFor('vi').post('a')).toBe('/blog/a/')
    expect(pathsFor('en').post('a')).toBe('/en/blog/a/')
    expect(pathsFor('en').category('x', 2)).toBe('/en/blog/category/x/page/2/')
    expect(pathsFor('en').author('doi')).toBe('/en/blog/author/doi/')
    expect(pathsFor('en').blogPage(3)).toBe('/en/blog/page/3/')
  })

  it('đổi URL công khai sang cây thư mục nội bộ', async () => {
    const { toInternalPath } = await import('@/i18n')
    expect(toInternalPath('/blog/')?.path).toBe('/vi/blog/')
    expect(toInternalPath('/blog/chu-de/viet-bai/trang/2/')?.path).toBe('/vi/blog/chu-de/viet-bai/trang/2/')
    expect(toInternalPath('/en/blog/category/writing/page/2/')?.path).toBe('/en/blog/chu-de/writing/trang/2/')
    expect(toInternalPath('/en/blog/page/2/')?.path).toBe('/en/blog/trang/2/')
    expect(toInternalPath('/en/blog/author/team/')?.path).toBe('/en/blog/tac-gia/team/')
    expect(toInternalPath('/en/blog/some-post/')?.path).toBe('/en/blog/some-post/')
    // Tên đoạn tiếng Việt dưới /en/ là URL trùng: đẩy vào trang 404
    expect(toInternalPath('/en/blog/chu-de/x/')?.path).toBe('/en/blog/__khong-co__/')
    // /vi/ và ngôn ngữ lạ không phải URL công khai
    expect(toInternalPath('/vi/blog/')).toBeNull()
    expect(toInternalPath('/fr/blog/')).toBeNull()
    expect(toInternalPath('/')).toBeNull()
  })

  it('hreflang chỉ khai khi có từ 2 bản, x-default trỏ bản tiếng Việt', async () => {
    const { languageAlternates } = await import('@/lib/seo')
    expect(languageAlternates({ vi: '/blog/a/' })).toBeUndefined()
    expect(languageAlternates({ vi: '/blog/a/', en: '/en/blog/b/' })).toEqual({
      vi: `${SITE_URL}/blog/a/`,
      en: `${SITE_URL}/en/blog/b/`,
      'x-default': `${SITE_URL}/blog/a/`,
    })
  })

  it('metadata bài tiếng Anh: canonical /en/, og:locale en_US, hreflang hai chiều', () => {
    const m = postMetadata({ ...base_en }, { locale: 'en', alternates: { vi: '/blog/bai-thu/', en: '/en/blog/test-post/' } })
    expect(m.alternates?.canonical).toBe(`${SITE_URL}/en/blog/test-post/`)
    expect((m.openGraph as { locale?: string }).locale).toBe('en_US')
    expect(m.alternates?.languages).toMatchObject({ vi: `${SITE_URL}/blog/bai-thu/`, en: `${SITE_URL}/en/blog/test-post/` })
  })

  it('ngày tiếng Anh', () => {
    expect(formatDate('2026-10-19T18:00:00.000Z', 'en')).toBe('Oct 20, 2026')
  })
})

const base_en = {
  id: 1,
  title: 'Test post',
  slug: 'test-post',
  excerpt: 'Excerpt',
  updatedAt: '2026-11-01T00:00:00.000Z',
  createdAt: '2026-10-20T00:00:00.000Z',
  publishedAt: '2026-10-20T00:00:00.000Z',
  content: { root: { type: 'root', children: [] } },
} as unknown as Post
