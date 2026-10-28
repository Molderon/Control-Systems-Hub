# Publishing Checklist — Control Systems Website

Current state: fully working on LAN (`http://192.168.50.213:8080`).
Everything below is ordered by dependency — complete each step before the next.

---

## Step 1 — Register a Domain

**Where:** Cloudflare Registrar → `dash.cloudflare.com` → Domain Registration

Cloudflare Registrar is the right choice here: at-cost pricing, WHOIS privacy
included, and the domain is immediately usable for Tunnel routes with zero
nameserver migration.

Once registered, note your domain (referred to as `yourdomain.com` below).

---

## Step 2 — Reconfigure Cloudflare Tunnel Routes

**Where:** Cloudflare Zero Trust → Networks → Tunnels → `daedalus` → Public Hostnames

The current routes point at `controlsystems-hub.netlify.app` (wrong — Cloudflare
can't manage that domain). Replace them:

1. Delete both existing routes
2. Add these two:

| Subdomain | Domain | Service URL |
|---|---|---|
| `api` | `yourdomain.com` | `http://127.0.0.1:3000` |
| `irc` | `yourdomain.com` | `http://127.0.0.1:8097` |

Verify the tunnel picked them up on Daedalus:
```bash
journalctl -u ddl-cloudflared -n 10
# Should mention: new configuration / updated hostnames
```

Then test from anywhere:
```bash
curl https://api.yourdomain.com/api/health
# Expected: {"ok":true}
```

---

## Step 3 — Apply Permanent NixOS Config

The firewall ports (8080, 3000, 8097) and bootloader fix (GRUB instead of
systemd-boot) are already in `Backend system/configuration.nix` on the dev
machine. Apply them on Daedalus:

```bash
sudo cp "/home/daedalus/System Config/configuration.nix" /etc/nixos/configuration.nix
sudo nixos-rebuild switch --flake /etc/nixos#daedalus
```

This makes the LAN firewall rules survive reboots and fixes the bootloader error
that was blocking the rebuild.

---

## Step 4 — Fix Ergochat Systemd Service

The ergochat systemd service (`ergochat.service`) is currently broken; ergo is
running as a manual process that won't survive a reboot. Fix it properly:

```bash
# Create the missing directory systemd needs for DynamicUser services
sudo mkdir -p /var/lib/private
sudo chmod 0700 /var/lib/private

# Apply all config fixes to /etc/ergo.yaml
sudo sed -i 's|name: irc.REPLACE_WITH_YOUR_DOMAIN.com|name: irc.yourdomain.com|' /etc/ergo.yaml
sudo sed -i 's|https://REPLACE_WITH_YOUR_NETLIFY_SITE.netlify.app|https://yourdomain.com|' /etc/ergo.yaml
sudo sed -i 's/enforce-utf: true/enforce-utf8: true/' /etc/ergo.yaml
sudo sed -i 's/num-bits: 64/num-bits: 64\n    netname: cs-plovdiv/' /etc/ergo.yaml
sudo sed -i 's/name: Control Systems — TU-Sofia Plovdiv/name: CS-TU-Plovdiv/' /etc/ergo.yaml

# Kill the manual ergo process and hand off to systemd
pkill -f 'ergo run'
sudo systemctl start ergochat
sudo systemctl status ergochat --no-pager | tail -6
```

---

## Step 5 — Wire Frontend URLs

On the dev machine, update two files with the real domain before deploying:

**`blog.html`** — line with `__BLOG_API_URL__`:
```html
<script>window.__BLOG_API_URL__ = 'https://api.yourdomain.com';</script>
```

**`irc.html`** — line with `__IRC_WSS_URL__`:
```html
<script>window.__IRC_WSS_URL__ = 'wss://irc.yourdomain.com';</script>
```

Note `wss://` (not `https://`) for the IRC WebSocket URL.

---

## Step 6 — Update Backend CORS Origin

Lock down CORS to the real frontend URL. On Daedalus:

```bash
sudo nano /etc/ddl-backend/backend.env
# Change: ALLOWED_ORIGIN=*
# To:     ALLOWED_ORIGIN=https://yourdomain.com
sudo systemctl restart ddl-backend
```

---

## Step 7 — Connect Domain to Netlify

In **Netlify dashboard → Site → Domain management → Add custom domain**:
- Add `yourdomain.com` and/or `www.yourdomain.com`

In **Cloudflare DNS** (for the same domain), add:
- `CNAME www → <your-netlify-subdomain>.netlify.app` (proxied OFF for Netlify)
- Or follow the Netlify-provided DNS instructions — they vary by domain setup

Netlify will provision a TLS certificate automatically once DNS propagates.

---

## Step 8 — Deploy Frontend to Netlify

Push the updated source (Step 5 changes) to GitHub. Netlify auto-deploys on push.

In **Netlify dashboard → Site → Environment variables**, confirm:

| Variable | Value |
|---|---|
| `DISCORD_WEBHOOK_URL` | Discord webhook URL for the contact form |

---

## Step 9 — End-to-End Verification

| Check | How | Expected |
|---|---|---|
| Backend public | `curl https://api.yourdomain.com/api/health` | `{"ok":true}` |
| Blog loads | Open site → Blog | Post list or empty-state art |
| Blog subscribe | Submit email in blog modal | Success toast, no error |
| Contact form | Fill and submit on index | Discord webhook fires |
| Admin panel | `http://localhost:3000/admin` on Daedalus | Password prompt |
| IRC | Open `/irc.html` → connect | Joins `#control-systems`, sees history |
| `/nick yourname` | In IRC chat | Status bar updates to new nick |

---

## Quick Reference — Daedalus Service Commands

```bash
# Status
sudo systemctl status ddl-backend ddl-cloudflared ergochat

# Restart
sudo systemctl restart ddl-backend
sudo systemctl restart ddl-cloudflared
sudo systemctl restart ergochat

# Live logs
journalctl -u ddl-backend -f
journalctl -u ddl-cloudflared -f
journalctl -u ergochat -f

# NixOS rebuild (after config changes)
sudo nixos-rebuild switch --flake /etc/nixos#daedalus
```

---

## Manual Process Restart (until Step 4 is done)

If Daedalus reboots before Step 4, restart the manual processes:

```bash
# Ergochat
nohup /nix/store/k9f92mlwgn9gjhdypa131b4znzfqy2fs-ergo-2.16.0/bin/ergo \
  run --conf ~/ergo-data/ircd.yaml \
  > ~/ergo-data/stdout.log 2>&1 & disown

# Frontend static server
cd ~/Control\ Systems\ -\ Website
nohup npx serve -l 8080 . > ~/serve.log 2>&1 & disown
```
