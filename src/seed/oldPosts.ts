// Chuyển 3 bài blog cũ (sinh từ thread-secret scripts/build_blog.py) vào CMS.
// Giữ nguyên slug và ngày đăng 20/10/2026 để URL Google đã index không đổi.
// Chạy lại nhiều lần không sinh bản trùng: bài đã có slug thì bỏ qua.
import fs from 'fs'
import path from 'path'
import { JSDOM } from 'jsdom'
import type { Payload, PayloadRequest } from 'payload'

import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'

import { postContentEditor } from '@/collections/Posts'
import { slugify } from '@/lib/slugify'
import { SITE_NAME } from '@/lib/site'

export type OldPost = {
  slug: string
  tag: string
  title: string
  seo_title: string
  desc: string
  sapo: string
  phut: number
  body: string
}

export type OldPostsFile = { ngay: string; posts: OldPost[] }

export type SeedResult = { created: string[]; skipped: string[] }

const AUTHOR = {
  name: 'Đội RealUsers',
  slug: 'doi-realusers',
  kind: 'organization',
  jobTitle: 'Đội nội dung RealUsers',
  bio: 'Đội RealUsers viết hướng dẫn làm thương hiệu trên Threads cho chủ shop và người làm marketing.',
}

// Bản tiếng Anh của tác giả và cài đặt blog, để trang /en/blog/ có chữ ngay khi có bài tiếng Anh đầu tiên.
const AUTHOR_EN = {
  name: 'RealUsers Team',
  jobTitle: 'RealUsers content team',
  bio: 'The RealUsers team writes practical guides to building a brand on Threads for shop owners and marketers.',
}

const SETTINGS_EN = {
  heroLabel: 'RealUsers Blog',
  heroTitle: 'Build your brand on Threads',
  heroIntro: 'Practical guides for shop owners and marketers: write posts people reply to, grow engagement, and show up when customers are asking.',
  metaTitle: 'RealUsers Blog: building a brand on Threads',
  metaDescription: 'Practical guides for brands and small shops on Threads: writing posts, growing engagement, and joining the right conversations.',
  cta: {
    title: 'Want to post consistently without losing half your day?',
    text: 'RealUsers drafts conversation starters in your brand voice and finds Threads discussions about exactly what you sell. You just approve before anything goes out.',
    buttonLabel: 'Create a free account',
    url: 'https://app.realusers.net/dang-ky',
  },
}

// Tên tiếng Anh của 3 chuyên mục cũ (slug tiếng Anh riêng: /en/blog/category/<slug>/).
const CATEGORY_EN: Record<string, { name: string; slug: string }> = {
  'bat-dau': { name: 'Getting started', slug: 'getting-started' },
  'tuong-tac': { name: 'Engagement', slug: 'engagement' },
  'viet-bai': { name: 'Writing posts', slug: 'writing-posts' },
}

async function findOrCreate<T extends { id: number | string }>(
  payload: Payload,
  collection: 'authors' | 'categories',
  slug: string,
  data: Record<string, unknown>,
  req?: Partial<PayloadRequest>,
): Promise<T> {
  const found = await payload.find({ collection, locale: 'vi', where: { slug: { equals: slug } }, limit: 1, depth: 0, req })
  if (found.docs[0]) return found.docs[0] as unknown as T
  return (await payload.create({ collection, locale: 'vi', data: { ...data, slug } as never, req, context: { disableRevalidate: true } })) as unknown as T
}

export async function seedOldPosts(
  payload: Payload,
  file: OldPostsFile,
  opts: { imagesDir: string },
): Promise<SeedResult> {
  const result: SeedResult = { created: [], skipped: [] }
  const editorConfig = await editorConfigFactory.fromEditor({ config: payload.config, editor: postContentEditor })
  const publishedAt = new Date(`${file.ngay}T08:00:00+07:00`).toISOString()

  const author = await findOrCreate<{ id: number }>(payload, 'authors', AUTHOR.slug, {
    name: AUTHOR.name,
    kind: AUTHOR.kind,
    jobTitle: AUTHOR.jobTitle,
    bio: AUTHOR.bio,
  })
  const authorEn = await payload.findByID({ collection: 'authors', id: author.id, locale: 'en', fallbackLocale: false, depth: 0 })
  if (!authorEn.name) {
    await payload.update({ collection: 'authors', id: author.id, locale: 'en', data: AUTHOR_EN, context: { disableRevalidate: true } })
  }
  const settingsEn = await payload.findGlobal({ slug: 'blog-settings', locale: 'en', fallbackLocale: false, depth: 0 })
  if (!settingsEn.heroIntro) {
    await payload.updateGlobal({ slug: 'blog-settings', locale: 'en', data: SETTINGS_EN, context: { disableRevalidate: true } })
  }

  let order = 1
  for (const p of file.posts) {
    const exists = await payload.find({ collection: 'posts', locale: 'vi', where: { slug: { equals: p.slug } }, limit: 1, depth: 0, draft: true })
    if (exists.docs.length) {
      result.skipped.push(p.slug)
      continue
    }

    const category = await findOrCreate<{ id: number }>(payload, 'categories', slugify(p.tag), { name: p.tag, order: order++ })
    const en = CATEGORY_EN[slugify(p.tag)]
    if (en) {
      const cur = await payload.findByID({ collection: 'categories', id: category.id, locale: 'en', fallbackLocale: false, depth: 0 })
      if (!cur.name) {
        await payload.update({ collection: 'categories', id: category.id, locale: 'en', data: { ...en, generateSlug: false }, context: { disableRevalidate: true } })
      }
    }

    let coverId: number | undefined
    const imagePath = path.join(opts.imagesDir, `og-${p.slug}.jpg`)
    if (fs.existsSync(imagePath)) {
      const media = await payload.create({
        collection: 'media',
        locale: 'vi',
        data: { alt: p.title },
        filePath: imagePath,
        context: { disableRevalidate: true },
      })
      coverId = media.id as number
    }

    const content = convertHTMLToLexical({ editorConfig, html: p.body.trim(), JSDOM })

    const post = await payload.create({
      collection: 'posts',
      locale: 'vi',
      context: { disableRevalidate: true },
      data: {
        title: p.title,
        slug: p.slug,
        generateSlug: false,
        excerpt: p.sapo,
        content: content as never,
        coverImage: coverId,
        category: category.id,
        author: author.id,
        publishedAt,
        _status: 'published',
        meta: { title: `${p.seo_title} | ${SITE_NAME}`, description: p.desc, image: coverId },
      },
    })
    // Bài cũ chưa sửa gì từ ngày đăng: giữ updatedAt = ngày đăng, để trang không hiện "Cập nhật <hôm nay>"
    // và sitemap không báo Google là bài vừa đổi.
    await payload.db.updateOne({ collection: 'posts', id: post.id, data: { updatedAt: publishedAt }, returning: false })
    result.created.push(p.slug)
  }
  return result
}
