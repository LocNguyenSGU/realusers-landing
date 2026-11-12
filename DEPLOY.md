# Deploy www.realusers.net (landing + blog) — việc bàn giao

Viết cho người (và AI) sẽ dựng hạ tầng production. Code đã xong, phần còn lại là tài khoản, DB, ảnh và tên miền.
Người viết code (anh Lộc) không có quyền Cloudflare, tên miền hay project Vercel đang chạy www.realusers.net.

## Tình trạng hiện tại

- **www.realusers.net đang chạy trên một project Vercel cũ**: file tĩnh từ thư mục `app/landing/` của repo `kietsocola/thread-secret`
  (commit `207cffb`, 19/10/2026). realusers.net (không www) chuyển 30x sang www.
- **DNS của realusers.net nằm ở Cloudflare** (nameserver `nora` / `kareem.ns.cloudflare.com`).
- **app.realusers.net là app thread-secret trên VPS. Không đụng tới.** Site này tách hẳn, không dùng chung DB hay tài khoản.
- **Repo này** (`LocNguyenSGU/realusers-landing`, nhánh `feat/blog-payload-cms`, PR #1) thay thế project cũ:
  landing ở `/` (file `public/landing.html`), blog ở `/blog/`, bản tiếng Anh ở `/en/blog/`, trang quản trị ở `/admin`.
  Stack: Next.js 16 + Payload CMS 3.92 + Postgres. Cách chạy ở máy, test, đổi schema: xem `README.md`.

## Cần dựng

| # | Việc | Ghi chú |
|---|---|---|
| 1 | **Postgres mới, trống** | Chỉ cho blog. Gợi ý: Neon (Vercel Marketplace) hoặc Supabase. Dùng chuỗi kết nối có pooling nếu chạy serverless. Không cần tạo bảng tay: deploy tự chạy migration. |
| 2 | **Cloudflare R2 bucket** cho ảnh blog | Bật truy cập công khai qua custom domain, ví dụ `media.realusers.net`. Tạo API token R2 quyền Object Read & Write cho đúng bucket đó. Ảnh lưu dưới tiền tố `blog/`. |
| 3 | **Project Vercel mới** import repo này | Framework Next.js, Node 24 (`.nvmrc`). `vercel.json` đã đặt build command `npm run ci` (= `db:migrate` rồi `next build`), nên DB phải gọi được lúc build. |
| 4 | **Biến môi trường** (Production + Preview) | Bảng dưới. |
| 5 | Deploy lên domain tạm `*.vercel.app`, kiểm thử | Mục "Kiểm sau deploy". |
| 6 | **Nạp 3 bài blog cũ** | Chạy một lần từ máy có repo: `DATABASE_URL=... R2_...=... npm run seed:old-posts`. Lệnh chạy lại an toàn (bài đã có thì bỏ qua). Ảnh lấy từ `public/anh/` và đẩy lên R2. |
| 7 | **Tạo tài khoản admin** | Mở `/admin` lần đầu, tài khoản tạo đầu tiên tự là `admin`. Gửi anh Lộc. Sau đó tạo tài khoản `editor` cho MKT. |
| 8 | **Chuyển www.realusers.net sang project mới** | Gỡ domain khỏi project cũ, gắn vào project mới. Giữ project cũ ~1 tuần để quay lại nếu lỗi. |
| 9 | Search Console: nộp lại `https://www.realusers.net/sitemap.xml` | Không bắt buộc ngay. |

## Biến môi trường

Mẫu đầy đủ ở `.env.example`.

| Biến | Giá trị |
|---|---|
| `DATABASE_URL` | Chuỗi Postgres ở bước 1 |
| `PAYLOAD_SECRET` | `openssl rand -hex 32` |
| `NEXT_PUBLIC_SERVER_URL` | `https://www.realusers.net` (lúc thử trên domain tạm thì để URL `*.vercel.app`, đổi lại khi gắn domain rồi deploy lại — biến này vào canonical, sitemap, og:url) |
| `PREVIEW_SECRET` | `openssl rand -hex 16` |
| `CRON_SECRET` | `openssl rand -hex 16`. Vercel Cron tự gửi `Authorization: Bearer <CRON_SECRET>` tới `/api/payload-jobs/run` (lịch 1 lần/ngày trong `vercel.json`, dùng cho hẹn giờ đăng bài) |
| `R2_ACCOUNT_ID` | Account ID Cloudflare |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Token R2 ở bước 2 |
| `R2_BUCKET` | Tên bucket |
| `R2_PUBLIC_BASE_URL` | Link công khai của bucket, ví dụ `https://media.realusers.net`, **không có `/` cuối** |

Thiếu `R2_BUCKET` hoặc `R2_ACCOUNT_ID` thì ảnh ghi ra đĩa. Trên Vercel đĩa không giữ lại, ảnh sẽ mất. Nên trên Vercel bắt buộc có R2.

## Kiểm sau deploy

Phải ra 200 (hoặc đúng như ghi):

```bash
BASE=https://<domain>
curl -sI $BASE/ | head -1
curl -sI $BASE/blog/ | head -1
curl -sI $BASE/en/blog/ | head -1
curl -sI $BASE/sitemap.xml | head -1
curl -sI $BASE/robots.txt | head -1
curl -sI $BASE/blog/rss.xml | head -1
curl -sI $BASE/blog | head -1          # 308 sang /blog/
# 3 bài cũ đã được Google index, URL phải giữ y hệt (sau bước 6):
curl -s $BASE/sitemap.xml | grep -o '<loc>[^<]*/blog/[^<]*</loc>'
```

Trong `/admin`: tạo một bài nháp có ảnh, tải ảnh lên, kiểm link ảnh trỏ về `R2_PUBLIC_BASE_URL`. Bấm Publish, trang bài hiện trong vài giây (không cần deploy lại).

## Hướng khác (tuỳ người dựng)

Code không khoá vào Vercel hay R2. Nếu thấy hợp hơn:

- **Chạy trên VPS** (Docker / pm2): `npm ci && npm run ci && npm start`, Node ≥ 24.22.1.
  Khi đó có thể bỏ R2: để trống `R2_*`, ảnh ghi vào thư mục `MEDIA_DIR` (mặc định `./media`), nhớ giữ thư mục này qua các lần deploy và sao lưu.
  Hẹn giờ đăng bài thì thay Vercel Cron bằng cron gọi `curl -H "Authorization: Bearer $CRON_SECRET" https://www.realusers.net/api/payload-jobs/run`.
  Nếu đặt chung VPS với thread-secret thì dùng DB riêng, cổng riêng, không đụng service `threads-bot`.
- **Ảnh trên kho S3 khác** (AWS S3, Backblaze...): `src/payload.config.ts` đang ghép endpoint theo dạng R2 (`https://<account>.r2.cloudflarestorage.com`). Đổi dòng `endpoint` là xong.
- **DB**: bất kỳ Postgres nào. Không dùng chung Postgres prod của thread-secret (chỉ nghe ở 127.0.0.1, và nên tách).

## Việc dọn sau khi chuyển domain (bên thread-secret, không gấp)

- `app/landing/` trong thread-secret thôi dùng. Đừng sửa landing ở đó nữa, sửa `public/landing.html` ở repo này.
- `scripts/build_blog.py` thôi dùng. Bài cũ đã nằm ở `seed/old-posts.json`.
- `/gioi-thieu` trên app thread-secret nên chuyển 301 sang https://www.realusers.net.

Plan gốc và lý do chọn stack: `hub_docs/plans/2026-11-10-blog-cms-seo.md`.
