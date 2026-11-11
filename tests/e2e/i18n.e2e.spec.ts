// Đa ngôn ngữ: dịch một bài sang tiếng Anh qua API (như sửa ở tab English trong /admin),
// rồi kiểm /en/blog/, hreflang hai chiều, nút đổi ngôn ngữ, sitemap. Cần E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD.
import { expect, test, type APIRequestContext } from '@playwright/test'

const email = process.env.E2E_ADMIN_EMAIL
const password = process.env.E2E_ADMIN_PASSWORD
const SITE = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3100'

test.describe.configure({ mode: 'serial' })
test.skip(!email || !password, 'Thiếu E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD')

const VI_SLUG = 'e2e-bai-song-ngu'
const EN_SLUG = 'e2e-what-is-threads'

const content = {
  root: {
    type: 'root', format: '', indent: 0, version: 1,
    children: [
      { type: 'heading', tag: 'h2', format: '', indent: 0, version: 1, children: [{ type: 'text', text: 'What Threads is', format: 0, detail: 0, mode: 'normal', style: '', version: 1 }] },
      { type: 'paragraph', format: '', indent: 0, version: 1, children: [{ type: 'text', text: 'Threads is a Meta app built around text and replies.', format: 0, detail: 0, mode: 'normal', style: '', version: 1 }] },
    ],
  },
}

let headers: Record<string, string>
let postId: number

async function login(request: APIRequestContext) {
  const res = await request.post('/api/users/login', { data: { email, password } })
  expect(res.ok()).toBeTruthy()
  return { Authorization: `JWT ${(await res.json()).token}` }
}

const html = async (request: APIRequestContext, path: string) => (await request.get(path)).text()

test.beforeAll(async ({ request }) => {
  headers = await login(request)
  // Bài riêng cho test (tạo rồi xoá), không đụng bài thật.
  const cats = await (await request.get('/api/categories?limit=1')).json()
  const created = await request.post('/api/posts?locale=vi', {
    headers,
    data: { title: 'E2E bài song ngữ', slug: VI_SLUG, excerpt: 'Sapo', category: cats.docs[0].id, content, _status: 'published' },
  })
  expect(created.ok()).toBeTruthy()
  postId = (await created.json()).doc.id
  const res = await request.patch(`/api/posts/${postId}?locale=en`, {
    headers,
    data: { title: 'What is Threads? Should a small brand be there?', slug: EN_SLUG, generateSlug: false, excerpt: 'How Threads differs and when it is worth it.', content, _status: 'published' },
  })
  expect(res.ok()).toBeTruthy()
})

test.afterAll(async ({ request }) => {
  await request.delete(`/api/posts/${postId}`, { headers })
})

test('bài tiếng Anh lên /en/blog/, có hreflang trỏ qua lại bản tiếng Việt', async ({ request, isMobile }) => {
  test.skip(isMobile, 'Kiểm HTML một lần')
  await expect.poll(() => html(request, '/en/blog/')).toContain(`/en/blog/${EN_SLUG}/`)
  const en = await html(request, `/en/blog/${EN_SLUG}/`)
  expect(en).toContain('<html lang="en"')
  expect(en).toContain(`<link rel="canonical" href="${SITE}/en/blog/${EN_SLUG}/"/>`)
  expect(en).toMatch(new RegExp(`hrefLang="vi" href="${SITE}/blog/${VI_SLUG}/"`))
  expect(en).toContain('og:locale" content="en_US"')
  const vi = await html(request, `/blog/${VI_SLUG}/`)
  expect(vi).toMatch(new RegExp(`hrefLang="en" href="${SITE}/en/blog/${EN_SLUG}/"`))
  expect(vi).toMatch(new RegExp(`hrefLang="x-default" href="${SITE}/blog/${VI_SLUG}/"`))
  // Bản tiếng Anh chưa có ảnh riêng: dùng ảnh tự vẽ theo tiêu đề tiếng Anh, không mượn ảnh có chữ tiếng Việt
  expect(en).toContain(`/en/blog/${EN_SLUG}/og.png`)
  // Bài chưa dịch không hiện ở /en/blog/ và không có trang tiếng Anh
  expect(await html(request, '/en/blog/')).not.toContain('cach-tang-tuong-tac-tren-threads')
})

test('sitemap có bài tiếng Anh kèm hreflang', async ({ request, isMobile }) => {
  test.skip(isMobile, 'Kiểm một lần')
  await expect.poll(() => html(request, '/sitemap.xml')).toContain(`<loc>${SITE}/en/blog/${EN_SLUG}/</loc>`)
  const sm = await html(request, '/sitemap.xml')
  expect(sm).toContain(`hreflang="en" href="${SITE}/en/blog/${EN_SLUG}/"`)
})

test('nút đổi ngôn ngữ nhảy đúng sang bản dịch', async ({ page, isMobile }) => {
  await page.goto(`/blog/${VI_SLUG}/`)
  if (isMobile) await page.locator('.menu-btn').click()
  const scope = isMobile ? page.locator('.mnav') : page.locator('.hdr-cta')
  await scope.locator('.lang a[hreflang="en"]').click()
  await expect(page).toHaveURL(new RegExp(`/en/blog/${EN_SLUG}/$`))
  await expect(page.locator('h1')).toHaveText('What is Threads? Should a small brand be there?')
  await expect(page.locator('header.main')).toContainText(isMobile ? 'Get started' : 'Log in')
})

test('URL tiếng Việt dưới /en/ và /vi/ không tạo trang trùng', async ({ request, isMobile }) => {
  test.skip(isMobile, 'Kiểm một lần')
  expect((await request.get('/en/blog/chu-de/viet-bai/', { maxRedirects: 0 })).status()).toBe(404)
  const vi = await request.get('/vi/blog/', { maxRedirects: 0 })
  expect(vi.status()).toBe(308)
  expect(new URL(vi.headers()['location'], SITE).pathname).toBe('/blog/')
  expect((await request.get('/en/blog/category/writing-posts/', { maxRedirects: 0 })).status()).toBe(200)
})
