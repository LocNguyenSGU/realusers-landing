# www.realusers.net — landing + blog RealUsers

Site công khai của RealUsers: landing ở `/`, blog ở `/blog/`.
Blog có trang quản trị và API riêng, dựng bằng **Next.js 16 + Payload CMS 3**, dữ liệu trong Postgres, ảnh trên Vercel Blob (hoặc Cloudflare R2).

Plan và audit: `hub_docs/plans/2026-11-10-blog-cms-seo.md`.

## Có gì

| Đường dẫn | Là gì |
|---|---|
| `/` | Landing (file tĩnh `public/landing.html`) |
| `/blog/`, `/blog/trang/<n>/` | Danh sách bài: bài nổi bật, tab chuyên mục, lưới thẻ, cột "Bài nên đọc", phân trang |
| `/blog/<slug>/` | Bài viết: breadcrumb, mục lục, FAQ, chia sẻ, khối kêu gọi, tác giả, bài liên quan |
| `/blog/chu-de/<slug>/` | Trang chuyên mục |
| `/en/blog/...` | Bản tiếng Anh của mọi trang blog (xem mục Đa ngôn ngữ) |
| `/blog/tac-gia/<slug>/` | Trang tác giả |
| `/blog/<slug>/og.png` | Ảnh chia sẻ tự vẽ khi bài chưa có ảnh |
| `/blog/rss.xml`, `/sitemap.xml`, `/robots.txt` | RSS, sitemap (lastmod thật), robots |
| `/admin` | Trang quản trị (viết bài, ảnh, chuyên mục, tác giả, chuyển hướng 301, cài đặt blog) |
| `/api/...`, `/api/graphql` | API REST + GraphQL do Payload sinh. Khách chỉ đọc được bài đã đăng |

Vai trò tài khoản quản trị: `admin` (toàn quyền), `editor` (viết + đăng), `writer` (chỉ lưu nháp).
Tài khoản đầu tiên tạo ở `/admin` tự thành `admin`.

## Đa ngôn ngữ

- Ngôn ngữ đang có: tiếng Việt (mặc định, URL không tiền tố, giữ đúng URL cũ) và tiếng Anh (`/en/blog/...`).
- Đường dẫn tiếng Anh dùng chữ tiếng Anh: `/en/blog/category/<slug>/`, `/en/blog/author/<slug>/`, `/en/blog/page/2/`.
- Dịch bài: mở bài trong `/admin`, chọn **Locale: English** góc trên, nhập tiêu đề, sapo, nội dung, đường dẫn tiếng Anh, bấm Publish.
  Bài chưa dịch thì không hiện ở trang tiếng Anh (không lấy chữ tiếng Việt đắp vào).
- Mỗi ngôn ngữ một ảnh đầu bài. Chưa có ảnh thì site tự vẽ ảnh theo tiêu đề đúng ngôn ngữ.
- Trang có bản dịch thì khai `hreflang` hai chiều (và trong sitemap); nút VI/EN trên đầu trang nhảy đúng sang bản dịch.
- Gọi API ghi dữ liệu nên kèm `?locale=vi` hoặc `?locale=en`; không kèm thì hiểu là tiếng Việt.
- Thêm ngôn ngữ mới: xem đầu file `src/i18n/index.ts` (mã ngôn ngữ, bộ chữ, tên đoạn đường dẫn), thêm vào `localization` trong `src/payload.config.ts`, rồi tạo migration.
- Landing (`/`) hiện mới có tiếng Việt.

## SEO đã làm

- Mọi trang render sẵn HTML. Đăng hay sửa bài thì trang tự làm mới trong vài giây, không cần deploy.
- URL luôn có `/` cuối. Thiếu `/` thì chuyển 308. Giữ nguyên URL 3 bài cũ đã được Google index.
- Title, description, canonical, Open Graph `article` (ngày đăng, ngày sửa, chuyên mục, tác giả), Twitter card.
- JSON-LD: `BlogPosting`, `BreadcrumbList`, `FAQPage` (khi bài có FAQ), `CollectionPage`, `ProfilePage`.
- Mỗi trang đúng một H1. Trình soạn thảo không cho chèn H1 vào thân bài.
- Ảnh bắt buộc có alt, tự sinh cỡ WebP + ảnh 1200x630 cho chia sẻ. Font tự host (không gọi Google Fonts).
- Đổi slug bài đã đăng thì tự thêm chuyển hướng 301 từ link cũ.
- Bản nháp, xem trước, trang 404 có `noindex`.

## Chạy ở máy

Cần Node `^22.23.4` hoặc `>=24.22.1` và một Postgres trống.

```bash
cp .env.example .env          # điền DATABASE_URL, PAYLOAD_SECRET, PREVIEW_SECRET
npm install
npm run db:migrate            # tạo bảng
npm run seed:old-posts        # nạp 3 bài cũ (chạy lại an toàn)
npm run dev                   # http://localhost:3100 nếu đặt PORT=3100
```

Mở `/admin` để tạo tài khoản đầu tiên.

## Đổi cấu trúc dữ liệu

Sửa collection trong `src/collections/` rồi:

```bash
npm run generate:types
npm run db:migrate:create -- <ten-thay-doi>   # sinh file trong src/migrations/, commit file này
npm run db:migrate
```

Production chạy `npm run ci` (= `db:migrate` rồi `build`), nên migration đi cùng lần deploy.

## Kiểm thử

```bash
npm run typecheck
npm run test:unit                  # hàm thuần: slug, phút đọc, mục lục, JSON-LD, metadata
npm run test:int                   # Payload + Postgres thật, DB test riêng (TEST_DATABASE_URL)
npm run build && PW_CHANNEL=chrome E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... npm run test:e2e
# kiểm SEO, đa ngôn ngữ, luồng đăng bài trên bản build, desktop + điện thoại 412px
```

`test:e2e` cần DB trong `.env` đã migrate và seed. `PW_CHANNEL=chrome` dùng Chrome có sẵn trên máy.

## Deploy (Vercel)

Việc dựng production (DB, R2, Vercel, đổi tên miền) và cách kiểm: xem `DEPLOY.md`.

Biến môi trường production: xem `.env.example`. Bắt buộc có Vercel Blob (`BLOB_READ_WRITE_TOKEN`) hoặc `R2_*`, vì Vercel không giữ file ghi ra đĩa.
Hẹn giờ đăng bài chạy qua Vercel Cron (`vercel.json`) gọi `/api/payload-jobs/run`, kèm `CRON_SECRET`.
