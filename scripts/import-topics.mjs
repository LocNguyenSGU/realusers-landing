#!/usr/bin/env node
// npm run topics:import -- <ke-hoach.csv> --start 2026-11-25 [--every 1] [--dry-run] [--url https://www.realusers.net]
//
// Nạp kế hoạch nội dung (file CSV dạng hub_docs plans/2026-11-19-ke-hoach-seo-seeding-song-ngu/ke-hoach-song-ngu.csv)
// vào mục "Chủ đề chờ viết" của blog qua MCP (/api/mcp), để MKT xem/sửa ở /admin và AI lấy ra viết.
// - Chỉ lấy dòng có "Kết luận" là Giữ / Sửa / Thêm và "Trạng thái" là "Chưa làm".
// - Xếp "Ngày muốn đăng" lần lượt từ --start, cách nhau --every ngày (mặc định 1 ngày 1 bài), theo thứ tự trong file.
// - Chạy lại an toàn: chủ đề trùng từ khoá chính (không phân biệt hoa thường) thì bỏ qua.
// API key đọc từ BLOG_MCP_KEY.
import fs from 'node:fs'

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
const file = args.find((a, i) => !a.startsWith('--') && !['--start', '--every', '--url'].includes(args[i - 1]))
const start = flag('--start')
const every = Number(flag('--every') ?? 1)
const dryRun = args.includes('--dry-run')
const base = (flag('--url') || process.env.BLOG_URL || 'http://localhost:3100').replace(/\/$/, '')
const key = process.env.BLOG_MCP_KEY

if (!file || !/^\d{4}-\d{2}-\d{2}$/.test(start ?? '') || !(every >= 1) || (!key && !dryRun)) {
  console.error('Dùng: BLOG_MCP_KEY=<key> npm run topics:import -- <ke-hoach.csv> --start YYYY-MM-DD [--every 1] [--dry-run] [--url <site>]')
  process.exit(1)
}

/** CSV theo RFC 4180 (ngoặc kép, xuống dòng trong ô). */
export function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  const src = text.replace(/^﻿/, '')
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"'
        i++
      } else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(cell)
      cell = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += c
  }
  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }
  const [head, ...body] = rows.filter((r) => r.some((x) => x.trim()))
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])))
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

const slugify = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const addDays = (ymd, n) => {
  const d = new Date(`${ymd}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const rows = parseCsv(fs.readFileSync(file, 'utf8')).filter(
  (r) => ['Giữ', 'Sửa', 'Thêm'].includes(r['Kết luận']) && r['Trạng thái'] === 'Chưa làm' && r['Primary keyword VI'],
)

let categories = []
let existing = new Set()
if (!dryRun) {
  const overview = await call('blogOverview', {})
  categories = overview.categories.map((c) => ({ slug: c.slug, name: (c.name || '').toLowerCase() }))
  const all = await call('listTopics', { status: 'all', limit: 200 })
  existing = new Set(all.topics.map((t) => t.keyword.toLowerCase()))
}

let created = 0
let skipped = 0
for (const [i, r] of rows.entries()) {
  const keyword = r['Primary keyword VI']
  const publishOn = addDays(start, i * every)
  if (existing.has(keyword.toLowerCase())) {
    skipped++
    console.log(`bỏ qua (đã có): ${keyword}`)
    continue
  }
  const catName = r['Chuyên mục']
  const cat = catName && categories.find((c) => c.name === catName.toLowerCase() || c.slug === slugify(catName))
  const notes = [
    r['Loại'] && `Loại bài: ${r['Loại']}`,
    r['Lý do / cần sửa'] && `Lưu ý từ kế hoạch: ${r['Lý do / cần sửa']}`,
    catName && !cat && `Chuyên mục đề xuất (chưa có trên blog, tạo bằng saveCategory): ${catName}`,
    r['URL VI'] && `Đường dẫn gợi ý: ${r['URL VI']}${r['URL EN'] ? ` · EN: ${r['URL EN']}` : ''}`,
    // Nút đăng ký trỏ trang gốc app từ 23/11 (PR #11), kế hoạch cũ còn ghi /dang-ky.
    r['CTA'] && `Kêu gọi: ${r['CTA'].replace('app.realusers.net/dang-ky', 'app.realusers.net/')}`,
    r['Ghi chú bản EN'] && `Bản tiếng Anh: ${r['Ghi chú bản EN']}`,
    r['Repurpose lên Threads'] && `Đăng lại lên Threads: ${r['Repurpose lên Threads']}`,
    `Nguồn: kế hoạch SEO seeding 19/11, dòng ${r['STT gốc']}`,
  ]
    .filter(Boolean)
    .join('\n')
  const topic = {
    keyword,
    title: r['Tiêu đề VI'] || undefined,
    supportingKeywords: r['Supporting keywords VI'] || undefined,
    notes,
    keywordEn: r['Primary keyword EN (chưa xác minh volume)'] || undefined,
    titleEn: r['Tiêu đề EN'] || undefined,
    publishOn,
    ...(cat ? { category: cat.slug } : {}),
  }
  if (dryRun) {
    console.log(`${publishOn}  ${keyword}  ${cat ? `[${cat.slug}]` : catName ? `[chưa có: ${catName}]` : ''}`)
    continue
  }
  const saved = await call('saveTopic', topic)
  created++
  console.log(`#${saved.id} ${saved.publishOn}  ${keyword}`)
}
console.log(dryRun ? `Thử: ${rows.length} chủ đề` : `Đã thêm ${created}, bỏ qua ${skipped} (đã có)`)
