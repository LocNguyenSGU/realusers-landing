// Bản tiếng Anh cho các bài đã có tiếng Việt, kèm một ảnh minh hoạ chèn vào thân bài (mỗi ngôn ngữ một ảnh).
// Chạy lại nhiều lần an toàn:
// - bài đã có tiêu đề tiếng Anh thì không ghi đè bản tiếng Anh;
// - thân bài (vi hoặc en) đã có ảnh thì không chèn thêm.
import fs from 'fs'
import path from 'path'
import { JSDOM } from 'jsdom'
import type { Payload } from 'payload'

import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'

import { postContentEditor } from '@/collections/Posts'
import { SITE_NAME } from '@/lib/site'

type ImageSide = { file: string; alt: string; caption?: string }

export type EnPost = {
  viSlug: string
  image?: { beforeHeading: number; vi: ImageSide; en: ImageSide }
  en: { slug: string; title: string; seoTitle: string; description: string; excerpt: string; body: string }
}

export type EnPostsFile = { posts: EnPost[] }

export type EnSeedResult = { translated: string[]; skipped: string[]; missing: string[]; imagesAdded: string[] }

type LexNode = { type?: string; tag?: string; children?: LexNode[]; [k: string]: unknown }
type LexValue = { root: LexNode }

const ctx = { disableRevalidate: true }

function hasUpload(value: LexValue | null | undefined): boolean {
  return Boolean(value?.root?.children?.some((n) => n.type === 'upload'))
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

async function uploadImage(payload: Payload, imagesDir: string, side: ImageSide, locale: 'vi' | 'en') {
  const filePath = path.join(imagesDir, side.file)
  if (!fs.existsSync(filePath)) throw new Error(`Thiếu ảnh ${filePath}`)
  // Alt bắt buộc ở ngôn ngữ mặc định (vi), nên ảnh tiếng Anh cũng ghi alt vào cả vi rồi cập nhật bản en.
  const media = await payload.create({
    collection: 'media',
    locale: 'vi',
    data: { alt: side.alt, caption: side.caption },
    filePath,
    context: ctx,
  })
  if (locale === 'en') {
    await payload.update({ collection: 'media', id: media.id, locale: 'en', data: { alt: side.alt, caption: side.caption }, context: ctx })
  }
  return media.id
}

export async function seedEnPosts(payload: Payload, file: EnPostsFile, opts: { imagesDir: string }): Promise<EnSeedResult> {
  const result: EnSeedResult = { translated: [], skipped: [], missing: [], imagesAdded: [] }
  const editorConfig = await editorConfigFactory.fromEditor({ config: payload.config, editor: postContentEditor })

  for (const p of file.posts) {
    const found = await payload.find({ collection: 'posts', locale: 'vi', where: { slug: { equals: p.viSlug } }, limit: 1, depth: 0, draft: true })
    const post = found.docs[0]
    if (!post) {
      result.missing.push(p.viSlug)
      continue
    }

    // Ảnh cho bản tiếng Việt.
    if (p.image && !hasUpload(post.content as unknown as LexValue)) {
      const id = await uploadImage(payload, opts.imagesDir, p.image.vi, 'vi')
      const content = insertUploadBeforeHeading(post.content as unknown as LexValue, id, p.image.beforeHeading)
      await payload.update({ collection: 'posts', id: post.id, locale: 'vi', data: { content: content as never }, context: ctx })
      result.imagesAdded.push(`${p.viSlug} (vi)`)
    }

    const en = await payload.findByID({ collection: 'posts', id: post.id, locale: 'en', fallbackLocale: false, depth: 0, draft: true })
    if (en.title) {
      result.skipped.push(p.en.slug)
      continue
    }

    let content = convertHTMLToLexical({ editorConfig, html: p.en.body.trim(), JSDOM }) as unknown as LexValue
    if (p.image) {
      const id = await uploadImage(payload, opts.imagesDir, p.image.en, 'en')
      content = insertUploadBeforeHeading(content, id, p.image.beforeHeading)
      result.imagesAdded.push(`${p.en.slug} (en)`)
    }

    await payload.update({
      collection: 'posts',
      id: post.id,
      locale: 'en',
      context: ctx,
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
  return result
}
