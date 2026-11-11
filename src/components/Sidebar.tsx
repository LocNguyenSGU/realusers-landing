import Link from 'next/link'

import { getBlogSettings, getCategories, getPicks } from '@/lib/data'
import { DICT, pathsFor, type Locale } from '@/i18n'

export async function Sidebar({ locale, currentCategory }: { locale: Locale; currentCategory?: string }) {
  const [picks, categories, settings] = await Promise.all([getPicks(locale, 5), getCategories(locale), getBlogSettings(locale)])
  const d = DICT[locale]
  const paths = pathsFor(locale)
  const cta = settings.cta
  return (
    <aside className="sidebar" aria-label={d.picks}>
      {picks.length ? (
        <section className="box">
          <h2>{d.picks}</h2>
          <ol className="picks">
            {picks.map((p) => (
              <li key={p.id}>
                <Link href={paths.post(p.slug as string)}>{p.title}</Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      {categories.filter((c) => c.count > 0).length ? (
        <section className="box">
          <h2>{d.categories}</h2>
          <ul className="catlist">
            {categories.filter((c) => c.count > 0).map((c) => (
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
              {cta.buttonLabel || d.signup}
            </a>
          ) : null}
        </section>
      ) : null}
    </aside>
  )
}
