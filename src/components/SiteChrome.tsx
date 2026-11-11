import Link from 'next/link'

import { DICT, pathsFor, type Locale } from '@/i18n'
import { APP_URL } from '@/lib/site'

import { LangSwitch } from './LangSwitch'
import { MobileMenu } from './MobileMenu'

// Cùng menu với landing (public/landing.html), để khách đi qua lại không thấy mất mục.
// Landing hiện chỉ có tiếng Việt nên các mục "/#..." trỏ về landing tiếng Việt ở mọi ngôn ngữ.
const navItems = (locale: Locale) => {
  const d = DICT[locale]
  return [
    { href: '/#cach-hoat-dong', label: d.nav.how },
    { href: '/#tinh-nang', label: d.nav.features },
    { href: '/#bang-gia', label: d.nav.pricing },
    { href: '/#cau-hoi', label: d.nav.faq },
    { href: pathsFor(locale).blog, label: d.blog, current: true },
  ]
}

function Logo() {
  return (
    <>
      <span className="logo-mark">Real</span>
      <span className="logo-users">Users</span>
    </>
  )
}

export function SiteHeader({ locale }: { locale: Locale }) {
  const d = DICT[locale]
  const nav = navItems(locale)
  return (
    <header className="main">
      <div className="wrap">
        <a className="logo" href="/" aria-label={`RealUsers, ${d.home}`}>
          <Logo />
        </a>
        <nav className="mainnav" aria-label={d.mainNav}>
          {nav.map((it) =>
            it.current ? (
              <Link key={it.href} href={it.href} aria-current="page">
                {it.label}
              </Link>
            ) : (
              <a key={it.href} href={it.href}>
                {it.label}
              </a>
            ),
          )}
        </nav>
        <div className="hdr-cta">
          <LangSwitch locale={locale} label={d.language} />
          <a className="hdr-login" href={`${APP_URL}/login`}>
            {d.login}
          </a>
          <a className="btn btn-primary btn-sm" href={`${APP_URL}/dang-ky`}>
            {d.signup}
          </a>
        </div>
        <MobileMenu
          items={nav}
          loginUrl={`${APP_URL}/login`}
          signupUrl={`${APP_URL}/dang-ky`}
          locale={locale}
          labels={{ open: d.menuOpen, close: d.menuClose, menu: d.mobileMenu, login: d.login, signup: d.signup, language: d.language }}
        />
      </div>
    </header>
  )
}

export function SiteFooter({ locale }: { locale: Locale }) {
  const d = DICT[locale]
  const p = pathsFor(locale)
  return (
    <footer className="site">
      <div className="wrap">
        <div className="fcols">
          <div>
            <a className="logo" href="/">
              <Logo />
            </a>
            <p>{d.footerTagline}</p>
          </div>
          <div>
            <p className="fh">{d.footer.product}</p>
            <ul>
              <li><a href="/#cach-hoat-dong">{d.footer.how}</a></li>
              <li><a href="/#tinh-nang">{d.footer.features}</a></li>
              <li><a href="/#bang-gia">{d.footer.pricing}</a></li>
            </ul>
          </div>
          <div>
            <p className="fh">{d.footer.resources}</p>
            <ul>
              <li><Link href={p.blog}>{d.blog}</Link></li>
              <li><a href={p.rss}>RSS</a></li>
              <li><a href="/#cau-hoi">{d.footer.faq}</a></li>
            </ul>
          </div>
          <div>
            <p className="fh">{d.footer.account}</p>
            <ul>
              <li><a href={`${APP_URL}/login`}>{d.login}</a></li>
              <li><a href={`${APP_URL}/dang-ky`}>{d.footer.signup}</a></li>
            </ul>
          </div>
        </div>
        <div className="legal">
          <span>© {new Date().getFullYear()} RealUsers.</span>
          <span>{d.legal}</span>
        </div>
      </div>
    </footer>
  )
}
