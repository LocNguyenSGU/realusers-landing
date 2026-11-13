import { afterEach, describe, expect, it, vi } from 'vitest'

// robots.txt đọc SITE_NOINDEX lúc nạp module, nên mỗi ca nạp lại module với biến môi trường riêng.
async function loadRobots(noindex?: string) {
  vi.resetModules()
  if (noindex === undefined) vi.stubEnv('SITE_NOINDEX', '')
  else vi.stubEnv('SITE_NOINDEX', noindex)
  return (await import('@/app/robots')).default()
}

describe('robots.txt', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('domain thật: cho index, chặn trang quản trị, trỏ sitemap', async () => {
    const r = await loadRobots()
    expect(r.rules).toEqual([{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/next/'] }])
    expect(r.sitemap).toMatch(/\/sitemap\.xml$/)
  })

  it('domain tạm (SITE_NOINDEX=true): chặn hết, không khai sitemap', async () => {
    const r = await loadRobots('true')
    expect(r.rules).toEqual([{ userAgent: '*', disallow: '/' }])
    expect(r.sitemap).toBeUndefined()
  })
})
