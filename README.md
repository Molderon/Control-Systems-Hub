# Control Systems — TU-Sofia, Branch Plovdiv

Department website for the Control Systems research group.
Cyberpunk / terminal aesthetic. Pure vanilla HTML5, CSS3, and JS — no frameworks, no bundlers.

---

## Architecture

```
Browser
  │
  ├── Netlify (static hosting)
  │     index.html · blog.html · irc.html · about.html
  │     ControlSystems.js · grid-fx.js · irc.js · blog.js
  │     Netlify/Functions/transmit.js  ← contact form → Discord
  │
  └── Cloudflare Tunnel
        │
        ├── api.your-domain.com  → localhost:3000  (Node.js / Express)
        │     GET  /api/posts          blog post list
        │     GET  /api/posts/:slug    single post
        │     POST /api/subscribe      AES-256-GCM encrypted email store
        │     GET  /admin              password-gated admin panel (localhost only)
        │
        └── irc.your-domain.com  → localhost:8097  (Ergo IRCd / WebSocket)
              #control-systems channel — open guest access
```

---

## Repository layout

```
.
├── index.html                 Main page
├── blog.html / blog.js        Blog — fetches posts from backend API
├── irc.html  / irc.js         IRC room — vanilla WebSocket client → Ergo
├── about.html
├── karageorgiev.html          PhD student profiles
├── petrova.html
├── medev.html
├── ControlSystems.css         Master stylesheet (~3 200 lines, all theming via CSS vars)
├── ControlSystems.js          Main interactive behaviour
├── ui-enhancements.js         Hero logo morph, tab dedup, profile card routing
├── grid-fx.js                 Canvas background animator (14+ visualisation modes)
├── blog.css
├── homebrew.js / homebrew/    Research projects index
├── css/                       variables.css · features.css
├── assets/
├── Netlify/Functions/
│   └── transmit.js            Contact form → Discord webhook
├── netlify.toml               Netlify build + functions config
├── backend/
│   ├── server.js              Express entry point (PORT 3000)
│   ├── routes/posts.js        Blog CRUD + SQLite
│   ├── routes/subscribe.js    Email encryption (AES-256-GCM)
│   ├── middleware/localOnly.js Admin route guard
│   ├── admin/index.html       Localhost-only admin panel
│   ├── ergo/
│   │   ├── ircd.yaml          Ergo IRC server configuration
│   │   ├── ergo.service       Reference systemd unit
│   │   └── .gitignore
│   ├── .env.example           Environment variable template
│   ├── package.json
│   └── README.md              Backend setup guide
├── Backend system/            NixOS configuration for the host machine (Dedalus)
│   ├── flake.nix
│   ├── configuration.nix
│   ├── modules/
│   │   ├── services.nix       ddl-backend · ddl-cloudflared · ddl-ergo systemd services
│   │   ├── packages.nix
│   │   └── desktop.nix        XFCE + XRDP (LAN remote desktop)
│   └── SETUP.md               Full installation guide
└── tests/
    └── irc.test.js            IRC client unit tests (node:test, zero deps)
```

---

## Frontend — Netlify

### Deploy

Push to GitHub; Netlify auto-deploys on merge to main. Or use the Netlify CLI / drag-and-drop.

`netlify.toml` sets:
- **publish dir**: `.` (repo root)
- **functions dir**: `Netlify/Functions`
- **Node version**: 18 (required for native `fetch` in the contact function)

### Environment variables (set in Netlify UI)

| Variable | Purpose |
|---|---|
| `DISCORD_WEBHOOK_URL` | Contact form → Discord |

### Two URLs to fill in before deploying

```html
<!-- blog.html -->
<script>window.__BLOG_API_URL__ = 'https://api.your-domain.com';</script>

<!-- irc.html -->
<script>window.__IRC_WSS_URL__  = 'wss://irc.your-domain.com';</script>
```

---

## Backend — self-hosted (NixOS)

Full setup walkthrough: [`Backend system/SETUP.md`](Backend%20system/SETUP.md)

### Quick summary

| Step | Command |
|---|---|
| Fresh install | `nixos-install --flake /mnt/etc/nixos#dedalus` |
| Apply changes | `sudo nixos-rebuild switch --flake /etc/nixos#dedalus` |
| Install deps | `cd backend && npm install` |
| Backend env | `/etc/ddl-backend/backend.env` (see `.env.example`) |
| CF Tunnel token | `/etc/cloudflared/tunnel.env` |
| Ergo binary | `wget` from github.com/ergochat/ergo/releases → `/opt/ergo/ergo` |
| Ergo config | copy `backend/ergo/ircd.yaml` → `/opt/ergo/ircd.yaml`, fill 3 placeholders |
| View logs | `journalctl -u ddl-backend -f` · `journalctl -u ddl-ergo -f` |

### Backend environment variables (`/etc/ddl-backend/backend.env`)

| Variable | Purpose |
|---|---|
| `PORT` | Express listen port (default `3000`) |
| `ENCRYPTION_KEY` | 64-char hex key for AES-256-GCM email encryption |
| `ADMIN_PASSWORD` | Password for the localhost admin panel |
| `ALLOWED_ORIGIN` | Netlify domain for CORS, e.g. `https://controlsystems.netlify.app` |

Generate the encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## IRC room

Runs on [Ergo IRCd](https://github.com/ergochat/ergo) — single Go binary, no external dependencies.

- Channel: `#control-systems`
- Access: open guest access (no registration required)
- WebSocket port: `127.0.0.1:8097` (exposed via Cloudflare Tunnel as WSS)
- History: last 50 messages replayed on join (in-memory, 7-day expiry)

See `backend/ergo/ircd.yaml` for the full annotated config.

---

## Development

```bash
# Backend
cd backend
cp .env.example .env   # fill in values
npm install
npm run dev            # node --watch server.js

# Tests (Node.js 18+ required)
node --test tests/irc.test.js
```

No build step for the frontend — open `index.html` directly in a browser.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5 · CSS3 · vanilla JS |
| Static hosting | Netlify |
| Serverless function | Netlify Functions (Node.js 18) |
| Backend API | Node.js 22 · Express · SQLite (better-sqlite3) |
| IRC | Ergo IRCd · vanilla JS WebSocket client |
| Host OS | NixOS 25.11 (flake-based) |
| Tunnel | Cloudflare Tunnel (cloudflared) |
