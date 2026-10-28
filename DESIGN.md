# Design Contract — Control Systems Website

Proposed design tokens for the Kali / Cloudflare-inspired professional polish pass (Phase D.2 of the development plan). This document is a **contract**: the Cyberpunk layout keeps its neon identity, the Forum layout uses the tokens below as its default, and D.2b applies the shared decisions (typography, spacing, radii, letter-spacing) across both.

Please read, mark anything you want changed, and sign off before I touch component styles.

---

## 1. Font stack

| Zone | Family | Fallback | Notes |
|---|---|---|---|
| **Body / headings** | `Inter` | `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | Inter is what both kali.org and cloudflare.com use. Variable-weight. Hosted via Google Fonts. |
| **Terminal / code / IRC log** | `VT323` (existing) | `'JetBrains Mono', 'Courier New', monospace` | Already loaded on IRC + hero. Keeps the cyberpunk flavour exactly where it reads as intentional. |
| **Section-heading accents** | `JetBrains Mono` (existing) | `'Courier New', monospace` | Already in use for `.win-title-text` etc. Keep for terminal panel chrome. |

**Alternative:** `IBM Plex Sans` if you want a stronger academic/engineering identity (used across IBM Research, STFC, several European universities). Slightly wider glyphs, feels less SaaS-y than Inter. **Say the word and I'll swap.**

---

## 2. Type scale

Base unit: `16px` body. The scale is a modified minor-third (×1.2) with a tightened lower end to accommodate the current ~0.56rem terminal labels.

| Token | Size (rem) | Px @16 | Use |
|---|---|---|---|
| `--fs-micro`  | 0.56 | 9  | Terminal chrome labels, status bars |
| `--fs-xs`     | 0.72 | 11.5 | Metadata, footnotes |
| `--fs-sm`     | 0.84 | 13.5 | Body-small, inline hints |
| `--fs-body`   | 1.00 | 16 | Default paragraph size |
| `--fs-lead`   | 1.20 | 19 | Lead paragraphs, hero subtitles |
| `--fs-h4`     | 1.40 | 22 | Minor headings |
| `--fs-h3`     | 1.70 | 27 | Sub-section headings |
| `--fs-h2`     | 2.10 | 34 | Section headings |
| `--fs-h1`     | 2.70 | 43 | Page title (`.hero-title` already uses `clamp()`; keep that but anchor the max near this value) |

Keep the hero's `clamp(2rem, 6vw, 3.4rem)` pattern — just makes sure the clamped max aligns with the token.

---

## 3. Letter-spacing

Both reference sites use **near-zero** letter-spacing on body text and tight headings. The current site over-tracks (2–4 px) which reads loud but tires.

| Context | Value |
|---|---|
| Body text, lead, lists | **0** (default) |
| H1–H2 | **-0.01em** (slight tightening — modern feel) |
| H3–H4 | **0** |
| Small-caps / terminal labels (`.win-status-bar`, `.plan-name`, etc.) | **2px** (keep — this IS the identity) |
| Buttons | **0.5px** in forum mode / **2px** in cyberpunk mode |

---

## 4. Spacing scale

Replace ad-hoc `padding: 1rem 2rem` / `margin-bottom: 2rem` with a step function. Cloudflare's grid uses 4-based increments; we match.

```
--sp-1:  4px
--sp-2:  8px
--sp-3:  12px
--sp-4:  16px
--sp-5:  24px
--sp-6:  32px
--sp-7:  48px
--sp-8:  64px
--sp-9:  96px
```

Scope v1 only enforces this on the four target areas (buttons, nav, section headings, body paragraph rhythm). It does not refactor the whole stylesheet.

---

## 5. Radii

Current language is `clip-path: polygon(...)` with 8/12/18/20/30 px angled corners. For Forum layout, polygons become **plain radii**.

| Token | Value | Use |
|---|---|---|
| `--radius-sm`  | 3px  | Inputs, chips, small buttons |
| `--radius-md`  | 6px  | Cards, panels |
| `--radius-lg`  | 10px | Modals, hero containers |
| `--radius-pill`| 999px | Status dots, badges |

Cyberpunk layout keeps the clip-path shape vocabulary intact — the two layouts don't share this one.

---

## 6. Buttons

Three canonical variants (replacing the ad-hoc mix: `.cyber-button`, `.btn-secondary`, `.blog-sub-btn`, `.sa-trigger`, `.curtain-enter`, `.curtain-style-btn`). Scope v1 refactors existing classes to **consume** these tokens; no HTML changes.

### 6.1 Primary
- bg: `linear-gradient(135deg, cyan-tint, pink-tint)` in cyber / solid cyan in forum
- border: 1px solid primary-cyan
- padding: `var(--sp-3) var(--sp-6)` (12 × 32px)
- font-size: `var(--fs-sm)` (13.5px)
- font-weight: 700
- letter-spacing: `2px` cyber / `0.5px` forum
- transition: 200ms

### 6.2 Secondary
- Same geometry, transparent background, dim border, cyan text on hover

### 6.3 Terminal (keeps retro ethos; cyberpunk-only)
- The existing `.sa-trigger` / `.blog-sub-btn` style — clip-path + animated glow. Not used in Forum layout.

---

## 7. Nav

Target: Kali's slim, high-contrast bar. Current nav padding is `1rem 2rem`.

- Height: `56px` (down from current ~66px)
- Padding: `var(--sp-3) var(--sp-6)` (12 × 32px)
- Logo text: `var(--fs-sm)` with tight letter-spacing
- Nav links: `var(--fs-sm)`, 0 letter-spacing, 500 weight, hover underline (keep current `.nav-flash-line` effect in cyber mode)
- Backdrop blur: 20px (unchanged)
- Border-bottom: 1px solid `rgba(255, 255, 255, 0.07)` — matches both reference sites

---

## 8. Section headings

Current sections use oversized headings with wide tracking. Target: shorter line-height, tighter spacing, a single horizontal rule underneath (Cloudflare-pattern).

- `.hero-title` → keeps clamp, `line-height: 1.05`, letter-spacing: `-0.01em`
- Section `<h2>` → `var(--fs-h2)` (34px), `line-height: 1.15`, `letter-spacing: -0.01em`, bottom border 1px `rgba(255,255,255,0.08)` in forum / cyan-glow underline in cyber
- Section `<p>` lead → `var(--fs-lead)` (19px), `line-height: 1.6`, `max-width: 68ch`

---

## 9. Body copy

- Default `color: var(--text-primary)` (`#ffffff`), `line-height: 1.65`, `max-width: 68ch` for readability
- Secondary color stays `#a1a1aa` (`--text-secondary`); no change
- Links in body: `var(--primary-cyan)`, underlined, decoration-color `rgba(cyan, 0.4)` → full cyan on hover

