// npm run seed:en-posts — thêm bản tiếng Anh (seed/en-posts.json) và ảnh minh hoạ (seed/illustrations/)
// cho các bài tiếng Việt trong DB đang trỏ tới (DATABASE_URL). Chạy lại an toàn.
// Chạy ngoài Next nên không tự làm mới trang: chạy xong thì deploy lại (hoặc sửa-lưu bài trong /admin).
import fs from 'fs'
import path from 'path'
import config from '@payload-config'
import { getPayload } from 'payload'

import { seedEnPosts, type EnPostsFile } from '@/seed/enPosts'

const root = process.cwd()
const file = JSON.parse(fs.readFileSync(path.join(root, 'seed/en-posts.json'), 'utf8')) as EnPostsFile

const payload = await getPayload({ config })
const res = await seedEnPosts(payload, file, { imagesDir: path.join(root, 'seed/illustrations') })
payload.logger.info(`Đã dịch ${res.translated.length} bài: ${res.translated.join(', ') || '(không)'}`)
payload.logger.info(`Bỏ qua ${res.skipped.length} bài đã có tiếng Anh: ${res.skipped.join(', ') || '(không)'}`)
payload.logger.info(`Ảnh đã chèn: ${res.imagesAdded.join(', ') || '(không)'}`)
if (res.missing.length) payload.logger.warn(`Không thấy bài tiếng Việt: ${res.missing.join(', ')}`)
process.exit(0)
