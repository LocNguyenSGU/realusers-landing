'use client'

import { useEffect, useState } from 'react'

import type { TocItem } from '@/lib/lexical'

// Heading được coi là "đang đọc" khi mép trên đã lên quá vạch này (tính cả header dính 72px).
const OFFSET = 120

/** Mục lục: sáng mục đang đọc khi lướt bài. HTML vẫn render sẵn từ server, JS chỉ thêm phần sáng. */
export function Toc({ items, variant, title }: { items: TocItem[]; variant: 'side' | 'mobile'; title: string }) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const headings = items.map((t) => document.getElementById(t.id)).filter((el): el is HTMLElement => Boolean(el))
    if (!headings.length) return
    let frame = 0
    const update = () => {
      frame = 0
      let current: string | null = null
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= OFFSET) current = h.id
        else break
      }
      // Cuộn tới cuối trang mà heading cuối chưa chạm vạch: vẫn sáng mục cuối.
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
      if (atBottom) current = headings[headings.length - 1].id
      setActive(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [items])

  const list = (
    <ol>
      {items.map((t) => (
        <li key={t.id} className={`l${t.level}`}>
          <a href={`#${t.id}`} aria-current={active === t.id ? 'location' : undefined}>
            {t.text}
          </a>
        </li>
      ))}
    </ol>
  )

  if (variant === 'mobile') {
    return (
      <details className="toc-mobile">
        <summary>{title}</summary>
        {list}
      </details>
    )
  }
  return (
    <nav className="toc" aria-label={title}>
      <h2>{title}</h2>
      {list}
    </nav>
  )
}