---

## 10. Open questions for you

Pick one from each row (or write-in). I'll apply these in D.2b.

| # | Question | Options |
|---|---|---|
| **Q1** | Body font? | **(a)** Inter (recommended) · (b) IBM Plex Sans · (c) keep current |
| **Q2** | Tracking on body? | **(a)** Zero (recommended — matches both references) · (b) 0.3px (slight polish) · (c) keep current (0.5–1px) |
| **Q3** | Nav height? | **(a)** 56px (compact, Kali-like) · (b) 64px (comfortable, Cloudflare-like) · (c) keep current |
| **Q4** | Forum button corners? | **(a)** 4px radius (recommended) · (b) 2px (sharper) · (c) 8px (softer) |
| **Q5** | Apply polish to blog.html / about.html / member.html as part of v1? | **(a)** Yes — all four pages · (b) index.html only, roll others out later |
| **Q6** | Font loading strategy? | **(a)** Google Fonts link in `<head>` (fast, standard) · (b) self-host via `@font-face` (zero third-party, slower first paint) |

**Default picks (if you just say "go"):** 1a, 2a, 3a, 4a, 5a, 6a.

---

## 11. What D.2b will NOT change

- The 14 canvas visualization modes (`grid-fx.js`) — identity, keep as-is
- The matrix rain / particles / data streams — identity, keep in cyber only (already hidden in forum)
- IRC log typography (VT323) — intentional
- Theme-switcher behaviour (the 8-name system) — out of scope
- Mobile menu / hamburger — out of scope (noted as pre-existing parity gap in CLAUDE.md context)
- Admin panel styling — localhost only, not public surface
