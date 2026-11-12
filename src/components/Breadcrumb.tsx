import Link from 'next/link'

import { breadcrumbJsonLd, type Crumb } from '@/lib/jsonld'

import { JsonLd } from './JsonLd'

/** Breadcrumb hiển thị + BreadcrumbList cho Google, cùng một nguồn dữ liệu. Mục cuối là trang hiện tại. */
export function Breadcrumb({ items, label }: { items: Crumb[]; label: string }) {
  return (
    <>
      <nav className="crumb" aria-label={label}>
        <ol>
          {items.map((c, i) => (
            <li key={c.path}>
              {i === items.length - 1 ? <span aria-current="page">{c.name}</span> : <Link href={c.path}>{c.name}</Link>}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(items)} />
    </>
  )
}
