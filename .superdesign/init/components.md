# Components

Static single-file site: no framework, no component library, vanilla CSS in one <style> block of `index.html`. Primitives are CSS classes.

## Buttons, link-arrow, badge — `index.html:79-91`
```css
/* Buttons + badge */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font:500 17px/1 var(--body);padding:19px 40px;border-radius:var(--r-btn);text-decoration:none;border:2px solid transparent;transition:background .15s,color .15s,border-color .15s;cursor:pointer;white-space:nowrap}
.btn-dark{background:var(--btn);color:var(--btn-fg)}
.btn-dark:hover{background:var(--accent);color:#fff}
.btn-outline{border-color:var(--fg);color:var(--fg);background:transparent}
.btn-outline:hover{border-color:var(--accent);color:var(--accent)}
.btn-sm{padding:12px 22px;font-size:16px}
.link-arrow{font:500 17px/1.3 var(--body);text-decoration:none;display:inline-flex;gap:6px;align-items:center}
.link-arrow:hover{color:var(--accent)}
.badge{display:inline-block;border:1px solid var(--accent);background:var(--accent-soft);color:var(--accent);border-radius:999px;padding:5px 16px;font-size:15px;line-height:1.3}
.center{text-align:center}
.lead{color:var(--fg-2);font-size:17px;max-width:62ch}
.center .lead{margin-inline:auto}
```

## Icon sprite (inline SVG symbols) — `index.html:310-328`
```html
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <symbol id="i-pen" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></symbol>
    <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-check" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 12l3 3 5-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-chart" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 15v-3M12 15V9M15 15v-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></symbol>
    <symbol id="i-store" viewBox="0 0 24 24"><path d="M4 9l1.5-5h13L20 9M4 9h16M4 9c0 1.7 1.3 3 3 3s2.7-1.3 2.7-3c0 1.7 1.2 3 2.3 3s2.3-1.3 2.3-3c0 1.7 1.3 3 2.7 3s3-1.3 3-3M5.5 12v8h13v-8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></symbol>
    <symbol id="i-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 19c.6-3 2.8-5 5.5-5s4.9 2 5.5 5M15.5 5.2a3.2 3.2 0 010 5.8M17.5 14.3c1.6.7 2.7 2.4 3 4.7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></symbol>
    <symbol id="i-cal" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4 10h16M9 3v4M15 3v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></symbol>
    <symbol id="i-img" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="9.5" cy="10" r="1.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 17l4.5-4 3.5 3 2.5-2L20 17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></symbol>
    <symbol id="i-qr" viewBox="0 0 24 24"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M14 14h2v2h-2zM18 14h2v2h-2zM16 16h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" fill="currentColor"/></symbol>
    <symbol id="i-gauge" viewBox="0 0 24 24"><path d="M4.5 16a8 8 0 1115 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M12 15l4-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="15" r="1.4" fill="currentColor"/></symbol>
    <symbol id="i-lock" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 10V7.5a4 4 0 018 0V10" fill="none" stroke="currentColor" stroke-width="1.6"/></symbol>
    <symbol id="i-stop" viewBox="0 0 24 24"><path d="M8.5 3.5h7l5 5v7l-5 5h-7l-5-5v-7z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 12h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></symbol>
    <symbol id="i-x" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></symbol>
    <symbol id="i-chat" viewBox="0 0 24 24"><path d="M5 5h14a1 1 0 011 1v9a1 1 0 01-1 1h-8l-4 3v-3H5a1 1 0 01-1-1V6a1 1 0 011-1z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></symbol>
    <symbol id="i-logo" viewBox="0 0 32 32"><circle cx="16" cy="16" r="11.5" fill="none" stroke="currentColor" stroke-width="5"/><path d="M16 4.5A11.5 11.5 0 0127.5 16" fill="none" stroke="#ff473d" stroke-width="5" stroke-linecap="round"/></symbol>
  </defs>
</svg>
```

