#!/usr/bin/env node
// npm run blog:push -- <đường dẫn bài> [--publish | --schedule 2026-11-25T08:00:00+07:00] [--url https://www.realusers.net]
//
// Đẩy một bài viết sẵn bằng file lên blog qua MCP (/api/mcp), không cần mở trang quản trị.
// Một bài = hai file cạnh nhau: <tên>.vi.md (bắt buộc) và <tên>.en.md (tuỳ chọn, bản tiếng Anh).
// Mỗi file mở đầu bằng khối "---json { ... } ---" (title, slug, excerpt, category, faq, metaTitle,
// metaDescription, coverImageId…), phần còn lại là thân bài markdown.
// File .vi.md có thể kèm "categoryDef": { name, slug, nameEn, slugEn, description, descriptionEn }
// để tạo chuyên mục nếu chưa có.
//
// Bài đã có (trùng slug tiếng Việt) thì sửa, không tạo trùng. Không có cờ thì chỉ lưu nháp.
// API key đọc từ biến môi trường BLOG_MCP_KEY (tạo ở /admin → API key cho AI). Mặc định gửi tới
// http://localhost:3100; production thêm --url https://www.realusers.net.
import fs from 'node:fs'
import path from 'node:path'

// Lỗi thì in đúng câu lỗi (vd lỗi từ công cụ MCP), không in cả stack.
for (const ev of ['uncaughtException', 'unhandledRejection']) {
  process.on(ev, (err) => {
    console.error(err instanceof Error ? err.message : String(err))
    process.exit(1)
  })
}

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const file = args.find((a, i) => !a.startsWith('--') && !['--schedule', '--url'].includes(args[i - 1]))
const base = (flag('--url') || process.env.BLOG_URL || 'http://localhost:3100').replace(/\/$/, '')
const key = process.env.BLOG_MCP_KEY
const publish = args.includes('--publish')
const scheduleAt = flag('--schedule')

if (!file || !key || (publish && scheduleAt)) {
  console.error('Dùng: BLOG_MCP_KEY=<key> npm run blog:push -- <bai>.vi.md [--publish | --schedule <ISO+07:00>] [--url <site>]')
  process.exit(1)
}

const stem = file.replace(/\.(vi|en)\.md$/, '').replace(/\.md$/, '')

function readPost(p) {
  if (!fs.existsSync(p)) return null
  const raw = fs.readFileSync(p, 'utf8')
  const m = raw.match(/^---json\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/)
  if (!m) throw new Error(`${p}: thiếu khối ---json ở đầu file`)
  return { ...JSON.parse(m[1]), markdown: m[2].trim() + '\n' }
}

let rpcId = 0
async function call(name, argsObj) {
  const res = await fetch(`${base}/api/mcp`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method: 'tools/call', params: { name, arguments: argsObj } }),
  })
  const body = await res.text()
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status} ${body.slice(0, 300)}`)
  const line = body.split('\n').find((l) => l.startsWith('data: '))
  const msg = JSON.parse(line ? line.slice(6) : body)
  if (msg.error) throw new Error(`${name}: ${msg.error.message}`)
  const text = msg.result?.content?.[0]?.text ?? ''
  if (text.startsWith('Lỗi:')) throw new Error(`${name}: ${text}`)
  return JSON.parse(text)
}

const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]))
const FIELDS = ['title', 'excerpt', 'markdown', 'category', 'author', 'slug', 'faq', 'metaTitle', 'metaDescription', 'coverImageId', 'featured']

const vi = readPost(`${stem}.vi.md`)
const en = readPost(`${stem}.en.md`)
if (!vi) throw new Error(`Không thấy ${stem}.vi.md`)

if (vi.categoryDef) {
  const c = await call('saveCategory', vi.categoryDef)
  console.log(`Chuyên mục ${c.slug}: ${c.created ? 'đã tạo' : 'đã có, cập nhật'}`)
}

let id
try {
  id = (await call('getPost', { slug: vi.slug, locale: 'vi' })).id
} catch {
  id = undefined
}
const viData = pick(vi, FIELDS)
const saved = id ? await call('updatePost', { id, locale: 'vi', ...viData }) : await call('createPost', viData)
id = saved.id
console.log(`#${id} (vi) ${saved.slug}: đã lưu nháp`)

if (en) {
  const e = await call('updatePost', { id, locale: 'en', ...pick(en, FIELDS.filter((k) => k !== 'category')) })
  console.log(`#${id} (en) ${e.slug}: đã lưu nháp`)
}

let result
if (publish) result = await call('updatePost', { id, action: 'publish' })
else if (scheduleAt) result = await call('schedulePost', { id, publishAt: scheduleAt })
else result = await call('getPost', { id })

console.log(
  JSON.stringify(
    { id, status: result.status, url: result.url, scheduled: result.scheduled?.map((s) => s.publishAtVN), adminUrl: result.adminUrl },
    null,
    2,
  ),
)
