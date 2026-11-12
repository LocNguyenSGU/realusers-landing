import { notFound } from 'next/navigation'

import { isLocale, type Locale } from './index'

/** Lấy ngôn ngữ từ đoạn [lang] của đường dẫn nội bộ; mã lạ thì 404. */
export async function localeOf(params: Promise<{ lang: string }>): Promise<Locale> {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return lang
}
