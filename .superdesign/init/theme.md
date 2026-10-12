# Theme

## Part 1 — Token summary (current, pre-rebrand)
- Colors (light): bg #ffffff, panel #f6f7ff, panel-2 #edeff7, card #ffffff, fg #121214, fg-2 #3c3d47, muted #6b6e7c, line #d3d4e1, line-soft #e6e7f0, accent #ff473d (coral red), accent-ink #c72c24, accent-soft #ffeded, btn #121214 / btn-fg #fff; secondary green #38d178, violet #806cfe, amber #fca757; footer #1b1c22.
- Dark mode: bg #0e0f13, panel #15161d, card #191b23, fg #f2f3f7, accent #ff5d52 (via prefers-color-scheme and [data-theme="dark"]).
- Fonts: display "Be Vietnam Pro" 400/500/600/700 (Google Fonts); body "Helvetica Neue", Helvetica, Arial, "Be Vietnam Pro".
- Type: h1 clamp(30px,3.3vw,46px)/1.15 700; section h2 clamp(30px,3.6vw,48px)/1.2; body 16px/1.55; lead 17px.
- Radius: panel 20px, card 16px, button 8px, badge 999px.
- Layout: max content 1280px, gutter clamp(16px,4.5vw,60px), section padding clamp(56px,7vw,96px).
- Shadows: header 0 8px 24px -16px rgba(54,57,90,.25); report card 0 18px 40px -24px rgba(54,57,90,.45).
- Breakpoints: 1100px, 860px, 640px.

## Part 2 — Raw source
```css
<style>
/* Layout: RedTrack-style marketing page. White ground, rounded lavender panels inset 20px from the edge,
   1280px content column, one coral-red accent for the emphasised line of each heading, black pill-less buttons. */
:root{
  --bg:#ffffff;
  --panel:#f6f7ff;          /* lavender section panels */
  --panel-2:#edeff7;
  --card:#ffffff;
  --fg:#121214;
  --fg-2:#3c3d47;
  --muted:#6b6e7c;
  --line:#d3d4e1;
  --line-soft:#e6e7f0;
  --accent:#ff473d;
  --accent-ink:#c72c24;
  --accent-soft:#ffeded;
  --accent-soft-2:#ffd0ce;
  --btn:#121214;
  --btn-fg:#ffffff;
  --green:#38d178;  --green-soft:#d5f6e3;
  --violet:#806cfe; --violet-soft:#e4e0ff;
  --amber:#fca757;  --amber-soft:#ffead7;
  --footer:#1b1c22; --footer-fg:#e9eaf2; --footer-muted:#9a9cab;
  --cube-top:#ffffff; --cube-a:#ffe3e1; --cube-b:#ffd0ce; --cube-side:#fff2f1;

  --display:"Be Vietnam Pro","Helvetica Neue",Arial,sans-serif;
  --body:"Helvetica Neue",Helvetica,Arial,"Be Vietnam Pro",sans-serif;
  --r-panel:20px; --r-card:16px; --r-btn:8px;
  --max:1280px;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --bg:#0e0f13; --panel:#15161d; --panel-2:#1c1e27; --card:#191b23;
    --fg:#f2f3f7; --fg-2:#c9cbd6; --muted:#9a9db0; --line:#2e3040; --line-soft:#252735;
    --accent:#ff5d52; --accent-ink:#ff8178; --accent-soft:#3a1b1a; --accent-soft-2:#5a2522;
    --btn:#f2f3f7; --btn-fg:#121214;
    --green:#4ade8a; --green-soft:#16301f; --violet:#9d8eff; --violet-soft:#25213f; --amber:#ffb36b; --amber-soft:#3a2a18;
    --footer:#08090c; --footer-fg:#e9eaf2; --footer-muted:#8c8fa0;
    --cube-top:#1d1f29; --cube-a:#3a1f22; --cube-b:#4a2427; --cube-side:#2a1b1e;
    color-scheme:dark;
  }
}
:root[data-theme="dark"]{
  --bg:#0e0f13; --panel:#15161d; --panel-2:#1c1e27; --card:#191b23;
  --fg:#f2f3f7; --fg-2:#c9cbd6; --muted:#9a9db0; --line:#2e3040; --line-soft:#252735;
  --accent:#ff5d52; --accent-ink:#ff8178; --accent-soft:#3a1b1a; --accent-soft-2:#5a2522;
  --btn:#f2f3f7; --btn-fg:#121214;
  --green:#4ade8a; --green-soft:#16301f; --violet:#9d8eff; --violet-soft:#25213f; --amber:#ffb36b; --amber-soft:#3a2a18;
  --footer:#08090c; --footer-fg:#e9eaf2; --footer-muted:#8c8fa0;
  --cube-top:#1d1f29; --cube-a:#3a1f22; --cube-b:#4a2427; --cube-side:#2a1b1e;
  color-scheme:dark;
}

*{box-sizing:border-box}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}*{transition:none!important;animation:none!important}}
body{background:var(--bg);color:var(--fg);font-family:var(--body);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased}
a{color:inherit}
h1,h2,h3{font-family:var(--display);margin:0;text-wrap:balance;letter-spacing:-0.01em}
p{margin:0}
.red{color:var(--accent)}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:6px}

.wrap{max-width:var(--max);margin-inline:auto;padding-inline:clamp(16px,4.5vw,60px)}
.panel{background:var(--panel);border-radius:var(--r-panel);margin-inline:clamp(0px,1.4vw,20px)}
section{padding-block:clamp(56px,7vw,96px)}
```
