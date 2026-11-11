// Ngôn ngữ của site. Thêm ngôn ngữ mới: thêm mã vào LOCALES, một bộ chữ trong DICT, tên đoạn đường dẫn
// trong SEGMENTS, rồi thêm mã vào `localization.locales` của payload.config.ts (kèm migration).

export const LOCALES = ['vi', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'vi'

export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && (LOCALES as readonly string[]).includes(v)

/** Mã cho thẻ og:locale và định dạng ngày. */
export const OG_LOCALE: Record<Locale, string> = { vi: 'vi_VN', en: 'en_US' }
export const DATE_LOCALE: Record<Locale, string> = { vi: 'vi-VN', en: 'en-US' }

/**
 * Tên đoạn đường dẫn công khai theo từng ngôn ngữ. Tiếng Việt giữ đúng URL cũ (không có tiền tố),
 * ngôn ngữ khác có tiền tố /<mã>/. Bên trong, Next luôn chạy theo cây thư mục tiếng Việt
 * (src/app/(frontend)/[lang]/blog/trang|chu-de|tac-gia) — src/proxy.ts đổi qua lại.
 */
export const SEGMENTS: Record<Locale, { page: string; category: string; author: string }> = {
  vi: { page: 'trang', category: 'chu-de', author: 'tac-gia' },
  en: { page: 'page', category: 'category', author: 'author' },
}

const prefix = (locale: Locale) => (locale === DEFAULT_LOCALE ? '' : `/${locale}`)

export function pathsFor(locale: Locale) {
  const p = prefix(locale)
  const s = SEGMENTS[locale]
  return {
    home: locale === DEFAULT_LOCALE ? '/' : `${p}/`,
    blog: `${p}/blog/`,
    blogPage: (n: number) => (n <= 1 ? `${p}/blog/` : `${p}/blog/${s.page}/${n}/`),
    post: (slug: string) => `${p}/blog/${slug}/`,
    category: (slug: string, n = 1) => (n <= 1 ? `${p}/blog/${s.category}/${slug}/` : `${p}/blog/${s.category}/${slug}/${s.page}/${n}/`),
    author: (slug: string) => `${p}/blog/${s.author}/${slug}/`,
    postOgImage: (slug: string) => `${p}/blog/${slug}/og.png`,
    rss: `${p}/blog/rss.xml`,
  }
}

/** Đổi đường dẫn công khai sang đường dẫn nội bộ của Next (/<lang>/blog/... với tên đoạn tiếng Việt). */
export function toInternalPath(pathname: string): { path: string; locale: Locale } | null {
  const m = pathname.match(/^\/(?:([a-z]{2})\/)?blog(\/.*)?$/)
  if (!m) return null
  const locale = (m[1] ?? DEFAULT_LOCALE) as string
  if (!isLocale(locale) || (m[1] && locale === DEFAULT_LOCALE)) return null
  let rest = m[2] ?? ''
  if (locale !== DEFAULT_LOCALE) {
    // Tên đoạn tiếng Việt dưới /en/ là URL trùng nội dung: cho rơi vào trang 404 của bài.
    const vi = SEGMENTS[DEFAULT_LOCALE]
    if (new RegExp(`^/(${vi.category}|${vi.author}|${vi.page})/`).test(rest)) {
      return { path: `/${locale}/blog/__khong-co__/`, locale }
    }
    const from = SEGMENTS[locale]
    const to = SEGMENTS[DEFAULT_LOCALE]
    rest = rest
      .replace(new RegExp(`^/${from.category}/`), `/${to.category}/`)
      .replace(new RegExp(`^/${from.author}/`), `/${to.author}/`)
      .replace(new RegExp(`(^|/[^/]+/[^/]+)/${from.page}/(\\d+)/`), `$1/${to.page}/$2/`)
  }
  return { path: `/${locale}/blog${rest}`, locale }
}

type Dict = {
  home: string
  blog: string
  blogName: string
  nav: { how: string; features: string; pricing: string; faq: string }
  login: string
  signup: string
  signupLong: string
  menuOpen: string
  menuClose: string
  mobileMenu: string
  mainNav: string
  breadcrumb: string
  pageN: (n: number) => string
  category: string
  categories: string
  all: string
  picks: string
  featured: string
  noPosts: string
  noOtherPosts: string
  minRead: (n: number) => string
  published: string
  updated: string
  toc: string
  faq: string
  share: string
  copyLink: string
  copied: string
  aboutAuthor: string
  related: string
  posts: (n: number) => string
  pagination: string
  prev: string
  next: string
  notFoundTitle: string
  notFoundText: string
  backToBlog: string
  teamName: string
  categoryFallback: (name: string) => string
  authorFallback: (name: string) => string
  rssDescription: string
  footerTagline: string
  footer: { product: string; resources: string; account: string; how: string; features: string; pricing: string; faq: string; signup: string }
  legal: string
  language: string
}

export const DICT: Record<Locale, Dict> = {
  vi: {
    home: 'Trang chủ',
    blog: 'Blog',
    blogName: 'Blog RealUsers',
    nav: { how: 'Cách hoạt động', features: 'Tính năng', pricing: 'Bảng giá', faq: 'Câu hỏi' },
    login: 'Đăng nhập',
    signup: 'Bắt đầu ngay',
    signupLong: 'Tạo tài khoản miễn phí',
    menuOpen: 'Mở menu',
    menuClose: 'Đóng menu',
    mobileMenu: 'Menu di động',
    mainNav: 'Chính',
    breadcrumb: 'Đường dẫn',
    pageN: (n) => `Trang ${n}`,
    category: 'Chuyên mục',
    categories: 'Chuyên mục',
    all: 'Tất cả',
    picks: 'Bài nên đọc',
    featured: 'Bài nổi bật',
    noPosts: 'Chưa có bài nào trong mục này.',
    noOtherPosts: 'Chưa có bài nào khác.',
    minRead: (n) => `${n} phút đọc`,
    published: 'Đăng',
    updated: 'Cập nhật',
    toc: 'Mục lục',
    faq: 'Câu hỏi thường gặp',
    share: 'Chia sẻ:',
    copyLink: 'Chép link',
    copied: 'Đã chép link',
    aboutAuthor: 'Về tác giả',
    related: 'Bài viết liên quan',
    posts: (n) => `Bài viết (${n})`,
    pagination: 'Phân trang',
    prev: 'Trang trước',
    next: 'Trang sau',
    notFoundTitle: 'Không tìm thấy trang này',
    notFoundText: 'Bài có thể đã đổi đường dẫn hoặc chưa đăng. Bạn xem các bài mới trên blog nhé.',
    backToBlog: 'Về Blog RealUsers',
    teamName: 'Đội RealUsers',
    categoryFallback: (name) => `Các bài viết chuyên mục ${name} trên Blog RealUsers: hướng dẫn làm thương hiệu trên Threads.`,
    authorFallback: (name) => `Các bài viết của ${name} trên Blog RealUsers.`,
    rssDescription: 'Hướng dẫn làm thương hiệu trên Threads cho chủ shop và người làm marketing.',
    footerTagline: 'RealUsers, nền tảng Conversation Marketing trên Threads.',
    footer: {
      product: 'Sản phẩm',
      resources: 'Tài nguyên',
      account: 'Tài khoản',
      how: 'Cách hoạt động',
      features: 'Tính năng',
      pricing: 'Bảng giá',
      faq: 'Câu hỏi',
      signup: 'Đăng ký',
    },
    legal: 'RealUsers không liên kết với Meta. Threads và Facebook là nhãn hiệu của Meta Platforms, Inc.',
    language: 'Ngôn ngữ',
  },
  en: {
    home: 'Home',
    blog: 'Blog',
    blogName: 'RealUsers Blog',
    nav: { how: 'How it works', features: 'Features', pricing: 'Pricing', faq: 'FAQ' },
    login: 'Log in',
    signup: 'Get started',
    signupLong: 'Create a free account',
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
    mobileMenu: 'Mobile menu',
    mainNav: 'Main',
    breadcrumb: 'Breadcrumb',
    pageN: (n) => `Page ${n}`,
    category: 'Category',
    categories: 'Categories',
    all: 'All',
    picks: 'Recommended reads',
    featured: 'Featured',
    noPosts: 'No posts in this category yet.',
    noOtherPosts: 'No other posts yet.',
    minRead: (n) => `${n} min read`,
    published: 'Published',
    updated: 'Updated',
    toc: 'Contents',
    faq: 'Frequently asked questions',
    share: 'Share:',
    copyLink: 'Copy link',
    copied: 'Link copied',
    aboutAuthor: 'About the author',
    related: 'Related posts',
    posts: (n) => `Posts (${n})`,
    pagination: 'Pagination',
    prev: 'Previous page',
    next: 'Next page',
    notFoundTitle: 'Page not found',
    notFoundText: 'This post may have moved or is not published yet. Have a look at the latest posts on the blog.',
    backToBlog: 'Back to the RealUsers Blog',
    teamName: 'RealUsers Team',
    categoryFallback: (name) => `Posts in ${name} on the RealUsers Blog: practical guides to building a brand on Threads.`,
    authorFallback: (name) => `Posts by ${name} on the RealUsers Blog.`,
    rssDescription: 'Practical guides to building a brand on Threads for shop owners and marketers.',
    footerTagline: 'RealUsers, the Conversation Marketing platform for Threads.',
    footer: {
      product: 'Product',
      resources: 'Resources',
      account: 'Account',
      how: 'How it works',
      features: 'Features',
      pricing: 'Pricing',
      faq: 'FAQ',
      signup: 'Sign up',
    },
    legal: 'RealUsers is not affiliated with Meta. Threads and Facebook are trademarks of Meta Platforms, Inc.',
    language: 'Language',
  },
}

export const t = (locale: Locale) => DICT[locale]
