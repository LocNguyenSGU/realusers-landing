'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { LOCALES, pathsFor, type Locale } from '@/i18n'

const LABEL: Record<Locale, string> = { vi: 'VI', en: 'EN' }
const NAME: Record<Locale, string> = { vi: 'Tiếng Việt', en: 'English' }

/**
 * Đổi ngôn ngữ. Trang có bản dịch thì nhảy đúng sang bản dịch (đọc thẻ hreflang trang đã khai cho Google);
 * chưa có bản dịch thì về trang blog của ngôn ngữ kia. Không có JS thì vẫn là link tới trang blog.
 */
export function LangSwitch({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname()
  const fallback = Object.fromEntries(LOCALES.map((l) => [l, pathsFor(l).blog])) as Record<Locale, string>
  const [targets, setTargets] = useState<Record<Locale, string>>(fallback)

  useEffect(() => {
    const next = { ...fallback }
    for (const l of LOCALES) {
      const link = document.head.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${l}"]`)
      if (link?.href) next[l] = new URL(link.href).pathname
    }
    setTargets(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <nav className="lang" aria-label={label}>
      {LOCALES.map((l) =>
        l === locale ? (
          <span key={l} aria-current="true" title={NAME[l]}>
            {LABEL[l]}
          </span>
        ) : (
          <a key={l} href={targets[l]} hrefLang={l} lang={l} title={NAME[l]}>
            {LABEL[l]}
          </a>
        ),
      )}
    </nav>
  )
}
