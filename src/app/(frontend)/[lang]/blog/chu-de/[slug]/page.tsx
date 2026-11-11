import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BlogListing, categoryDescription } from '@/components/BlogListing'
import { DICT, isLocale, pathsFor } from '@/i18n'
import { localeOf } from '@/i18n/server'
import { getCategories, getCategoryAlternates, getCategoryBySlug } from '@/lib/data'
import { listingMetadata } from '@/lib/seo'

type Args = { params: Promise<{ lang: string; slug: string }> }

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) return []
  const cats = await getCategories(params.lang)
  return cats.map((c) => ({ slug: c.slug as string }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const locale = await localeOf(params)
  const { slug } = await params
  const c = await getCategoryBySlug(locale, decodeURIComponent(slug))
  if (!c) return {}
  return listingMetadata({
    title: `${c.name} | ${DICT[locale].blogName}`,
    description: categoryDescription(c, locale),
    path: pathsFor(locale).category(c.slug as string),
    locale,
    alternates: await getCategoryAlternates(c.id),
  })
}

export default async function CategoryPage({ params }: Args) {
  const locale = await localeOf(params)
  const { slug } = await params
  const c = await getCategoryBySlug(locale, decodeURIComponent(slug))
  if (!c) notFound()
  return <BlogListing locale={locale} page={1} category={c} />
}
