// Vẽ ảnh minh hoạ cho bài blog: vài khung điện thoại với bảng tin kiểu mạng xã hội chữ.
// Tài khoản, tên shop, số liệu trong ảnh đều là ví dụ minh hoạ, không phải dữ liệu thật.
// Chạy: node scripts/illustrations/render.mjs  -> ghi PNG vào seed/illustrations/
// Cần Chrome có sẵn trên máy (Playwright channel "chrome").
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

import { SCENES } from './scenes.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const outDir = path.join(root, 'seed/illustrations')
// Font nhúng base64: trang dựng bằng setContent (about:blank) không đọc được file:// .
const fontBold = fs.readFileSync(path.join(root, 'src/assets/fonts/BeVietnamPro-Bold.ttf')).toString('base64')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const ICON = {
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  reply: '<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z"/>',
  repost: '<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>',
  send: '<path d="M21 3L10 14"/><path d="M21 3l-7 18-4-7-7-4 18-7z"/>',
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
}
const icon = (name, size = 18) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[name]}</svg>`

function avatar(a, size = 34) {
  return `<span class="av" style="width:${size}px;height:${size}px;background:${a.color};font-size:${Math.round(size * 0.42)}px">${esc(a.initials)}</span>`
}

function post(p) {
  const counts = p.counts || {}
  const actions = ['heart', 'reply', 'repost', 'send']
    .map((k) => `<span class="act">${icon(k, 17)}${counts[k] ? `<b>${esc(counts[k])}</b>` : ''}</span>`)
    .join('')
  return `<div class="post ${p.reply ? 'is-reply' : ''} ${p.mark ? 'mark' : ''}">
    <div class="pl">${avatar(p.author)}${p.thread ? '<span class="line"></span>' : ''}</div>
    <div class="pr">
      <div class="ph"><b>${esc(p.author.handle)}</b>${p.author.brand ? '<span class="tick">✓</span>' : ''}<span class="time">${esc(p.time || '')}</span><span class="more">${icon('more', 16)}</span></div>
      <div class="txt">${esc(p.text).replace(/\n/g, '<br>')}</div>
      ${p.counts !== null ? `<div class="acts">${actions}</div>` : ''}
    </div>
  </div>`
}

function profile(pr) {
  return `<div class="profile">
    <div class="prow"><div><div class="pname">${esc(pr.name)}</div><div class="phandle">${esc(pr.handle)}</div></div>${avatar(pr.author, 62)}</div>
    <div class="pbio">${esc(pr.bio).replace(/\n/g, '<br>')}</div>
    <div class="plink">${esc(pr.link)}</div>
    <div class="pfol">${esc(pr.followers)}</div>
    <div class="pbtns"><span class="b1">${esc(pr.follow)}</span><span class="b2">${esc(pr.mention)}</span></div>
    <div class="ptabs">${pr.tabs.map((t, i) => `<span class="${i === 0 ? 'on' : ''}">${esc(t)}</span>`).join('')}</div>
  </div>`
}

function phone(ph) {
  const top = ph.back
    ? `<div class="top">${icon('back', 20)}<span class="toptitle">${esc(ph.title || '')}</span><span></span></div>`
    : `<div class="top"><span class="logo">${esc(ph.title || '')}</span></div>`
  const body = [ph.profile ? profile(ph.profile) : '', ...(ph.posts || []).map(post)].join('')
  return `<div class="phone ${ph.tilt || ''}">
    ${ph.label ? `<div class="label ${ph.labelTone || ''}">${esc(ph.label)}</div>` : ''}
    <div class="screen">
      <div class="status"><b>9:41</b><span class="dots"><i></i><i></i><i></i></span></div>
      ${top}
      <div class="feed">${body}</div>
      <div class="nav">${['home', 'search', 'plus', 'heart', 'user'].map((k) => `<span class="${k === 'plus' ? 'plus' : ''}">${icon(k, 22)}</span>`).join('')}</div>
    </div>
    ${ph.callout ? `<div class="callout" style="${ph.callout.style || ''}">${ph.callout.title ? `<b>${esc(ph.callout.title)}</b>` : ''}<span>${esc(ph.callout.text)}</span></div>` : ''}
  </div>`
}

// Khổ ảnh vừa đủ ôm số điện thoại, để khi bài hiện ở bề ngang ~720px chữ vẫn đọc được.
const PW = 360
const GAP = 40
const H = 860
const W = (scene) => scene.phones.length * PW + (scene.phones.length - 1) * GAP + 120

function page(scene) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:BVP;src:url(data:font/ttf;base64,${fontBold}) format("truetype");font-weight:700}
*{box-sizing:border-box;margin:0;padding:0}
body{width:${W(scene)}px;height:${H}px;background:${scene.bg || '#0b0d12'};font-family:-apple-system,"SF Pro Text","Helvetica Neue",Arial,sans-serif;color:#111;display:flex;align-items:center;justify-content:center;gap:${GAP}px;overflow:hidden}
.phone{position:relative;width:${PW}px;height:700px;border-radius:52px;background:#fff;padding:12px;box-shadow:0 0 0 2px #2a2e37,0 40px 80px -20px rgba(0,0,0,.6)}
.phone.up{transform:translateY(-14px)}.phone.down{transform:translateY(14px)}
.screen{width:100%;height:100%;border-radius:41px;overflow:hidden;background:#fff;display:flex;flex-direction:column}
.status{display:flex;justify-content:space-between;align-items:center;padding:14px 28px 6px;font-size:15px}
.dots{display:flex;gap:4px}.dots i{width:16px;height:10px;border-radius:3px;background:#111;display:block}
.top{display:flex;align-items:center;justify-content:space-between;padding:8px 18px 10px;min-height:44px;border-bottom:1px solid #eee}
.top .logo{font-family:BVP;font-size:17px;margin:0 auto}.toptitle{font-family:BVP;font-size:16px}
.feed{flex:1;overflow:hidden}
.post{display:flex;gap:10px;padding:14px 16px 12px;border-bottom:1px solid #f0f0f0}
.post.is-reply{padding-left:30px;background:#fafafa}
.post.mark{background:#eef4ff;box-shadow:inset 3px 0 0 #0866ff}
.pl{display:flex;flex-direction:column;align-items:center}.line{flex:1;width:2px;background:#e3e3e3;margin-top:6px}
.av{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;color:#fff;font-family:BVP;flex:none}
.pr{flex:1;min-width:0}
.ph{display:flex;align-items:center;gap:5px;font-size:15.5px}.tick{color:#0866ff;font-size:12px}
.time{color:#999;font-size:14px}.more{margin-left:auto;color:#999;display:flex}
.txt{margin-top:3px;font-size:16.5px;line-height:1.36;color:#111}
.acts{display:flex;gap:18px;margin-top:10px;color:#444}.act{display:flex;align-items:center;gap:4px;font-size:13px}.act b{font-weight:500}
.nav{display:flex;justify-content:space-around;align-items:center;padding:12px 10px 22px;border-top:1px solid #eee;color:#999}
.nav .plus{background:#f1f1f1;border-radius:10px;padding:5px 14px;color:#666}
.profile{padding:14px 18px 0}
.prow{display:flex;justify-content:space-between;align-items:center}
.pname{font-family:BVP;font-size:22px}.phandle{font-size:14.5px;color:#333;margin-top:2px}
.pbio{margin-top:12px;font-size:14.5px;line-height:1.4}.plink{margin-top:6px;font-size:14px;color:#0866ff}
.pfol{margin-top:10px;font-size:14px;color:#999}
.pbtns{display:flex;gap:8px;margin-top:14px}.pbtns span{flex:1;text-align:center;border-radius:10px;padding:8px 0;font-size:14.5px;font-weight:600}
.b1{background:#111;color:#fff}.b2{border:1px solid #ddd}
.ptabs{display:flex;margin-top:14px;border-bottom:1px solid #eee}.ptabs span{flex:1;text-align:center;padding:10px 0;font-size:14.5px;color:#999}
.ptabs span.on{color:#111;font-weight:600;box-shadow:inset 0 -2px 0 #111}
.label{position:absolute;top:-44px;left:50%;transform:translateX(-50%);white-space:nowrap;font-family:BVP;font-size:20px;color:#fff;letter-spacing:.01em}
.label.bad{color:#ff8a80}.label.good{color:#7cc4ff}
.callout{position:absolute;z-index:3;left:50%;transform:translateX(-50%);bottom:96px;width:300px;background:#fff;border-radius:18px;padding:14px 18px;box-shadow:0 18px 40px -10px rgba(0,0,0,.35),0 0 0 1px #e8e8e8;display:flex;flex-direction:column;gap:3px}
.callout b{font-family:BVP;font-size:17px}.callout span{font-size:15px;color:#555;line-height:1.35}
</style></head><body>${scene.phones.map(phone).join('')}</body></html>`
}

fs.mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
const only = process.argv[2]
for (const scene of SCENES) {
  if (only && !scene.file.includes(only)) continue
  const p = await browser.newPage({ viewport: { width: W(scene), height: H }, deviceScaleFactor: 2 })
  await p.setContent(page(scene), { waitUntil: 'load' })
  await p.evaluate(() => document.fonts.ready)
  await p.screenshot({ path: path.join(outDir, scene.file) })
  await p.close()
  console.log('ve', scene.file)
}
await browser.close()
