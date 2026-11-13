# Deploy www.realusers.net (landing + blog)

Site chạy ở **https://www.realusers.net** từ 13/11/2026 (Vercel của anh Lộc). realusers.net chuyển 308 sang www.

## Đang chạy ở đâu

| Thứ | Ở đâu |
|---|---|
| Site (landing `/`, blog `/blog/`, `/en/blog/`, quản trị `/admin`) | https://www.realusers.net (tên tạm cũ https://realusers-landing.vercel.app vẫn vào được, canonical trỏ về www) — Vercel, tài khoản `locnguyensgu`, project `realusers-landing`, server Singapore |
| Code | Repo `LocNguyenSGU/realusers-landing`. Đã nối Git: push `main` là Vercel tự deploy production |
| DB | Neon Postgres `realusers-blog-db` (gói Free, Singapore), cài qua Vercel Marketplace. Vercel tự điền `DATABASE_URL` |
| Ảnh blog | Vercel Blob `realusers-blog-media` (công khai, Singapore). Vercel tự điền `BLOB_READ_WRITE_TOKEN`. Ảnh nằm dưới `blog/` |
| Hẹn giờ đăng bài | Vercel Cron 1 lần/ngày gọi `/api/payload-jobs/run` (`vercel.json`) |
| Bảng trong DB | Tạo bằng migration, tự chạy mỗi lần deploy (`npm run ci` = `db:migrate` rồi `next build`) |

Trên site hiện có:
- 3 bài cũ đã nạp sẵn, giữ đúng URL cũ.
- `SITE_NOINDEX=false` (đặt `true` chỉ khi chạy thử ở domain khác, nó chặn Google index cả site).

## Tên miền

- DNS ở Cloudflare (nameserver `nora` / `kareem.ns.cloudflare.com`), do chị Trần Ngô / Kiệt giữ.
  - `www` CNAME về Vercel, `realusers.net` bản ghi A về Vercel, cả hai để **DNS only** (mây xám).
  - Hai bản ghi TXT `_vercel` để xác minh quyền dùng tên miền với project này. Đừng xoá.
- Cách đã chuyển (13/11): thêm domain vào project qua API → Vercel đòi TXT vì domain đang ở tài khoản khác → thêm TXT → `POST /v9/projects/<id>/domains/<domain>/verify` → đổi `NEXT_PUBLIC_SERVER_URL` sang www, `SITE_NOINDEX=false`, redeploy.
- Project cũ `thread-secret-landing` (team "Tuan Kiet's projects") giữ thêm ~1 tuần để quay lại nếu lỗi.
- **app.realusers.net là app thread-secret trên VPS. Không đụng tới.**
- Còn lại: nộp `https://www.realusers.net/sitemap.xml` ở Google Search Console.

## Kiểm sau deploy

```bash
BASE=https://www.realusers.net   # hoặc https://realusers-landing.vercel.app
for p in / /blog/ /en/blog/ /sitemap.xml /robots.txt /blog/rss.xml \
  /blog/threads-la-gi-thuong-hieu-co-nen-lam/ /blog/cach-tang-tuong-tac-tren-threads/ \
  /blog/cach-viet-bai-threads-de-nguoi-doc-tra-loi/; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' $BASE$p) $p"; done   # đều 200
curl -sI $BASE/blog | head -1          # 308 sang /blog/
curl -s $BASE/robots.txt               # domain thật: có Sitemap và "Allow: /". Domain tạm: "Disallow: /"
curl -sI $BASE/ | grep -i x-robots     # domain thật: không có dòng nào
```

Trong `/admin`: tải một ảnh lên, link ảnh phải là `https://<store>.public.blob.vercel-storage.com/blog/...`. Bấm Publish một bài, vài giây sau trang bài phải hiện, không cần deploy lại.

## Biến môi trường (Production)

| Biến | Nguồn |
|---|---|
| `DATABASE_URL` (+ các `PG*`, `POSTGRES_*`) | Neon tự điền |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob tự điền |
| `PAYLOAD_SECRET`, `PREVIEW_SECRET`, `CRON_SECRET` | Chuỗi ngẫu nhiên (`openssl rand -hex 32`), đặt kiểu Sensitive. Đổi `PAYLOAD_SECRET` thì mọi người phải đăng nhập lại |
| `NEXT_PUBLIC_SERVER_URL` | URL gốc của site, dùng cho canonical, sitemap, og:url |
| `SITE_NOINDEX` | `false`. Chỉ đặt `true` khi chạy thử ở domain khác |

Thay Blob bằng Cloudflare R2: điền `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`. Có R2 thì code ưu tiên R2. Ảnh đã tải lên Blob không tự chuyển sang.

## Việc khác

- **Preview deploy** (push nhánh khác `main`) dùng chung DB với production. Vì vậy nhánh có migration mới sẽ đổi bảng production ngay lúc build preview. Đổi schema thì merge cẩn thận, hoặc tách DB cho Preview trên Vercel.
- **Nạp lại 3 bài cũ** (chạy lại an toàn):
  ```bash
  vercel env pull /tmp/prod.env --environment production
  set -a; . /tmp/prod.env; set +a
  npm run seed:old-posts
  ```
- **Gói Vercel Hobby** theo điều khoản không dành cho site thương mại. Có thể phải lên Pro.

## Dọn bên thread-secret sau khi gắn domain (không gấp)

- `app/landing/` thôi dùng. Sửa landing ở `public/landing.html` của repo này.
- `scripts/build_blog.py` thôi dùng. Bài cũ đã ở `seed/old-posts.json`.
- `/gioi-thieu` trên app nên chuyển 301 sang https://www.realusers.net.

Plan gốc: `hub_docs/plans/2026-11-10-blog-cms-seo.md`.
