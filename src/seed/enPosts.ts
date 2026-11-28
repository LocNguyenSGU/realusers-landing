// Bản tiếng Anh cho các bài đã có tiếng Việt, kèm một ảnh minh hoạ chèn vào thân bài (mỗi ngôn ngữ một ảnh).
// Chạy lại nhiều lần an toàn, mỗi bước tự kiểm riêng:
// - bài đã có tiêu đề tiếng Anh thì không ghi đè bản tiếng Anh;
// - thân bài (vi hoặc en) đã có ảnh mở được thì không chèn thêm;
// - ảnh trong thân bài mà file không mở được (404) thì gỡ ra, xoá bản ghi ảnh, rồi tải lại.
import fs from 'fs'
import path from 'path'
import { JSDOM } from 'jsdom'
import type { Payload } from 'payload'

import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'

import { postContentEditor } from '@/collections/Posts'
import { SITE_NAME } from '@/lib/site'

type ImageSide = { file: string; alt: string; caption?: string }
type Locale = 'vi' | 'en'

export type EnPost = {
  viSlug: string
  image?: { beforeHeading: number; vi: ImageSide; en: ImageSide }
  en: { slug: string; title: string; seoTitle: string; description: string; excerpt: string; body: string }
}

export type EnPostsFile = { posts: EnPost[] }

export type EnSeedResult = { translated: string[]; skipped: string[]; missing: string[]; imagesAdded: string[]; imagesRepaired: string[] }

type LexNode = { type?: string; tag?: string; children?: LexNode[]; value?: unknown; [k: string]: unknown }
type LexValue = { root: LexNode }

// Mỗi lần gọi Payload một context MỚI. Không dùng chung một object: plugin lưu ảnh ghi
// `skipCloudStorage = true` vào context sau lần tải đầu, dùng chung thì các ảnh sau không lên kho.
const ctx = () => ({ disableRevalidate: true })

type FileCheck = (url: string) => Promise<boolean>

