# Layouts

## Utility bar + sticky header — `index.html:330-352` (CSS `index.html:93-106`)
```css
/* Header */
.util{background:var(--panel);font-size:13px;color:var(--fg-2)}
.util .wrap{display:flex;justify-content:space-between;align-items:center;height:44px;gap:16px}
.util nav{display:flex;gap:24px}
.util a{text-decoration:none;display:inline-flex;align-items:center;gap:6px}
.util a:hover{color:var(--accent)}
header.main{position:sticky;top:env(safe-area-inset-top,0px);z-index:20;background:var(--bg);box-shadow:0 8px 24px -16px rgba(54,57,90,.25)}
header.main .wrap{display:flex;align-items:center;gap:32px;height:72px}
.logo{display:flex;align-items:center;gap:8px;text-decoration:none;font:700 19px/1 var(--display);letter-spacing:-0.02em}
.logo b{color:var(--accent);font-weight:700}
.mainnav{display:flex;gap:26px;font-size:16px}
.mainnav a{text-decoration:none}
.mainnav a:hover{color:var(--accent)}
.hdr-cta{margin-left:auto;display:flex;gap:12px}
```
```html
<div class="util">
  <div class="wrap">
    <nav aria-label="Tiện ích"><a href="#cau-hoi">Câu hỏi thường gặp</a></nav>
    <nav aria-label="Tài khoản"><a href="#dang-ky"><svg width="14" height="14"><use href="#i-users"/></svg>Đăng nhập</a><a href="#cach-hoat-dong">Về ThreadFlow</a></nav>
  </div>
</div>

<header class="main">
  <div class="wrap">
    <a class="logo" href="#top" aria-label="ThreadFlow, về đầu trang"><svg width="30" height="30"><use href="#i-logo"/></svg><span><b>THREAD</b>FLOW</span></a>
    <nav class="mainnav" aria-label="Chính">
      <a href="#nen-tang">Nền tảng</a>
      <a href="#theo-nganh">Theo ngành</a>
      <a href="#cach-hoat-dong">Cách hoạt động</a>
      <a href="#quy-mo">Theo quy mô</a>
      <a href="#an-toan">An toàn</a>
    </nav>
    <div class="hdr-cta">
      <a class="btn btn-outline btn-sm" href="#dang-ky">Đặt lịch tư vấn</a>
      <a class="btn btn-dark btn-sm" href="#dang-ky">Đăng ký ngay</a>
    </div>
  </div>
</header>
```

## Section/panel wrapper — `index.html:75-77`
```css
.wrap{max-width:var(--max);margin-inline:auto;padding-inline:clamp(16px,4.5vw,60px)}
.panel{background:var(--panel);border-radius:var(--r-panel);margin-inline:clamp(0px,1.4vw,20px)}
section{padding-block:clamp(56px,7vw,96px)}
```

## Footer — `index.html:619-633` (CSS `index.html:259-267`)
```css
/* Footer */
footer{background:var(--footer);color:var(--footer-fg);margin-top:20px;padding-block:64px 36px}
footer .logo{color:#fff}
.fcols{display:grid;grid-template-columns:1.4fr repeat(4,1fr);gap:32px}
.fcols h4{font:600 15px/1.3 var(--display);margin:0 0 16px}
.fcols ul{list-style:none;margin:0;padding:0;display:grid;gap:10px;font-size:14px;color:var(--footer-muted)}
.fcols a{text-decoration:none}.fcols a:hover{color:#fff}
.fcols p{color:var(--footer-muted);font-size:14px;margin-top:16px;max-width:30ch}
.legal{margin-top:48px;padding-top:24px;border-top:1px solid rgba(255,255,255,.1);display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;font-size:13px;color:var(--footer-muted)}
```
```html
<footer>
  <div class="wrap">
    <div class="fcols">
      <div>
        <a class="logo" href="#top"><svg width="30" height="30" style="color:#fff"><use href="#i-logo"/></svg><span><b>THREAD</b>FLOW</span></a>
        <p>Dịch vụ đăng bài và tương tác Threads cho thương hiệu, có kiểm duyệt và báo cáo theo kỳ.</p>
      </div>
      <div><h4>Nền tảng</h4><ul><li><a href="#cach-hoat-dong">Lô nội dung theo kỳ</a></li><li><a href="#an-toan">AI gate</a></li><li><a href="#cach-hoat-dong">Checklist trước khi đăng</a></li><li><a href="#nen-tang">Lịch và cam kết</a></li><li><a href="#quy-mo">Báo cáo kỳ</a></li></ul></div>
      <div><h4>Dành cho</h4><ul><li><a href="#quy-mo">Shop một thương hiệu</a></li><li><a href="#quy-mo">Thương hiệu mở rộng</a></li><li><a href="#quy-mo">Agency</a></li><li><a href="#theo-nganh">Theo ngành</a></li></ul></div>
      <div><h4>Hỗ trợ</h4><ul><li><a href="#dang-ky">Đăng nhập</a></li><li><a href="#dang-ky">Đăng ký</a></li><li><a href="#cau-hoi">Câu hỏi thường gặp</a></li></ul></div>
      <div><h4>Pháp lý</h4><ul><li><a href="#top">Điều khoản sử dụng</a></li><li><a href="#top">Chính sách dữ liệu</a></li><li><a href="#an-toan">Chính sách nội dung</a></li></ul></div>
    </div>
    <div class="legal"><span>© 2026 ThreadFlow</span><span>ThreadFlow không liên kết với Meta. Threads là nhãn hiệu của Meta Platforms, Inc.</span></div>
  </div>
</footer>
```
