# RealUsers design system

## Product context
RealUsers is a done-for-you Threads service for brands in Vietnam: it writes posts by industry, checks them, waits for the brand's approval, publishes on schedule with real contextual comments, and sends a monthly report with a link to every post. Audience: shop owners, marketing leads, agencies. Page language: Vietnamese. Key page: one marketing landing page. Primary job: get the visitor to "Bắt đầu ngay" (sign up).

## Brand
- Name: **RealUsers** (one word, capital R and U). No logo file yet: use a text wordmark "RealUsers" in the display font, weight 700, near-black. Optionally a small solid blue rounded-square mark before it. Never imitate the Meta infinity logo or the Threads "@" logo.
- Tone: plain, confident, short sentences. No internal jargon.

## Color (white / black / Meta blue only)
| Token | Value | Use |
|---|---|---|
| `--bg` | `#FFFFFF` | page background |
| `--surface` | `#F1F4F7` | alternating section bands, soft panels |
| `--surface-2` | `#E4E9EE` | hover/pressed fills, dividers on surface |
| `--ink` | `#1C2B33` | headings and body text (Meta near-black) |
| `--ink-2` | `#465A69` | secondary text |
| `--muted` | `#67788A` | captions, fine print |
| `--line` | `#CBD2D9` | borders, dividers |
| `--black` | `#0A0A0A` | dark footer / dark band background |
| `--blue` | `#0866FF` | primary buttons, links, highlights, key numbers |
| `--blue-hover` | `#0457D8` | button hover |
| `--blue-soft` | `#E7F0FF` | badges, icon tiles, selected tab background |

Rules: blue is the only accent. No red, green, purple, orange, gradients or neon. Data bars use blue, ink and `--surface-2` only. Dark sections are `--black` with white text and blue accents.

## Typography
- Font: **Be Vietnam Pro** (Google Fonts, 400/500/600/700) for everything — it renders Vietnamese diacritics well. No serif or decorative fonts.
- H1: 56-64px desktop / 36px mobile, weight 700, line-height 1.1, letter-spacing -0.02em.
- H2: 40-44px desktop / 28px mobile, weight 700, line-height 1.2.
- H3: 20-22px, weight 600.
- Body 17px / 1.6; small 14px.

## Shape, spacing, depth
- Buttons: pill (radius 999px), height 48-52px, padding 0 28px, weight 600. Primary = blue fill white text; secondary = white fill, 1px `--ink` border or `--surface` fill.
- Cards: radius 16-24px, white on `--surface` bands or `--surface` on white, 1px `--line` or no border. Shadow only on product mockups: `0 24px 48px -24px rgba(28,43,51,.25)`.
- Content width 1200px, side gutter 24px desktop / 16px mobile, section padding 96px desktop / 64px mobile.
- Icons: simple 1.75px line icons in blue inside a 48px `--blue-soft` rounded tile.

## Motion
Subtle only: 150ms color/background transitions on buttons and links; tabs switch content without animation. Respect prefers-reduced-motion.

## Responsive
Breakpoints 1100 / 860 / 640px. Multi-column grids collapse to 2 then 1 column. Header collapses nav into a menu button below 860px; no horizontal scroll at 360px.
