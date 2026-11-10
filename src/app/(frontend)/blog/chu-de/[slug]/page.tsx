import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BlogListing, categoryDescription } from '@/components/BlogListing'
import { getCategories, getCategoryBySlug } from '@/lib/data'
import { listingMetadata } from '@/lib/seo'
import { BLOG_NAME, paths } from '@/lib/site'

type Args = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const cats = await getCategories()
  return cats.map((c) => ({ slug: c.slug as string }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const c = await getCategoryBySlug(decodeURIComponent(slug))
  if (!c) return {}
  return listingMetadata({ title: `${c.name} | ${BLOG_NAME}`, description: categoryDescription(c), path: paths.category(c.slug as string) })
}

export default async function CategoryPage({ params }: Args) {
  const { slug } = await params
  const c = await getCategoryBySlug(decodeURIComponent(slug))
  if (!c) notFound()
  return <BlogListing page={1} category={c} />
}
