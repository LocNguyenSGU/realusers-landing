import { NextResponse, type NextRequest } from 'next/server'

import { DEFAULT_LOCALE, toInternalPath } from '@/i18n'

/**
 * 1. Trang công khai luôn có "/" cuối: /blog/abc → 308 → /blog/abc/. Một URL duy nhất cho mỗi trang,
 *    khớp canonical và URL cũ của 3 bài đã index.
 * 2. Đa ngôn ngữ: URL công khai /blog/... (tiếng Việt) và /en/blog/... được đổi ngầm (rewrite) sang cây
 *    thư mục nội bộ /<lang>/blog/... Gõ thẳng /vi/... thì 308 về URL không tiền tố, tránh trùng nội dung.
 * Không đụng /admin, /api (Payload), /next, /_next và file có đuôi.
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl
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

  const internal = toInternalPath(pathname)
  if (internal) return NextResponse.rewrite(new URL(`${internal.path}${search}`, req.url))
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/|api/|admin).*)'],
}
