import Link from 'next/link'

import { APP_URL } from '@/lib/site'

function Logo() {
  return (
    <>
      <span className="logo-mark">Real</span>
      <span className="logo-users">Users</span>
    </>
  )
}

export function SiteHeader() {
  return (
    <header className="main">
      <div className="wrap">
        <a className="logo" href="/" aria-label="RealUsers, trang chủ">
          <Logo />
        </a>
        <nav className="mainnav" aria-label="Chính">
          <a href="/#tinh-nang">Tính năng</a>
          <a href="/#bang-gia">Bảng giá</a>
          <Link href="/blog/" aria-current="page">
            Blog
          </Link>
        </nav>
        <div className="hdr-cta">
          <a className="hdr-login" href={`${APP_URL}/login`}>
            Đăng nhập
          </a>
          <a className="btn btn-primary btn-sm" href={`${APP_URL}/dang-ky`}>
            Bắt đầu ngay
          </a>
        </div>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="site">
      <div className="wrap">
        <div className="fcols">
          <div>
            <a className="logo" href="/">
              <Logo />
            </a>
            <p>RealUsers, nền tảng Conversation Marketing trên Threads.</p>
          </div>
          <div>
            <p className="fh">Sản phẩm</p>
            <ul>
              <li><a href="/#cach-hoat-dong">Cách hoạt động</a></li>
              <li><a href="/#tinh-nang">Tính năng</a></li>
              <li><a href="/#bang-gia">Bảng giá</a></li>
            </ul>
          </div>
          <div>
            <p className="fh">Tài nguyên</p>
            <ul>
              <li><Link href="/blog/">Blog</Link></li>
              <li><a href="/blog/rss.xml">RSS</a></li>
              <li><a href="/#cau-hoi">Câu hỏi</a></li>
            </ul>
          </div>
          <div>
            <p className="fh">Tài khoản</p>
            <ul>
              <li><a href={`${APP_URL}/login`}>Đăng nhập</a></li>
              <li><a href={`${APP_URL}/dang-ky`}>Đăng ký</a></li>
            </ul>
          </div>
        </div>
        <div className="legal">
          <span>© {new Date().getFullYear()} RealUsers.</span>
          <span>RealUsers không liên kết với Meta. Threads là nhãn hiệu của Meta Platforms, Inc.</span>
        </div>
      </div>
    </footer>
  )
}
