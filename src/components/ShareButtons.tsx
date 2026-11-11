'use client'

import { useState } from 'react'

export function ShareButtons({ url, title, labels }: { url: string; title: string; labels: { share: string; copy: string; copied: string } }) {
  const [copied, setCopied] = useState(false)
  const enc = encodeURIComponent
  return (
    <div className="share">
      <span>{labels.share}</span>
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
        {copied ? labels.copied : labels.copy}
      </button>
    </div>
  )
}
