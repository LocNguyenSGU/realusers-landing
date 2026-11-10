import Link from 'next/link'

import { getBlogSettings, getCategories, getPicks } from '@/lib/data'
import { paths } from '@/lib/site'

export async function Sidebar({ currentCategory }: { currentCategory?: string }) {
  const [picks, categories, settings] = await Promise.all([getPicks(5), getCategories(), getBlogSettings()])
  const cta = settings.cta
  return (
    <aside className="sidebar" aria-label="Cột phụ">
      {picks.length ? (
        <section className="box">
          <h2>Bài nên đọc</h2>
          <ol className="picks">
            {picks.map((p) => (
              <li key={p.id}>
                <Link href={paths.post(p.slug as string)}>{p.title}</Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      {categories.length ? (
        <section className="box">
          <h2>Chuyên mục</h2>
          <ul className="catlist">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={paths.category(c.slug as string)} aria-current={c.slug === currentCategory ? 'page' : undefined}>
                  {c.name} <span>{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {cta?.title ? (
        <section className="box dark">
          <h2>{cta.title}</h2>
          {cta.text ? <p>{cta.text}</p> : null}
          {cta.url ? (
            <a className="btn btn-primary btn-sm" href={cta.url}>
              {cta.buttonLabel || 'Bắt đầu ngay'}
            </a>
          ) : null}
        </section>
      ) : null}
    </aside>
  )
}
