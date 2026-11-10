import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import React from 'react'

import { SiteFooter, SiteHeader } from '@/components/SiteChrome'
import { BLOG_NAME, SITE_NAME, SITE_URL } from '@/lib/site'

import './site.css'

// Font tự host qua next/font: không gọi Google Fonts lúc khách tải trang (nhanh hơn, đỡ chặn hiển thị).
const font = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-be-vietnam',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: BLOG_NAME, template: `%s | ${SITE_NAME}` },
  applicationName: SITE_NAME,
  // File thật (không dùng data URI) để Google lấy được logo hiện trên kết quả tìm kiếm.
  icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }] },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = { themeColor: '#0866FF', width: 'device-width', initialScale: 1 }

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={font.variable}>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