/** Ảnh lưu ngoài (Blob/R2) thì hỏi thử link; ảnh lưu ổ đĩa (Payload phục vụ qua /api/media/file/) coi là có. */
export const defaultFileCheck: FileCheck = async (url) => {
  if (!/^https?:\/\//.test(url) || url.includes('/api/media/file/')) return true
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

/** Chèn ảnh ngay trước tiêu đề H2 thứ `beforeHeading` (đếm từ 0). Thiếu H2 đó thì chèn cuối bài. */
export function insertUploadBeforeHeading(value: LexValue, mediaId: number | string, beforeHeading: number): LexValue {
  const children = [...(value.root.children ?? [])]
  let seen = -1
  let at = children.length
  for (let i = 0; i < children.length; i++) {
    if (children[i].type === 'heading' && children[i].tag === 'h2') {
      seen++
      if (seen === beforeHeading) {
        at = i
        break
      }
    }
  }
  const node: LexNode = {
    type: 'upload',
    version: 3,
    format: '',
    id: `img${String(mediaId)}${Date.now().toString(36)}`,
    fields: null,
    relationTo: 'media',
    value: mediaId,
  }
  children.splice(at, 0, node)
  return { ...value, root: { ...value.root, children } }
}

const mediaIdOf = (node: LexNode): number | string | null => {
  const v = node.value
  if (v && typeof v === 'object' && 'id' in v) return (v as { id: number | string }).id
  return typeof v === 'number' || typeof v === 'string' ? v : null
}

/**
 * Giữ lại ảnh mở được, gỡ ảnh hỏng (bản ghi không còn hoặc file 404) và xoá bản ghi ảnh hỏng.
 * Trả về nội dung mới, có còn ảnh tốt không, và đã gỡ ảnh nào không.
 */
async function pruneBrokenUploads(payload: Payload, value: LexValue, check: FileCheck) {
  const children = value.root.children ?? []
  const kept: LexNode[] = []
  let hasGood = false
  let removed = false
  for (const node of children) {
    if (node.type !== 'upload') {
      kept.push(node)
      continue
    }
    const id = mediaIdOf(node)
    const media = id == null ? null : await payload.findByID({ collection: 'media', id, depth: 0, disableErrors: true })
    const ok = Boolean(media?.url && (await check(media.url)))
    if (ok) {
      kept.push(node)
      hasGood = true
    } else {
      removed = true
      if (media) await payload.delete({ collection: 'media', id: media.id, context: ctx() })
    }
  }
  return { value: { ...value, root: { ...value.root, children: kept } }, hasGood, removed }
}

async function uploadImage(payload: Payload, imagesDir: string, side: ImageSide, locale: Locale) {
  const filePath = path.join(imagesDir, side.file)
  if (!fs.existsSync(filePath)) throw new Error(`Thiếu ảnh ${filePath}`)
  // Alt bắt buộc ở ngôn ngữ mặc định (vi), nên ảnh tiếng Anh cũng ghi alt vào vi rồi cập nhật bản en.
  const media = await payload.create({
    collection: 'media',
    locale: 'vi',
    data: { alt: side.alt, caption: side.caption },
    filePath,
    context: ctx(),
  })
  if (locale === 'en') {
    await payload.update({ collection: 'media', id: media.id, locale: 'en', data: { alt: side.alt, caption: side.caption }, context: ctx() })
  }
  return media.id
}

/** Đảm bảo thân bài ở `locale` có đúng một ảnh mở được; thiếu hoặc hỏng thì tải và chèn. */
async function ensureImage(
  payload: Payload,
  postId: number | string,
  locale: Locale,
  image: NonNullable<EnPost['image']>,
  opts: { imagesDir: string; check: FileCheck },
  label: string,
  result: EnSeedResult,
) {
  const doc = await payload.findByID({ collection: 'posts', id: postId, locale, fallbackLocale: false, depth: 0, draft: true })
  if (!doc.content) return
  const pruned = await pruneBrokenUploads(payload, doc.content as unknown as LexValue, opts.check)
  if (pruned.hasGood && !pruned.removed) return
  let content: LexValue = pruned.value
  if (!pruned.hasGood) {
    const id = await uploadImage(payload, opts.imagesDir, image[locale], locale)
    content = insertUploadBeforeHeading(content, id, image.beforeHeading)
    ;(pruned.removed ? result.imagesRepaired : result.imagesAdded).push(label)
  }
  await payload.update({ collection: 'posts', id: postId, locale, data: { content: content as never }, context: ctx() })
}

export async function seedEnPosts(
  payload: Payload,
  file: EnPostsFile,
  opts: { imagesDir: string; checkFile?: FileCheck },
): Promise<EnSeedResult> {
  const result: EnSeedResult = { translated: [], skipped: [], missing: [], imagesAdded: [], imagesRepaired: [] }
  const editorConfig = await editorConfigFactory.fromEditor({ config: payload.config, editor: postContentEditor })
  const imgOpts = { imagesDir: opts.imagesDir, check: opts.checkFile ?? defaultFileCheck }

  for (const p of file.posts) {
    const found = await payload.find({ collection: 'posts', locale: 'vi', where: { slug: { equals: p.viSlug } }, limit: 1, depth: 0, draft: true })
    const post = found.docs[0]
    if (!post) {
      result.missing.push(p.viSlug)
      continue
    }

    const en = await payload.findByID({ collection: 'posts', id: post.id, locale: 'en', fallbackLocale: false, depth: 0, draft: true })
    if (en.title) {
      result.skipped.push(p.en.slug)
    } else {
      const content = convertHTMLToLexical({ editorConfig, html: p.en.body.trim(), JSDOM })
      await payload.update({
        collection: 'posts',
        id: post.id,
        locale: 'en',
        context: ctx(),
        data: {
          title: p.en.title,
          slug: p.en.slug,
          generateSlug: false,
          excerpt: p.en.excerpt,
          content: content as never,
          _status: 'published',
          meta: { title: `${p.en.seoTitle} | ${SITE_NAME}`, description: p.en.description },
        },
      })
      result.translated.push(p.en.slug)
    }

    if (p.image) {
      await ensureImage(payload, post.id, 'vi', p.image, imgOpts, `${p.viSlug} (vi)`, result)
      await ensureImage(payload, post.id, 'en', p.image, imgOpts, `${p.en.slug} (en)`, result)
    }
  }
  return result
}
