import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const r2Host = (() => {
  try {
    return process.env.R2_PUBLIC_BASE_URL ? new URL(process.env.R2_PUBLIC_BASE_URL).hostname : null
  } catch {
    return null
  }
})()

const nextConfig: NextConfig = {
  // URL blog luôn có "/" cuối (giữ đúng URL Google đã index). Việc thêm "/" làm trong src/proxy.ts
  // để chừa /admin và /api của Payload ra, vì Payload không chạy đúng với trailingSlash của Next.
  skipTrailingSlashRedirect: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    localPatterns: [{ pathname: '/api/media/file/**' }, { pathname: '/anh/**' }],
    remotePatterns: [
      ...(r2Host ? [{ protocol: 'https' as const, hostname: r2Host }] : []),
      // Ảnh lưu trên Vercel Blob (khi không dùng R2).
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
  async headers() {
    // File tĩnh trong public/ không có mã băm trong tên, nên chỉ cache 1 ngày (không dùng immutable).
    const day = 'public, max-age=86400, stale-while-revalidate=604800'
    const list = [
      { source: '/anh/:path*', headers: [{ key: 'Cache-Control', value: day }] },
      { source: '/fonts/:path*', headers: [{ key: 'Cache-Control', value: day }] },
      { source: '/:icon(favicon.ico|favicon.svg|icon-192.png|apple-touch-icon.png)', headers: [{ key: 'Cache-Control', value: day }] },
    ]
    // Domain tạm: chặn index mọi trang, kể cả landing tĩnh (xem SITE_NOINDEX trong src/lib/site.ts).
    if (process.env.SITE_NOINDEX === 'true') {
      list.push({ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] })
    }
    return list
  },
  async rewrites() {
    return {
      // Landing là file HTML tĩnh (public/landing.html), phục vụ ở "/".
      beforeFiles: [{ source: '/', destination: '/landing.html' }],
      afterFiles: [],
      fallback: [],
    }
  },
  // Font cho ảnh chia sẻ tự vẽ (blog/[slug]/og.png) phải được đóng gói cùng hàm serverless.
  outputFileTracingIncludes: {
    '/blog/[slug]/og.png': ['./src/assets/fonts/**'],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
  turbopack: { root: path.resolve(dirname) },
}

const withPayloadConfig = withPayload(nextConfig, { devBundleServerPackages: false })

// Payload gắn Accept-CH / Critical-CH (Sec-CH-Prefers-Color-Scheme) cho mọi đường dẫn, chỉ để trang
// /admin biết chế độ sáng/tối. Critical-CH bắt trình duyệt tải lại HTML ở lần vào đầu tiên (thêm một lượt
// gửi-nhận cho mọi khách từ Google). Giới hạn khối header đó về /admin.
const payloadHeaders = withPayloadConfig.headers
export default {
  ...withPayloadConfig,
  headers: async () => {
    const list = payloadHeaders ? await payloadHeaders() : []
    return list.map((h) =>
      h.source === '/:path*' && h.headers.some((x) => x.key === 'Critical-CH')
        ? { ...h, source: '/admin/:path*', headers: h.headers }
        : h,
    )
  },
} satisfies NextConfig
