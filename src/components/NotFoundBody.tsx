'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { DEFAULT_LOCALE, DICT, isLocale, pathsFor } from '@/i18n'

/** Trang 404 theo ngôn ngữ của đường dẫn (not-found của Next không nhận params, nên đọc từ URL). */
export function NotFoundBody() {
  const first = (usePathname() || '').split('/')[1]
  const locale = isLocale(first) ? first : DEFAULT_LOCALE
  const d = DICT[locale]
  return (
    <main className="wrap notfound">
      <h1>{d.notFoundTitle}</h1>
      <p>{d.notFoundText}</p>
      <Link className="btn btn-primary" href={pathsFor(locale).blog}>
        {d.backToBlog}
      </Link>
    </main>
  )
}
