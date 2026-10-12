# Extractable components

## Layout Components

## NavBar
- Source: `index.html:330-352` (CSS 93-106)
- Category: layout
- Description: Thin utility bar (FAQ, login, about) above a sticky header with logo, 5 anchor links and two CTA buttons
- Extractable props: activeItem (string, default: "")
- Hardcoded: logo SVG + wordmark, link labels, CTA labels, all CSS

## Footer
- Source: `index.html:619-633` (CSS 259-267)
- Category: layout
- Description: Dark footer with logo + tagline, 4 link columns, legal row with Meta trademark disclaimer
- Extractable props: none
- Hardcoded: columns, links, copyright text

## Basic Components
- Button (`.btn-dark`, `.btn-outline`, `.btn-sm`) — `index.html:80-85`
- Badge (`.badge`) — `index.html:88`
- Feature card (`.fcard`) — `index.html:195`
