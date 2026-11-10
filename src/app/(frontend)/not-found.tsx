import Link from 'next/link'

export const metadata = { title: 'Không tìm thấy trang', robots: { index: false } }

export default function NotFound() {
  return (
    <main className="wrap notfound">
      <h1>Không tìm thấy trang này</h1>
      <p>Bài có thể đã đổi đường dẫn hoặc chưa đăng. Bạn xem các bài mới trên blog nhé.</p>
      <Link className="btn btn-primary" href="/blog/">
        Về Blog RealUsers
      </Link>
    </main>
  )
}
