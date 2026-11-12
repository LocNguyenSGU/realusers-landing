import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'

import { BlogListing } from '@/components/BlogListing'
import { isLocale, pathsFor } from '@/i18n'
import { localeOf } from '@/i18n/server'
import { getBlogSettings, getFeaturedPost, getPostList } from '@/lib/data'
import { listingMetadata } from '@/lib/seo'

type Args = { params: Promise<{ lang: string; n: string }> }

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) return []
  const featured = await getFeaturedPost(params.lang)
  const { totalPages } = await getPostList(params.lang, 1, { excludeId: featured?.id })
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({ n: String(i + 2) }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const locale = await localeOf(params)
  const { n } = await params
  const s = await getBlogSettings(locale)
  const page = Number(n)
  return listingMetadata({
    title: s.metaTitle,
    description: s.metaDescription || s.heroIntro || '',
    path: pathsFor(locale).blogPage(page),
    page,
    locale,
  })
}

export default async function BlogPagedPage({ params }: Args) {
  const locale = await localeOf(params)
  const { n } = await params
  const page = Number(n)
  if (page === 1) permanentRedirect(pathsFor(locale).blog)
  return <BlogListing locale={locale} page={page} />
}
