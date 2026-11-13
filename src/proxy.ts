import { NextResponse, type NextRequest } from 'next/server'

import { DEFAULT_LOCALE, isLocale, toInternalPath } from '@/i18n'
import { SITE_URL } from '@/lib/site'

/**
 * 1. Trang công khai luôn có "/" cuối: /blog/abc → 308 → /blog/abc/. Một URL duy nhất cho mỗi trang,
 *    khớp canonical và URL cũ của 3 bài đã index.
 * 2. Đa ngôn ngữ: URL công khai /blog/... (tiếng Việt) và /en/blog/... được đổi ngầm (rewrite) sang cây
 *    thư mục nội bộ /<lang>/blog/... Gõ thẳng /vi/... thì 308 về URL không tiền tố, tránh trùng nội dung.
 * Không đụng /admin, /api (Payload), /next, /_next và file có đuôi.
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  // Production chỉ có một địa chỉ: domain *.vercel.app chuyển hẳn sang www (tránh trùng nội dung).
  const host = req.headers.get('host') ?? ''
  if (process.env.VERCEL_ENV === 'production' && host.endsWith('.vercel.app') && !/^https?:\/\/[^/]*\.vercel\.app/.test(SITE_URL)) {
    return NextResponse.redirect(new URL(`${pathname}${search}`, SITE_URL), 308)
  }
  // File landing tĩnh mở thẳng (/landing.html, /landing-en.html) thì về đúng URL công khai.
  const landing = pathname.match(/^\/landing(?:-([a-z]{2}))?\.html$/)
  if (landing) {
    const l = landing[1]
    const to = l && isLocale(l) && l !== DEFAULT_LOCALE ? `/${l}/` : '/'
    return NextResponse.redirect(new URL(`${to}${search}`, req.url), 308)
  }

  if (/^\/(admin|api|next|_next)(\/|$)/.test(pathname)) return NextResponse.next()
  const last = pathname.split('/').pop() ?? ''
  const isFile = /\.[a-z0-9]+$/i.test(last)

  if (pathname !== '/' && !pathname.endsWith('/') && !isFile) {
    // Dựng URL thường (không qua NextURL): NextURL tự bỏ "/" cuối vì next.config không bật trailingSlash.
    return NextResponse.redirect(new URL(`${pathname}/${search}`, req.url), 308)
  }

  if (pathname === `/${DEFAULT_LOCALE}` || pathname.startsWith(`/${DEFAULT_LOCALE}/`)) {
    return NextResponse.redirect(new URL(`${pathname.slice(DEFAULT_LOCALE.length + 1) || '/'}${search}`, req.url), 308)
  }

  // Landing ngôn ngữ khác: /en/ → file tĩnh public/landing-en.html (landing tiếng Việt ở "/" do next.config.ts lo).
  const home = pathname.match(/^\/([a-z]{2})\/$/)
  if (home && isLocale(home[1]) && home[1] !== DEFAULT_LOCALE) {
    return NextResponse.rewrite(new URL(`/landing-${home[1]}.html${search}`, req.url))
  }

  const internal = toInternalPath(pathname)
  if (internal) return NextResponse.rewrite(new URL(`${internal.path}${search}`, req.url))
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/|api/|admin).*)'],
}
