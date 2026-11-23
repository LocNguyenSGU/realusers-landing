import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Dữ liệu: link "đăng ký" đã lưu trong DB (khối kêu gọi của Cài đặt blog, khối Cta trong thân bài, cả bản nháp)
// đổi từ https://app.realusers.net/dang-ky sang trang gốc của app. Trang gốc tự chuyển người chưa đăng nhập
// tới trang đăng nhập, người đã đăng nhập vào thẳng app. Không đổi cấu trúc bảng.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "blog_settings_locales" SET "cta_url" = 'https://app.realusers.net/'
      WHERE "cta_url" = 'https://app.realusers.net/dang-ky';
    UPDATE "posts_locales"
      SET "content" = replace("content"::text, 'https://app.realusers.net/dang-ky', 'https://app.realusers.net/')::jsonb
      WHERE "content"::text LIKE '%https://app.realusers.net/dang-ky%';
    UPDATE "_posts_v_locales"
      SET "version_content" = replace("version_content"::text, 'https://app.realusers.net/dang-ky', 'https://app.realusers.net/')::jsonb
      WHERE "version_content"::text LIKE '%https://app.realusers.net/dang-ky%';
  `)
}

// Không đảo lại: sau migration không còn phân biệt được link nào vốn là /dang-ky.
export async function down(_args: MigrateDownArgs): Promise<void> {}
