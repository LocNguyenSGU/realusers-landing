import { revalidatePath } from 'next/cache'

import { revalidateToken } from '@/hooks/revalidate'

/**
 * Làm mới toàn bộ trang công khai. Chỉ server tự gọi (xem src/hooks/revalidate.ts, nhánh MCP),
 * kèm khoá suy từ PAYLOAD_SECRET.
 */
export async function POST(req: Request): Promise<Response> {
  if (!process.env.PAYLOAD_SECRET || req.headers.get('authorization') !== `Bearer ${revalidateToken()}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  revalidatePath('/', 'layout')
  return Response.json({ revalidated: true })
}
