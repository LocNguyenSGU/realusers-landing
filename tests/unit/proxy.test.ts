import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

// proxy đọc SITE_URL lúc nạp module, nên mỗi ca nạp lại với biến môi trường riêng.
async function run(url: string, env: Record<string, string> = {}, host?: string) {
  vi.resetModules()
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
  const { proxy } = await import('@/proxy')
  const req = new NextRequest(url, host ? { headers: { host } } : undefined)
  return proxy(req)
}

describe('proxy', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('/en/ đọc landing tiếng Anh (rewrite), / thì để next.config lo', async () => {
    const en = await run('https://www.realusers.net/en/')
    expect(en.headers.get('x-middleware-rewrite')).toContain('/landing-en.html')
    const vi_ = await run('https://www.realusers.net/')
    expect(vi_.headers.get('x-middleware-rewrite')).toBeNull()
  })

  it('mở thẳng file landing thì chuyển 308 về URL công khai', async () => {
    const a = await run('https://www.realusers.net/landing.html')
    expect(a.status).toBe(308)
    expect(a.headers.get('location')).toBe('https://www.realusers.net/')
    const b = await run('https://www.realusers.net/landing-en.html')
    expect(b.headers.get('location')).toBe('https://www.realusers.net/en/')
  })

  it('production: domain *.vercel.app chuyển 308 sang www, giữ đường dẫn', async () => {
    const env = { VERCEL_ENV: 'production', NEXT_PUBLIC_SERVER_URL: 'https://www.realusers.net' }
    const r = await run('https://realusers-landing.vercel.app/blog/abc/?x=1', env, 'realusers-landing.vercel.app')
    expect(r.status).toBe(308)
    expect(r.headers.get('location')).toBe('https://www.realusers.net/blog/abc/?x=1')
    // Bản preview (không phải production) thì không chuyển.
    const p = await run('https://realusers-landing-abc.vercel.app/blog/', { ...env, VERCEL_ENV: 'preview' }, 'realusers-landing-abc.vercel.app')
    expect(p.status).not.toBe(308)
  })
})
