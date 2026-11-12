import type { Metadata } from 'next'

import { BlogListing } from '@/components/BlogListing'
import { LOCALES, pathsFor } from '@/i18n'
import { localeOf } from '@/i18n/server'
import { getBlogSettings } from '@/lib/data'
import { listingMetadata } from '@/lib/seo'

type Args = { params: Promise<{ lang: string }> }

const blogAlternates = Object.fromEntries(LOCALES.map((l) => [l, pathsFor(l).blog]))

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const locale = await localeOf(params)
  const s = await getBlogSettings(locale)
  return listingMetadata({
    title: s.metaTitle,
    description: s.metaDescription || s.heroIntro || '',
    path: pathsFor(locale).blog,
    locale,
    alternates: blogAlternates,
  })
}

export default async function BlogIndexPage({ params }: Args) {
  const locale = await localeOf(params)
  return <BlogListing locale={locale} page={1} />
}
