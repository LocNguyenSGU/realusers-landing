import { createHmac } from 'crypto'
import type { PayloadRequest } from 'payload'

import { revalidatePath } from 'next/cache'

import { SITE_URL } from '@/lib/site'

/** Khoá cho route /next/revalidate, suy từ PAYLOAD_SECRET (không cần thêm biến môi trường). */
export function revalidateToken(): string {
  return createHmac('sha256', process.env.PAYLOAD_SECRET || '').update('revalidate-blog').digest('hex')
}

/**
 * Bài, chuyên mục, tác giả, cài đặt đổi thì làm mới toàn bộ trang công khai (blog, sitemap, RSS).
 * Trang được render sẵn (static) nên khách luôn nhận HTML có sẵn; đổi dữ liệu thì bản mới lên trong vài giây.
 *
 * Gọi ngoài Next (vd `npm run seed:old-posts`) thì revalidatePath ném lỗi vì không có server Next:
 * bỏ qua, lần build/request sau tự lấy dữ liệu mới.
 *
 * Ghi qua MCP (/api/mcp) thì revalidatePath không có tác dụng: route trả về luồng (stream) ngay, công cụ
 * chạy sau khi Next đã chốt danh sách trang cần làm mới, nên /blog/ giữ bản cũ (lỗi gặp 22/11 trên production).
 * Khi đó gọi route /next/revalidate, một request riêng, làm mới chắc chắn.
 */
export async function revalidateBlog(req: PayloadRequest): Promise<void> {
  if (req.context?.disableRevalidate) return
  if (req.payloadAPI === 'MCP') return revalidateViaRoute(req)
  try {
    // Làm mới mọi trang dưới layout gốc (blog, chuyên mục, tác giả, sitemap, RSS). Site nhỏ nên làm mới hết
    // là đơn giản và chắc nhất. Không dùng revalidatePath('/blog', 'layout'): trang nằm trong nhóm (frontend)
    // nên tag layout của chúng có cả tên nhóm, gọi '/blog' không khớp và trang không đổi (lỗi đã gặp 10/11).
    revalidatePath('/', 'layout')
  } catch (err) {
    req.payload.logger.warn({ err }, 'revalidateBlog: không làm mới được trang (chạy ngoài Next?)')
  }
}

async function revalidateViaRoute(req: PayloadRequest): Promise<void> {
  let origin = SITE_URL
  try {
    if (req.url) origin = new URL(req.url).origin
  } catch {
    // giữ SITE_URL
  }
  try {
    const res = await fetch(`${origin}/next/revalidate`, {
      method: 'POST',
      headers: { authorization: `Bearer ${revalidateToken()}` },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) req.payload.logger.warn(`revalidateBlog: /next/revalidate trả ${res.status}`)
  } catch (err) {
    req.payload.logger.warn({ err }, 'revalidateBlog: không gọi được /next/revalidate')
  }
}
