import { NextResponse, type NextRequest } from 'next/server'

/**
 * Trang công khai luôn có "/" cuối: /blog/abc → 308 → /blog/abc/. Một URL duy nhất cho mỗi trang,
 * khớp canonical và URL cũ của 3 bài đã index. Không đụng /admin, /api (Payload), /next, /_next và file có đuôi.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname === '/' || pathname.endsWith('/')) return NextResponse.next()
  if (/^\/(admin|api|next|_next)(\/|$)/.test(pathname)) return NextResponse.next()
  if (/\.[a-z0-9]+$/i.test(pathname.split('/').pop() ?? '')) return NextResponse.next()
  // Dựng URL thường (không qua NextURL): NextURL tự bỏ "/" cuối vì next.config không bật trailingSlash.
  const url = new URL(`${pathname}/${req.nextUrl.search}`, req.url)
  return NextResponse.redirect(url, 308)
}

export const config = {
  matcher: ['/((?!_next/|api/|admin).*)'],
}
