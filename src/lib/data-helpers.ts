// Quan hệ trong Payload có thể là id (chưa populate) hoặc object. Các hàm này chỉ nhận object.
import type { Author, Category, Media } from '@/payload-types'

export const asMedia = (m: unknown): Media | null => (m && typeof m === 'object' ? (m as Media) : null)
export const asCategory = (c: unknown): Category | null => (c && typeof c === 'object' ? (c as Category) : null)
export const asAuthor = (a: unknown): Author | null => (a && typeof a === 'object' ? (a as Author) : null)
