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
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230866FF'/%3E%3Cpath fill='%23fff' fill-rule='evenodd' d='M10 7h7.3c3.7 0 5.9 2.1 5.9 5.3 0 2.3-1.2 4-3.2 4.8L24 25h-5l-3.6-7.4h-1V25H10V7zm4.4 3.7v3.6h2.6c1.2 0 1.9-.7 1.9-1.8s-.7-1.8-1.9-1.8h-2.6z'/%3E%3C/svg%3E",
  },
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
