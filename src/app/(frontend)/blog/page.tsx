import type { Metadata } from 'next'

import { BlogListing } from '@/components/BlogListing'
import { getBlogSettings } from '@/lib/data'
import { listingMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getBlogSettings()
  return listingMetadata({ title: s.metaTitle, description: s.metaDescription || s.heroIntro || '', path: '/blog/' })
}

export default function BlogIndexPage() {
  return <BlogListing page={1} />
}
