import Link from 'next/link'

/** Dãy số trang: luôn có trang đầu, trang cuối và 1 trang mỗi bên trang hiện tại; chỗ hở là "…". */
export function pageWindow(current: number, total: number): (number | 'gap')[] {
  const keep = new Set([1, total, current - 1, current, current + 1].filter((n) => n >= 1 && n <= total))
  const sorted = [...keep].sort((a, b) => a - b)
  const out: (number | 'gap')[] = []
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push('gap')
    out.push(n)
  })
  return out
}

export function Pagination({ current, total, href }: { current: number; total: number; href: (n: number) => string }) {
  if (total <= 1) return null
  return (
    <nav className="pagination" aria-label="Phân trang">
      {current > 1 ? (
        <Link href={href(current - 1)} rel="prev" aria-label="Trang trước">
          ←
        </Link>
      ) : null}
      {pageWindow(current, total).map((n, i) =>
        n === 'gap' ? (
          <span key={`gap-${i}`} className="gap" aria-hidden="true">
            …
          </span>
        ) : n === current ? (
          <span key={n} aria-current="page">
            {n}
          </span>
        ) : (
          <Link key={n} href={href(n)}>
            {n}
          </Link>
        ),
      )}
      {current < total ? (
        <Link href={href(current + 1)} rel="next" aria-label="Trang sau">
          →
        </Link>
      ) : null}
    </nav>
  )
}
