import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import React from 'react'

import { SiteFooter, SiteHeader } from '@/components/SiteChrome'
import { DICT, LOCALES } from '@/i18n'
import { localeOf } from '@/i18n/server'
import { SITE_NAME, SITE_URL } from '@/lib/site'

import './site.css'

// Font tự host qua next/font: không gọi Google Fonts lúc khách tải trang (nhanh hơn, đỡ chặn hiển thị).
const font = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-be-vietnam',
})

// Render sẵn mọi ngôn ngữ khai trong src/i18n. Mã lạ: localeOf() trả 404.
// Không đặt dynamicParams = false ở đây: cờ đó áp xuống cả trang con, bài mới đăng (chưa có lúc build) sẽ bị 404.
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const locale = await localeOf(params)
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: DICT[locale].blogName, template: `%s | ${SITE_NAME}` },
    applicationName: SITE_NAME,
    // File thật (không dùng data URI) để Google lấy được logo hiện trên kết quả tìm kiếm.
    icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }] },
    formatDetection: { telephone: false },
  }
}

export const viewport: Viewport = { themeColor: '#0866FF', width: 'device-width', initialScale: 1 }

export default async function FrontendLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const locale = await localeOf(params)
  return (
    <html lang={locale} className={font.variable}>
      <body>
        <SiteHeader locale={locale} />
        {children}
        <SiteFooter locale={locale} />
      </body>
    </html>
  )
}
