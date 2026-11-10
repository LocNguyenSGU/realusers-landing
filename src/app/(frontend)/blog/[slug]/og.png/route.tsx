// Ảnh chia sẻ tự vẽ (1200x630) cho bài chưa có ảnh: nền xanh, logo, tiêu đề. Giống mẫu og-*.jpg cũ.
import fs from 'fs/promises'
import path from 'path'
import { ImageResponse } from 'next/og'

import { getPostBySlug } from '@/lib/data'

const fontPath = path.join(process.cwd(), 'src/assets/fonts/BeVietnamPro-Bold.ttf')

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(decodeURIComponent(slug))
  if (!post) return new Response('Không có bài', { status: 404 })
  const font = await fs.readFile(fontPath)
  const title = post.title
  const size = title.length > 70 ? 54 : 64

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background: 'linear-gradient(135deg, #0866FF 0%, #0866FF 60%, #3D8BFF 100%)',
          color: '#fff',
          fontFamily: 'Be Vietnam Pro',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 34 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: '#fff',
              color: '#0866FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
            }}
          >
            R
          </div>
          RealUsers
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ fontSize: size, lineHeight: 1.18, letterSpacing: -1, maxWidth: 960 }}>{title}</div>
          <div style={{ fontSize: 28, opacity: 0.75 }}>Blog RealUsers</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Be Vietnam Pro', data: font, weight: 700, style: 'normal' }],
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800' },
    },
  )
}
