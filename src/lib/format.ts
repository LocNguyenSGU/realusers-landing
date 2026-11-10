const TZ = 'Asia/Ho_Chi_Minh'

/** "20/10/2026" theo giờ Việt Nam. */
export function formatDateVN(iso: string | Date | null | undefined): string {
  if (!iso) return ''
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ }).format(d)
}

/** Ngày (YYYY-MM-DD) theo giờ Việt Nam, dùng so "đã sửa sau ngày đăng chưa". */
export function dayKey(iso: string | Date | null | undefined): string {
  if (!iso) return ''
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d)
}
