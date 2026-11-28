import { beforeEach, describe, expect, it, vi } from 'vitest'

const revalidatePath = vi.fn()
vi.mock('next/cache', () => ({ revalidatePath: (...a: unknown[]) => revalidatePath(...a) }))

const { revalidatePublicPages } = await import('@/hooks/revalidate')

describe('revalidatePublicPages', () => {
  beforeEach(() => revalidatePath.mockClear())

  it('làm mới cả trang dưới layout lẫn /sitemap.xml (sitemap nằm ngoài mọi layout)', () => {
    revalidatePublicPages()
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
    expect(revalidatePath).toHaveBeenCalledWith('/sitemap.xml')
  })
})
