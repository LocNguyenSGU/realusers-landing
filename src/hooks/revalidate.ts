import type { PayloadRequest } from 'payload'

import { revalidatePath } from 'next/cache'

/**
 * Bài, chuyên mục, tác giả, cài đặt đổi thì làm mới toàn bộ trang công khai (blog, sitemap, RSS).
 * Trang được render sẵn (static) nên khách luôn nhận HTML có sẵn; đổi dữ liệu thì bản mới lên trong vài giây.
 *
 * Gọi ngoài Next (vd `npm run seed:old-posts`) thì revalidatePath ném lỗi vì không có server Next:
 * bỏ qua, lần build/request sau tự lấy dữ liệu mới.
 */
export function revalidateBlog(req: PayloadRequest): void {
  if (req.context?.disableRevalidate) return
  try {
    // Làm mới mọi trang dưới layout gốc (blog, chuyên mục, tác giả, sitemap, RSS). Site nhỏ nên làm mới hết
    // là đơn giản và chắc nhất. Không dùng revalidatePath('/blog', 'layout'): trang nằm trong nhóm (frontend)
    // nên tag layout của chúng có cả tên nhóm, gọi '/blog' không khớp và trang không đổi (lỗi đã gặp 10/11).
    revalidatePath('/', 'layout')
  } catch (err) {
    req.payload.logger.warn({ err }, 'revalidateBlog: không làm mới được trang (chạy ngoài Next?)')
  }
}
