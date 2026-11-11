import { NotFoundBody } from '@/components/NotFoundBody'

export const metadata = { title: 'Không tìm thấy trang · Page not found', robots: { index: false } }

export default function NotFound() {
  return <NotFoundBody />
}