## Cards (feature, safety, tiles, steps) — `index.html:164-196,230-240`
```css
/* Industries (logo cards slot) */
.ind .wrap{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.6fr);gap:40px;align-items:center}
.ind h2{font-size:clamp(28px,3vw,38px);line-height:1.25}
.ind .lead{margin-top:16px;font-size:16px}
.ind .link-arrow{margin-top:22px}
.tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.tile{background:var(--card);border:1px solid var(--line);border-radius:var(--r-btn);padding:22px 20px;min-height:108px;display:flex;flex-direction:column;justify-content:center;gap:8px}
.tile b{font:700 24px/1.15 var(--display);letter-spacing:-0.02em}
.tile code{font:12px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--muted)}
.tile.dash{grid-column:span 2;border-style:dashed;background:transparent}
.tile.dash b{font-size:18px}
.tile.dash span{color:var(--fg-2);font-size:14px}

/* How it works */
.how h2{font-size:clamp(30px,3.6vw,48px);line-height:1.2;margin-top:22px}
.how .btn{margin-top:36px}
.steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin-top:56px;text-align:left}
.step{position:relative;padding:0 48px 0 0}
.step + .step{padding-left:52px}
.step + .step::before{content:"";position:absolute;left:0;top:0;bottom:0;width:44px;
  background:linear-gradient(to bottom right,transparent calc(50% - 1px),var(--line) 50%,transparent calc(50% + 1px)) top/100% 50% no-repeat,
             linear-gradient(to top right,transparent calc(50% - 1px),var(--line) 50%,transparent calc(50% + 1px)) bottom/100% 50% no-repeat;transform:translateX(-36px)}
.ic{width:48px;height:48px;border-radius:8px;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center}
.ic svg{width:24px;height:24px}
.step h3,.fcard h3{font:500 22px/1.3 var(--body);margin-top:30px;letter-spacing:0}
.step p,.fcard p{color:var(--fg-2);margin-top:14px;font-size:16px}

/* Feature cards */
.feat h2,.safe h2{font-size:clamp(30px,3.6vw,48px);line-height:1.2}
.feat .lead{margin-top:22px}
.fgrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:52px}
.fcard{background:var(--card);border:1px solid var(--line);border-radius:var(--r-card);padding:24px 24px 28px;min-width:0}
.fcard h3{margin-top:24px}
/* Safety */
.sgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:48px}
.scard{background:var(--card);border:1px solid var(--line);border-radius:var(--r-card);padding:24px}
.scard h3{font:400 21px/1.3 var(--body);margin-top:30px;letter-spacing:0}
.scard p{margin-top:12px;color:var(--fg-2);font-size:15px}
.nots{margin-top:16px;background:var(--card);border:1px solid var(--line);border-radius:var(--r-card);padding:28px;display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,2fr);gap:32px}
.nots h3{font:600 22px/1.3 var(--display)}
.nots > div > p{margin-top:10px;color:var(--fg-2);font-size:15px}
.nots ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:14px 28px}
.nots li{display:flex;gap:12px;font-size:15.5px;color:var(--fg-2)}
.nots li svg{flex:none;width:20px;height:20px;color:var(--accent);margin-top:2px}
```

## Tabs + report card — `index.html:198-228`
```css
/* Tabs */
.cases h2{font-size:clamp(30px,3.6vw,48px);line-height:1.2;margin-top:22px}
.cases .lead{margin-top:22px}
.tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:44px}
.tab{font:400 18px/1.3 var(--body);padding:18px 16px;border:1px solid var(--line);border-radius:var(--r-btn);background:var(--card);color:var(--fg);cursor:pointer}
.tab:hover{border-color:var(--accent)}
.tab[aria-selected="true"]{border-color:var(--accent);background:var(--accent-soft);color:var(--accent)}
.case{margin-top:32px;border:1px solid var(--line);border-radius:var(--r-panel);padding:24px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:40px;background:var(--card)}
.case-q{display:flex;gap:12px;font-style:italic;font-size:18px;line-height:1.5;padding:4px 0 0 0}
.case-q svg{flex:none;width:16px;height:14px;margin-top:6px;color:var(--accent)}
.case-who{margin-top:20px;font-size:17px}
.case-who small{display:block;color:var(--muted);font-size:15px;margin-top:4px}
.case-nums{display:grid;grid-template-columns:1fr 1fr;margin-top:40px}
.case-nums div{padding-right:24px}
.case-nums div+div{border-left:1px solid var(--line);padding-left:24px}
.case-nums strong{font:600 clamp(28px,3vw,38px)/1.1 var(--display);display:block;letter-spacing:-0.02em}
.case-nums span{display:block;margin-top:14px;color:var(--fg-2);font-size:16px}
.report{background:var(--violet-soft);border-radius:var(--r-card);padding:clamp(18px,3vw,36px);display:flex;align-items:center}
.rcard{background:var(--card);border-radius:14px;padding:22px;width:100%;box-shadow:0 18px 40px -24px rgba(54,57,90,.45)}
.rcard-h{display:flex;justify-content:space-between;gap:12px;align-items:baseline;font-size:13px;color:var(--muted)}
.rcard-h b{color:var(--fg);font:600 15px/1.3 var(--display)}
.bar-row{margin-top:18px;font-size:14px}
.bar-row .lbl{display:flex;justify-content:space-between;font-variant-numeric:tabular-nums}
.bar-row .lbl span:last-child{color:var(--muted)}
.bar{height:6px;border-radius:99px;background:transparent;margin-top:8px;overflow:hidden;display:flex}
.bar i{display:block;height:100%}
.mix-legend{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;font-size:12.5px;color:var(--fg-2)}
.mix-legend span{display:inline-flex;gap:6px;align-items:center}
.mix-legend i{width:9px;height:9px;border-radius:2px;display:inline-block}
.proof{margin-top:18px;border-top:1px solid var(--line-soft);padding-top:14px;font:12.5px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--muted);overflow-wrap:anywhere}
.example-note{font-size:12px;color:var(--muted);margin-top:12px}
```

## FAQ accordion — `index.html:242-250`
```css
/* FAQ */
.faq h2{font-size:clamp(28px,3vw,40px)}
.qa{max-width:880px;margin:40px auto 0;border-top:1px solid var(--line)}
.qa details{border-bottom:1px solid var(--line)}
.qa summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;gap:16px;padding:22px 0;font:500 18px/1.4 var(--body)}
.qa summary::-webkit-details-marker{display:none}
.qa summary::after{content:"+";font:400 26px/1 var(--display);color:var(--accent);transition:transform .2s}
.qa details[open] summary::after{transform:rotate(45deg)}
.qa details p{padding:0 0 22px;color:var(--fg-2);max-width:72ch}
```
