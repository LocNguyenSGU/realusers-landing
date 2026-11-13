import { DEFAULT_LOCALE, pathsFor } from '@/i18n'

// Hằng số dùng chung cho toàn site. URL gốc đọc từ env để chạy được ở máy, preview và production.

export const SITE_URL = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.realusers.net').replace(/\/$/, '')
// Chạy thử trên domain tạm (*.vercel.app) thì đặt SITE_NOINDEX=true: robots.txt chặn hết và mọi trang
// gửi header X-Robots-Tag: noindex (next.config.ts), để Google không index bản trùng nội dung với www.
// Gắn domain thật rồi thì xoá biến này và deploy lại.
export const SITE_NOINDEX = process.env.SITE_NOINDEX === 'true'
export const APP_URL = 'https://app.realusers.net'
export const SITE_NAME = 'RealUsers'
export const BLOG_NAME = 'Blog RealUsers'
export const DEFAULT_OG_IMAGE = '/anh/og-realusers.jpg'
export const PAGE_SIZE = 12

/** Đường dẫn tuyệt đối, luôn có `/` cuối với trang HTML (giữ đúng URL Google đã index). */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

/** Đường dẫn tiếng Việt (ngôn ngữ mặc định). Ngôn ngữ khác: pathsFor(locale) trong src/i18n. */
export const paths = pathsFor(DEFAULT_LOCALE)

/** Slug bài không được trùng các đoạn đường dẫn cố định dưới /blog/. */
export const RESERVED_POST_SLUGS = ['trang', 'chu-de', 'tac-gia', 'page', 'category', 'author', 'rss.xml', '__khong-co__']
