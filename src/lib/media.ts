import type { Media } from '@/payload-types'

import { SITE_URL } from './site'

export type MediaSize = 'thumb' | 'card' | 'hero' | 'og'

/** Link ảnh theo cỡ; cỡ chưa sinh (ảnh gốc nhỏ hơn) thì dùng ảnh gốc. */
export function mediaUrl(media: Media | null | undefined, size?: MediaSize): string | null {
  if (!media) return null
  const sized = size ? media.sizes?.[size]?.url : null
  const url = sized || media.url || null
  // Payload trả link tuyệt đối theo serverURL. Ảnh cùng site đổi về đường dẫn tương đối để next/image
  // tối ưu trực tiếp (Next chặn tải ảnh từ địa chỉ nội bộ như localhost). Ảnh R2 giữ link tuyệt đối.
  return url && url.startsWith(`${SITE_URL}/`) ? url.slice(SITE_URL.length) : url
}

export function mediaDims(media: Media | null | undefined, size?: MediaSize): { width: number; height: number } {
  const s = size ? media?.sizes?.[size] : null
  return {
    width: s?.width || media?.width || 1200,
    height: s?.height || media?.height || 630,
  }
}
