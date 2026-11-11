import Link from 'next/link'
import { notFound } from 'next/navigation'

import { DICT, pathsFor, type Locale } from '@/i18n'
import type { Category } from '@/payload-types'

import { getBlogSettings, getCategories, getFeaturedPost, getPostList } from '@/lib/data'
import { collectionPageJsonLd } from '@/lib/jsonld'

import { Breadcrumb } from './Breadcrumb'
import { JsonLd } from './JsonLd'
import { Pagination } from './Pagination'
import { FeaturedPost, PostCard } from './PostCard'
import { Sidebar } from './Sidebar'

export const categoryDescription = (c: Category, locale: Locale) => c.description?.trim() || DICT[locale].categoryFallback(c.name)

/** Trang danh sách bài: /blog/, /blog/trang/n/, /blog/chu-de/<slug>/ (+ /trang/n/), và bản /en/... */
export async function BlogListing({ locale, page, category }: { locale: Locale; page: number; category?: Category }) {
  if (!Number.isInteger(page) || page < 1) notFound()
  const d = DICT[locale]
  const paths = pathsFor(locale)
  const [settings, categories] = await Promise.all([getBlogSettings(locale), getCategories(locale)])
  // Bài nổi bật chỉ ở trang /blog/ và bị loại khỏi lưới ở mọi trang, để phân trang không lệch.
  const featured = category ? null : await getFeaturedPost(locale)
  const list = await getPostList(locale, page, { categoryId: category?.id, excludeId: featured?.id })
  if (page > 1 && page > list.totalPages) notFound()

  const path = category ? paths.category(category.slug as string, page) : paths.blogPage(page)
  const crumbs = [
    { name: d.home, path: paths.home },
    { name: d.blog, path: paths.blog },
    ...(category ? [{ name: category.name, path: paths.category(category.slug as string) }] : []),
    ...(page > 1 ? [{ name: d.pageN(page), path }] : []),
  ]
  const title = category ? category.name : settings.heroTitle
  const intro = category ? categoryDescription(category, locale) : settings.heroIntro

  return (
    <main className="wrap">
      <Breadcrumb items={crumbs} label={d.breadcrumb} />
      <JsonLd
        data={collectionPageJsonLd({
          name: category ? `${category.name} | ${d.blogName}` : d.blogName,
          description: intro || '',
          path,
          locale,
        })}
      />
      <section className="blog-hero">
        <span className="eyebrow">{category ? d.category : settings.heroLabel}</span>
        <h1>
          {title}
          {page > 1 ? <span className="sr-only"> — {d.pageN(page)}</span> : null}
        </h1>
        {intro ? <p>{intro}</p> : null}
      </section>

      {featured && page === 1 ? <FeaturedPost post={featured} locale={locale} /> : null}

      <nav className="tabs" aria-label={d.categories}>
        <Link href={paths.blog} aria-current={!category ? 'page' : undefined}>
          {d.all}
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
                <PostCard key={p.id} post={p} locale={locale} priority={!featured && i < 2} />
              ))}
            </div>
          ) : (
            <p className="empty">{featured ? d.noOtherPosts : d.noPosts}</p>
          )}
          <Pagination
            current={page}
            total={list.totalPages}
            href={(n) => (category ? paths.category(category.slug as string, n) : paths.blogPage(n))}
            labels={{ nav: d.pagination, prev: d.prev, next: d.next }}
          />
        </div>
        <Sidebar locale={locale} currentCategory={category?.slug ?? undefined} />
      </div>
    </main>
  )
}
