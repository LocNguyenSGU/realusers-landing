import type { PayloadRequest } from 'payload'

import { revalidatePath } from 'next/cache'

/**
 * Bài, chuyên mục, tác giả, cài đặt đổi thì làm mới toàn bộ trang dưới /blog và sitemap.
 * Trang được render sẵn (static) nên khách luôn nhận HTML có sẵn; đổi dữ liệu thì bản mới lên trong vài giây.
 *
 * Gọi ngoài Next (vd `npm run seed:old-posts`) thì revalidatePath ném lỗi vì không có server Next:
 * bỏ qua, lần build/request sau tự lấy dữ liệu mới.
 */
export function revalidateBlog(req: PayloadRequest): void {
  if (req.context?.disableRevalidate) return
  try {
    revalidatePath('/blog', 'layout')
    revalidatePath('/sitemap.xml')
    revalidatePath('/blog/rss.xml')
  } catch (err) {
    req.payload.logger.debug({ err }, 'revalidateBlog: bỏ qua vì không chạy trong Next')
  }
}
