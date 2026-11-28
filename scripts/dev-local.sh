#!/usr/bin/env bash
# npm run dev:local — chạy site ở máy với Postgres riêng (Homebrew), không cần sửa .env.
#
# - Postgres: thư mục dữ liệu ~/.local/share/realusers-blog-pg, cổng 5434 (5433 trên máy anh Lộc là Postgres của Dogo).
#   Lần đầu tự tạo cụm + DB, nạp 3 bài mẫu. Các lần sau chỉ bật lại nếu đang tắt.
# - Ảnh tải lên lưu ở ./media: tắt BLOB_READ_WRITE_TOKEN (trong .env.local là kho ảnh production).
# - Tự chạy migration trước khi mở server.
# Đổi chỗ bằng biến môi trường: PG_BIN, PGDATA_DIR, PGPORT, DB_NAME, PORT.
set -euo pipefail

PG_BIN="${PG_BIN:-/opt/homebrew/opt/postgresql@18/bin}"
PGDATA_DIR="${PGDATA_DIR:-$HOME/.local/share/realusers-blog-pg}"
PGPORT="${PGPORT:-5434}"
DB_NAME="${DB_NAME:-realusers_blog}"
PORT="${PORT:-3100}"

# Payload cần Node ^22.23.4 hoặc >=24.22.1: ưu tiên node của Homebrew.
export PATH="/opt/homebrew/bin:$PATH"

if [ ! -x "$PG_BIN/pg_ctl" ]; then
  echo "Không thấy Postgres ở $PG_BIN. Cài: brew install postgresql@18 (hoặc đặt PG_BIN)." >&2
  exit 1
fi

if [ ! -d "$PGDATA_DIR" ]; then
  echo "→ Tạo cụm Postgres mới ở $PGDATA_DIR"
  mkdir -p "$(dirname "$PGDATA_DIR")"
  "$PG_BIN/initdb" -D "$PGDATA_DIR" -U postgres --auth=trust -E UTF8 >/dev/null
fi

if ! "$PG_BIN/pg_ctl" -D "$PGDATA_DIR" status >/dev/null 2>&1; then
  echo "→ Bật Postgres cổng $PGPORT"
  "$PG_BIN/pg_ctl" -D "$PGDATA_DIR" -o "-p $PGPORT -k /tmp" -l "$PGDATA_DIR/server.log" -w start >/dev/null
fi

export DATABASE_URL="postgres://postgres@127.0.0.1:$PGPORT/$DB_NAME"
export BLOB_READ_WRITE_TOKEN=""
export PORT

fresh=0
if ! "$PG_BIN/psql" -h 127.0.0.1 -p "$PGPORT" -U postgres -tAc "select 1 from pg_database where datname='$DB_NAME'" | grep -q 1; then
  echo "→ Tạo DB $DB_NAME"
  "$PG_BIN/createdb" -h 127.0.0.1 -p "$PGPORT" -U postgres "$DB_NAME"
  fresh=1
fi

npm run --silent db:migrate
if [ "$fresh" = 1 ]; then
  npm run --silent seed:old-posts
  npm run --silent seed:en-posts
fi

echo "→ Site: http://localhost:$PORT  ·  Quản trị: http://localhost:$PORT/admin  ·  MCP: http://localhost:$PORT/api/mcp"
exec npm run dev
