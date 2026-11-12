// npm run seed:old-posts — nạp 3 bài blog cũ vào DB đang trỏ tới (DATABASE_URL). Chạy lại an toàn.
import fs from 'fs'
import path from 'path'
import config from '@payload-config'
import { getPayload } from 'payload'

import { seedOldPosts, type OldPostsFile } from '@/seed/oldPosts'

const root = process.cwd()
const file = JSON.parse(fs.readFileSync(path.join(root, 'seed/old-posts.json'), 'utf8')) as OldPostsFile

const payload = await getPayload({ config })
const res = await seedOldPosts(payload, file, { imagesDir: path.join(root, 'public/anh') })
payload.logger.info(`Đã tạo ${res.created.length} bài: ${res.created.join(', ') || '(không)'}`)
payload.logger.info(`Bỏ qua ${res.skipped.length} bài đã có: ${res.skipped.join(', ') || '(không)'}`)
process.exit(0)
