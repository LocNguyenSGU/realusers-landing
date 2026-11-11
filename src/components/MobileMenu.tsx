'use client'

import { useEffect, useState } from 'react'

import type { Locale } from '@/i18n'

import { LangSwitch } from './LangSwitch'

type Item = { href: string; label: string; current?: boolean }

/** Nút ba gạch + menu thả xuống trên màn hẹp, giống landing (public/landing.html). */
type Labels = { open: string; close: string; menu: string; login: string; signup: string; language: string }

export function MobileMenu({ items, loginUrl, signupUrl, labels, locale }: { items: Item[]; loginUrl: string; signupUrl: string; labels: Labels; locale: Locale }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const header = document.querySelector('header.main')
    header?.classList.toggle('nav-open', open)
  }, [open])

  return (
    <>
      <button
        className="menu-btn"
        type="button"
        aria-label={open ? labels.close : labels.open}
        aria-expanded={open}
        aria-controls="mnav"
        onClick={() => setOpen((v) => !v)}
      >
        <i />
        <i />
        <i />
      </button>
      <nav className="mnav" id="mnav" aria-label={labels.menu} onClick={() => setOpen(false)}>
        {items.map((it) => (
          <a key={it.href} href={it.href} aria-current={it.current ? 'page' : undefined}>
            {it.label}
          </a>
        ))}
        <div className="mnav-lang">
          <LangSwitch locale={locale} label={labels.language} />
        </div>
        <a href={loginUrl}>{labels.login}</a>
        <a className="btn btn-primary" href={signupUrl}>
          {labels.signup}
        </a>
      </nav>
    </>
  )
}
