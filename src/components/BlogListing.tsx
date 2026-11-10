import Link from 'next/link'
import { notFound } from 'next/navigation'

import type { Category } from '@/payload-types'

import { getBlogSettings, getCategories, getFeaturedPost, getPostList } from '@/lib/data'
import { collectionPageJsonLd } from '@/lib/jsonld'
import { BLOG_NAME, paths } from '@/lib/site'

import { Breadcrumb } from './Breadcrumb'
import { JsonLd } from './JsonLd'
import { Pagination } from './Pagination'
import { FeaturedPost, PostCard } from './PostCard'
import { Sidebar } from './Sidebar'

export const categoryDescription = (c: Category) =>
  c.description?.trim() || `Các bài viết chuyên mục ${c.name} trên ${BLOG_NAME}: hướng dẫn làm thương hiệu trên Threads.`

/** Trang danh sách bài: /blog/, /blog/trang/n/, /blog/chu-de/<slug>/ (+ /trang/n/). */
export async function BlogListing({ page, category }: { page: number; category?: Category }) {
  if (!Number.isInteger(page) || page < 1) notFound()
  const [settings, categories] = await Promise.all([getBlogSettings(), getCategories()])
  // Bài nổi bật chỉ ở trang /blog/ và bị loại khỏi lưới ở mọi trang, để phân trang không lệch.
  const featured = category ? null : await getFeaturedPost()
  const list = await getPostList({ page, categoryId: category?.id, excludeId: featured?.id })
  if (page > 1 && page > list.totalPages) notFound()

  const path = category ? paths.category(category.slug as string, page) : paths.blogPage(page)
  const crumbs = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Blog', path: '/blog/' },
    ...(category ? [{ name: category.name, path: paths.category(category.slug as string) }] : []),
    ...(page > 1 ? [{ name: `Trang ${page}`, path }] : []),
  ]
  const title = category ? category.name : settings.heroTitle
  const intro = category ? categoryDescription(category) : settings.heroIntro

  return (
    <main className="wrap">
      <Breadcrumb items={crumbs} />
      <JsonLd
        data={collectionPageJsonLd({
          name: category ? `${category.name} | ${BLOG_NAME}` : BLOG_NAME,
          description: intro || '',
          path,
        })}
      />
      <section className="blog-hero">
        <span className="eyebrow">{category ? 'Chuyên mục' : settings.heroLabel || BLOG_NAME}</span>
        <h1>
          {title}
          {page > 1 ? <span className="sr-only"> — Trang {page}</span> : null}
        </h1>
        {intro ? <p>{intro}</p> : null}
      </section>

      {featured && page === 1 ? <FeaturedPost post={featured} /> : null}

      <nav className="tabs" aria-label="Chuyên mục">
        <Link href="/blog/" aria-current={!category ? 'page' : undefined}>
          Tất cả
        </Link>
        {categories
          .filter((c) => c.count > 0)
          .map((c) => (
            <Link key={c.id} href={paths.category(c.slug as string)} aria-current={c.id === category?.id ? 'page' : undefined}>
              {c.name}
            </Link>
          ))}
      </nav>

      <div className="listing">
        <div>
          {list.docs.length ? (
            <div className="posts">
              {list.docs.map((p, i) => (
                <PostCard key={p.id} post={p} priority={!featured && i < 2} />
              ))}
            </div>
          ) : (
            <p className="empty">{featured ? 'Chưa có bài nào khác.' : 'Chưa có bài nào trong mục này.'}</p>
          )}
          <Pagination
            current={page}
            total={list.totalPages}
            href={(n) => (category ? paths.category(category.slug as string, n) : paths.blogPage(n))}
          />
        </div>
        <Sidebar currentCategory={category?.slug ?? undefined} />
      </div>
    </main>
  )
}
