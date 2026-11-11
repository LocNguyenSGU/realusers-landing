import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

import { BlogListing, categoryDescription } from '@/components/BlogListing'
import { DICT, pathsFor } from '@/i18n'
import { localeOf } from '@/i18n/server'
import { getCategoryBySlug } from '@/lib/data'
import { listingMetadata } from '@/lib/seo'

type Args = { params: Promise<{ lang: string; slug: string; n: string }> }

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const locale = await localeOf(params)
  const { slug, n } = await params
  const c = await getCategoryBySlug(locale, decodeURIComponent(slug))
  if (!c) return {}
  const page = Number(n)
  return listingMetadata({
    title: `${c.name} | ${DICT[locale].blogName}`,
    description: categoryDescription(c, locale),
    path: pathsFor(locale).category(c.slug as string, page),
    page,
    locale,
  })
}

export default async function CategoryPagedPage({ params }: Args) {
  const locale = await localeOf(params)
  const { slug, n } = await params
  const c = await getCategoryBySlug(locale, decodeURIComponent(slug))
  if (!c) notFound()
  const page = Number(n)
  if (page === 1) permanentRedirect(pathsFor(locale).category(c.slug as string))
  return <BlogListing locale={locale} page={page} category={c} />
}
