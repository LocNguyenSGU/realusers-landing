import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

import { BlogListing, categoryDescription } from '@/components/BlogListing'
import { getCategoryBySlug } from '@/lib/data'
import { listingMetadata } from '@/lib/seo'
import { BLOG_NAME, paths } from '@/lib/site'

type Args = { params: Promise<{ slug: string; n: string }> }

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug, n } = await params
  const c = await getCategoryBySlug(decodeURIComponent(slug))
  if (!c) return {}
  const page = Number(n)
  return listingMetadata({
    title: `${c.name} | ${BLOG_NAME}`,
    description: categoryDescription(c),
    path: paths.category(c.slug as string, page),
    page,
  })
}

export default async function CategoryPagedPage({ params }: Args) {
  const { slug, n } = await params
  const c = await getCategoryBySlug(decodeURIComponent(slug))
  if (!c) notFound()
  const page = Number(n)
  if (page === 1) permanentRedirect(paths.category(c.slug as string))
  return <BlogListing page={page} category={c} />
}
