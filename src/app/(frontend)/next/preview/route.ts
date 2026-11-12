// Nút "Xem trước" trong trang quản trị: bật draft mode rồi mở trang bài (thấy bản nháp, có noindex).
import config from '@payload-config'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { getPayload, type PayloadRequest } from 'payload'

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')
  if (!process.env.PREVIEW_SECRET || searchParams.get('previewSecret') !== process.env.PREVIEW_SECRET) {
    return new Response('Không được phép xem trước', { status: 403 })
  }
  // Chỉ cho chuyển tới đường dẫn nội bộ dưới /blog/ hoặc /<ngôn ngữ>/blog/, chặn open redirect.
  if (!path || !/^\/(?:[a-z]{2}\/)?blog\//.test(path)) {
    return new Response('Đường dẫn không hợp lệ', { status: 400 })
  }

  const payload = await getPayload({ config })
  const { user } = await payload.auth({ req: req as unknown as PayloadRequest, headers: req.headers })
  const draft = await draftMode()
  if (!user) {
    draft.disable()
    return new Response('Cần đăng nhập trang quản trị', { status: 403 })
  }
  draft.enable()
  redirect(path)
}
