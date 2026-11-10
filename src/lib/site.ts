// Hằng số dùng chung cho toàn site. URL gốc đọc từ env để chạy được ở máy, preview và production.

export const SITE_URL = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.realusers.net').replace(/\/$/, '')
export const APP_URL = 'https://app.realusers.net'
export const SITE_NAME = 'RealUsers'
export const BLOG_NAME = 'Blog RealUsers'
export const DEFAULT_OG_IMAGE = '/anh/og-realusers.jpg'
export const PAGE_SIZE = 12
export const LOCALE = 'vi_VN'

/** Đường dẫn tuyệt đối, luôn có `/` cuối với trang HTML (giữ đúng URL Google đã index). */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

export const paths = {
  home: '/',
  blog: '/blog/',
  blogPage: (n: number) => (n <= 1 ? '/blog/' : `/blog/trang/${n}/`),
  post: (slug: string) => `/blog/${slug}/`,
  category: (slug: string, n = 1) => (n <= 1 ? `/blog/chu-de/${slug}/` : `/blog/chu-de/${slug}/trang/${n}/`),
  author: (slug: string) => `/blog/tac-gia/${slug}/`,
  postOgImage: (slug: string) => `/blog/${slug}/og.png`,
  rss: '/blog/rss.xml',
}

/** Slug bài không được trùng các đoạn đường dẫn cố định dưới /blog/. */
export const RESERVED_POST_SLUGS = ['trang', 'chu-de', 'tac-gia', 'rss.xml']
