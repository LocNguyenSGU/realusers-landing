import type { MetadataRoute } from 'next'

import { absoluteUrl, SITE_NOINDEX } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  if (SITE_NOINDEX) return { rules: [{ userAgent: '*', disallow: '/' }] }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/next/'] }],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  }
}
