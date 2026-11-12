// Icon giao diện: bộ Lucide (ISC, @iconify-json/lucide 1.2.100, lấy qua design-taste-frontend/icons.mjs).
// Vẽ inline để nhận màu chữ (currentColor). Logo thương hiệu (Facebook, Threads) là file thật trong public/icons/.
import type { SVGProps } from 'react'

const PATHS = {
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
  check: <path d="M20 6L9 17l-5-5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  calendar: (
    <>
      <path d="M8 2v4m8-4v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </>
  ),
  refresh: (
    <>
      <path d="M3 12a9 9 0 0 1 9-9a9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5m5 4a9 9 0 0 1-9 9a9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </>
  ),
  arrowRight: <path d="M5 12h14m-7-7l7 7l-7 7" />,
  arrowLeft: <path d="m12 19l-7-7l7-7m7 7H5" />,
  list: <path d="M3 12h.01M3 18h.01M3 6h.01M8 12h13M8 18h13M8 6h13" />,
  rss: (
    <>
      <path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1" />
    </>
  ),
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 16, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="i"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  )
}

/** Logo thật của nền tảng (màu gốc), file tĩnh trong public/icons. */
export function BrandIcon({ name, size = 18 }: { name: 'facebook' | 'threads'; size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`brand-ic brand-${name}`} src={`/icons/${name}.svg`} alt="" width={size} height={size} aria-hidden="true" />
}
