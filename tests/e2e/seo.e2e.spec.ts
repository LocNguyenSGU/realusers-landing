// Kiểm danh sách SEO trên bản build thật: URL cũ giữ nguyên, thẻ meta, JSON-LD, sitemap, robots, 404, 308.
import { expect, test, type APIRequestContext } from '@playwright/test'

const OLD_POSTS = [
  'threads-la-gi-thuong-hieu-co-nen-lam',
  'cach-tang-tuong-tac-tren-threads',
  'cach-viet-bai-threads-de-nguoi-doc-tra-loi',
]

const SITE = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3100'

async function html(request: APIRequestContext, path: string) {
  const res = await request.get(path, { maxRedirects: 0 })
  return { status: res.status(), body: await res.text(), headers: res.headers() }
}

const attr = (body: string, re: RegExp) => body.match(re)?.[1] ?? null
const jsonLdTypes = (body: string) =>
  [...body.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1])['@type'])

test.describe('SEO', () => {
  test.skip(({ isMobile }) => isMobile, 'Kiểm HTML một lần là đủ')

  for (const slug of OLD_POSTS) {
    test(`bài cũ /blog/${slug}/ giữ URL và đủ thẻ SEO`, async ({ request }) => {
      const { status, body } = await html(request, `/blog/${slug}/`)
      expect(status).toBe(200)
      expect(attr(body, /<link rel="canonical" href="([^"]+)"/)).toBe(`${SITE}/blog/${slug}/`)
      expect(attr(body, /<meta property="og:type" content="([^"]+)"/)).toBe('article')
      expect(attr(body, /<meta property="article:published_time" content="([^"]+)"/)).toMatch(/^2026-10-20|^2026-10-19T/)
      expect(attr(body, /<meta property="og:image" content="([^"]+)"/)).toMatch(/^https?:\/\//)
      expect(attr(body, /<meta name="twitter:card" content="([^"]+)"/)).toBe('summary_large_image')
      expect(attr(body, /<meta name="robots" content="([^"]+)"/)).toContain('index')
      expect(body.match(/<h1[\s>]/g)).toHaveLength(1)
      const title = attr(body, /<title>([^<]+)<\/title>/) ?? ''
      expect(title.length).toBeLessThanOrEqual(75)
      expect(jsonLdTypes(body)).toEqual(expect.arrayContaining(['BlogPosting', 'BreadcrumbList']))
      expect(body).toContain('<html lang="vi"')
    })
  }

  test('URL thiếu / cuối chuyển 308 sang có /', async ({ request }) => {
    const res = await request.get(`/blog/${OLD_POSTS[0]}`, { maxRedirects: 0 })
    expect(res.status()).toBe(308)
    expect(new URL(res.headers()['location'], SITE).pathname).toBe(`/blog/${OLD_POSTS[0]}/`)
    const blog = await request.get('/blog', { maxRedirects: 0 })
    expect(new URL(blog.headers()['location'], SITE).pathname).toBe('/blog/')
  })

  test('trang /blog/ có H1, link 3 bài, canonical, CollectionPage', async ({ request }) => {
    const { status, body } = await html(request, '/blog/')
    expect(status).toBe(200)
    expect(attr(body, /<link rel="canonical" href="([^"]+)"/)).toBe(`${SITE}/blog/`)
    for (const slug of OLD_POSTS) expect(body).toContain(`href="/blog/${slug}/"`)
    expect(body.match(/<h1[\s>]/g)).toHaveLength(1)
    expect(jsonLdTypes(body)).toEqual(expect.arrayContaining(['CollectionPage', 'BreadcrumbList']))
  })

  test('trang chuyên mục và tác giả là đường dẫn riêng, có canonical', async ({ request }) => {
    for (const path of ['/blog/chu-de/viet-bai/', '/blog/tac-gia/doi-realusers/']) {
      const { status, body } = await html(request, path)
      expect(status).toBe(200)
      expect(attr(body, /<link rel="canonical" href="([^"]+)"/)).toBe(`${SITE}${path}`)
    }
  })

  test('bài không tồn tại và trang vượt số trang trả 404 thật', async ({ request }) => {
    expect((await html(request, '/blog/khong-co-bai-nay/')).status).toBe(404)
    expect((await html(request, '/blog/trang/99/')).status).toBe(404)
  })

  test('sitemap có đủ bài với lastmod, robots trỏ sitemap và chặn trang quản trị', async ({ request }) => {
    const sm = await (await request.get('/sitemap.xml')).text()
    for (const slug of OLD_POSTS) expect(sm).toContain(`<loc>${SITE}/blog/${slug}/</loc>`)
    expect(sm).toMatch(/<lastmod>2026-/)
    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`)
    expect(robots).toContain('Disallow: /admin')
  })

  test('RSS và ảnh chia sẻ tự vẽ chạy được', async ({ request }) => {
    const rss = await request.get('/blog/rss.xml')
    expect(rss.headers()['content-type']).toContain('application/rss+xml')
    expect(await rss.text()).toContain(`${SITE}/blog/${OLD_POSTS[0]}/`)
    const og = await request.get(`/blog/${OLD_POSTS[0]}/og.png`)
    expect(og.status()).toBe(200)
    expect(og.headers()['content-type']).toBe('image/png')
  })

  test('favicon là file thật Google đọc được, trang nào cũng trỏ tới', async ({ request }) => {
    const icon = await request.get('/favicon.svg')
    expect(icon.status()).toBe(200)
    expect(icon.headers()['content-type']).toContain('image/svg+xml')
    for (const path of ['/', '/blog/']) expect((await html(request, path)).body).toMatch(/<link rel="icon" href="\/favicon\.svg"/)
  })

  test('landing vẫn ở "/"', async ({ request }) => {
    const { status, body } = await html(request, '/')
    expect(status).toBe(200)
    expect(body).toContain('RealUsers')
    expect(body).toContain('href="https://www.realusers.net/blog/"')
  })
})

test.describe('Giao diện', () => {
  for (const path of ['/blog/', `/blog/${OLD_POSTS[1]}/`]) {
    test(`${path} không tràn ngang`, async ({ page }) => {
      await page.goto(path)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }

  test('lướt bài thì mục lục sáng đúng mục đang đọc', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Mục lục bên phải chỉ có trên màn rộng')
    await page.goto(`/blog/${OLD_POSTS[1]}/`)
    const links = page.locator('nav.toc a')
    const third = (await links.nth(2).getAttribute('href'))!.slice(1)
    await page.evaluate((id) => {
      const el = document.getElementById(id)!
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 100)
    }, third)
    await expect(links.nth(2)).toHaveAttribute('aria-current', 'location')
    await expect(page.locator('nav.toc a[aria-current]')).toHaveCount(1)
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(page.locator('nav.toc a[aria-current]')).toHaveCount(0)
  })

  test('mục lục nhảy đúng tới heading', async ({ page, isMobile }) => {
    await page.goto(`/blog/${OLD_POSTS[1]}/`)
    const toc = isMobile ? page.locator('.toc-mobile') : page.locator('nav.toc')
    if (isMobile) await toc.locator('summary').click()
    const first = toc.locator('a').first()
    const id = (await first.getAttribute('href'))!.slice(1)
    await first.click()
    await expect(page.locator(`[id="${id}"]`)).toBeInViewport()
  })
})
