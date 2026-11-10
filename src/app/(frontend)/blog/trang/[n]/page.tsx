import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'

import { BlogListing } from '@/components/BlogListing'
import { getBlogSettings, getFeaturedPost, getPostList } from '@/lib/data'
import { listingMetadata } from '@/lib/seo'
import { paths } from '@/lib/site'

type Args = { params: Promise<{ n: string }> }

export async function generateStaticParams() {
  const featured = await getFeaturedPost()
  const { totalPages } = await getPostList({ page: 1, excludeId: featured?.id })
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({ n: String(i + 2) }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { n } = await params
  const s = await getBlogSettings()
  const page = Number(n)
  return listingMetadata({
    title: s.metaTitle,
    description: s.metaDescription || s.heroIntro || '',
    path: paths.blogPage(page),
    page,
  })
}

export default async function BlogPagedPage({ params }: Args) {
  const { n } = await params
  const page = Number(n)
  if (page === 1) permanentRedirect('/blog/')
  return <BlogListing page={page} />
}
