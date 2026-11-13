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
    // Domain tạm: chặn index mọi trang, kể cả landing tĩnh (xem SITE_NOINDEX trong src/lib/site.ts).
    if (process.env.SITE_NOINDEX !== 'true') return []
    return [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }]
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

export default withPayload(nextConfig, { devBundleServerPackages: false })
