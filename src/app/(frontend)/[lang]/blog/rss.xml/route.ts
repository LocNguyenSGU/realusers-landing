import { DICT, isLocale, LOCALES, pathsFor } from '@/i18n'
import { getPostList } from '@/lib/data'
import { absoluteUrl } from '@/lib/site'

// Render sẵn; hook revalidateBlog làm mới khi có bài mới.
export const dynamic = 'force-static'
export const dynamicParams = false
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export async function GET(_req: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) return new Response('Not found', { status: 404 })
  const paths = pathsFor(lang)
  const { docs } = await getPostList(lang, 1, { limit: 50 })
  const items = docs
    .filter((p) => !p.noindex)
    .map((p) => {
      const url = absoluteUrl(paths.post(p.slug as string))
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${esc(p.excerpt || '')}</description>
      ${p.publishedAt ? `<pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>` : ''}
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(DICT[lang].blogName)}</title>
    <link>${absoluteUrl(paths.blog)}</link>
    <description>${esc(DICT[lang].rssDescription)}</description>
    <language>${lang}</language>
    <atom:link href="${absoluteUrl(paths.rss)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}
