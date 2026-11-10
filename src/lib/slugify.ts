/**
 * Chuyển chữ tiếng Việt thành slug URL: bỏ dấu, `đ` → `d`, chữ thường, nối bằng `-`.
 * "Đăng bài Threads thế nào?" → "dang-bai-threads-the-nao"
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
