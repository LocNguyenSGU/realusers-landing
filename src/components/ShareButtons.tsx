'use client'

import { useState } from 'react'

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)
  const enc = encodeURIComponent
  return (
    <div className="share">
      <span>Chia sẻ:</span>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener noreferrer">
        Facebook
      </a>
      <a href={`https://www.threads.net/intent/post?text=${enc(`${title} ${url}`)}`} target="_blank" rel="noopener noreferrer">
        Threads
      </a>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          } catch {
            /* trình duyệt chặn clipboard: bỏ qua */
          }
        }}
      >
        {copied ? 'Đã chép link' : 'Chép link'}
      </button>
    </div>
  )
}
