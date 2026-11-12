// Luồng đăng bài thật qua API (như bấm Publish trong /admin): bài lên trang ngay không cần build lại,
// đổi slug thì link cũ chuyển 308, gỡ đăng thì bài biến mất. Cần tài khoản admin trong DB:
// E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... npm run test:e2e
import { expect, test, type APIRequestContext } from '@playwright/test'

const email = process.env.E2E_ADMIN_EMAIL
const password = process.env.E2E_ADMIN_PASSWORD

test.describe.configure({ mode: 'serial' })
test.skip(!email || !password, 'Thiếu E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD')
test.skip(({ isMobile }) => isMobile, 'Chạy một lần là đủ')

const SLUG = 'e2e-bai-kiem-tra-dang-bai'
const NEW_SLUG = 'e2e-bai-kiem-tra-doi-slug'

const content = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children: [{ type: 'text', text: 'Nội dung kiểm tra', format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
      },
    ],
  },
}

async function login(request: APIRequestContext) {
  const res = await request.post('/api/users/login', { data: { email, password } })
  expect(res.ok()).toBeTruthy()
  return { Authorization: `JWT ${(await res.json()).token}` }
}

async function cleanup(request: APIRequestContext, headers: Record<string, string>) {
  for (const slug of [SLUG, NEW_SLUG]) {
    await request.delete(`/api/posts?where[slug][equals]=${slug}`, { headers })
  }
  await request.delete(`/api/redirects?where[from][equals]=/blog/${SLUG}/`, { headers })
}

const html = async (request: APIRequestContext, path: string) => (await request.get(path)).text()

test('đăng, đổi slug, gỡ đăng: trang công khai cập nhật ngay', async ({ request }) => {
  const headers = await login(request)
  await cleanup(request, headers)
  const cats = await (await request.get('/api/categories?limit=1')).json()

  // Mở trang trước để chắc trang đang nằm trong cache, rồi mới đăng bài.
  expect(await html(request, '/blog/')).not.toContain(SLUG)

  const created = await request.post('/api/posts', {
    headers,
    data: { title: 'E2E bài kiểm tra đăng bài', slug: SLUG, excerpt: 'Sapo e2e', category: cats.docs[0].id, _status: 'published', content },
  })
  expect(created.ok()).toBeTruthy()
  const id = (await created.json()).doc.id

  await expect.poll(() => html(request, '/blog/')).toContain(`/blog/${SLUG}/`)
  await expect.poll(async () => (await request.get(`/blog/${SLUG}/`)).status()).toBe(200)
  await expect.poll(() => html(request, '/sitemap.xml')).toContain(`/blog/${SLUG}/`)

  await request.patch(`/api/posts/${id}`, { headers, data: { slug: NEW_SLUG, generateSlug: false, _status: 'published' } })
  await expect
    .poll(async () => {
      const r = await request.get(`/blog/${SLUG}/`, { maxRedirects: 0 })
      return `${r.status()} ${r.headers()['location'] ?? ''}`
    })
    .toMatch(new RegExp(`^308 .*/blog/${NEW_SLUG}/$`))

  await request.patch(`/api/posts/${id}`, { headers, data: { _status: 'draft' } })
  await expect.poll(async () => (await request.get(`/blog/${NEW_SLUG}/`)).status()).toBe(404)
  await expect.poll(() => html(request, '/blog/')).not.toContain(NEW_SLUG)

  await cleanup(request, headers)
})
