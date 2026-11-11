import { DATE_LOCALE, type Locale } from '@/i18n'

const TZ = 'Asia/Ho_Chi_Minh'

/** Ngày theo giờ Việt Nam: "20/10/2026" (vi), "Oct 20, 2026" (en). */
export function formatDate(iso: string | Date | null | undefined, locale: Locale = 'vi'): string {
  if (!iso) return ''
  const d = typeof iso === 'string' ? new Date(iso) : iso
  const opts: Intl.DateTimeFormatOptions =
    locale === 'vi' ? { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ } : { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ }
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], opts).format(d)
}

export const formatDateVN = (iso: string | Date | null | undefined) => formatDate(iso, 'vi')

/** Ngày (YYYY-MM-DD) theo giờ Việt Nam, dùng so "đã sửa sau ngày đăng chưa". */
export function dayKey(iso: string | Date | null | undefined): string {
  if (!iso) return ''
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d)
}
