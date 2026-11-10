'use client'

import { useEffect, useState } from 'react'

type Item = { href: string; label: string; current?: boolean }

/** Nút ba gạch + menu thả xuống trên màn hẹp, giống landing (public/landing.html). */
export function MobileMenu({ items, loginUrl, signupUrl }: { items: Item[]; loginUrl: string; signupUrl: string }) {
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
        aria-label={open ? 'Đóng menu' : 'Mở menu'}
        aria-expanded={open}
        aria-controls="mnav"
        onClick={() => setOpen((v) => !v)}
      >
        <i />
        <i />
        <i />
      </button>
      <nav className="mnav" id="mnav" aria-label="Menu di động" onClick={() => setOpen(false)}>
        {items.map((it) => (
          <a key={it.href} href={it.href} aria-current={it.current ? 'page' : undefined}>
            {it.label}
          </a>
        ))}
        <a href={loginUrl}>Đăng nhập</a>
        <a className="btn btn-primary" href={signupUrl}>
          Bắt đầu ngay
        </a>
      </nav>
    </>
  )
}
