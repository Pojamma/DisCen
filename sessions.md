# DisCen Session Log

## Session 2026-07-17 14:00 PDT

### Summary
Initial project creation. Migrated web applications from ProBiz to DisCen (Distraction Central).

### Changes
- Created DisCen project structure from ProBiz
- Copied `websites/` (~31MB) and `shared/` (~1.5MB) from ProBiz
- Created `src/server.js` (Express static file server with health check)
- Created `package.json`, `.env`, `.gitignore`, `CLAUDE.md`, `sessions.md`
- Initialized git repo and pushed to GitHub (`89851f3`)

### Server Setup (129.146.103.78 - Oracle A1 ARM, 6GB RAM, Oracle Linux 9.7)
- Installed Node.js v24.18 (NodeSource LTS), Nginx 1.20.1, Certbot 3.1.0, Fail2Ban
- Enabled EPEL repo (`oracle-epel-release-el9` + `ol9_developer_EPEL`)
- Configured firewalld: HTTP/HTTPS open
- Set timezone to America/Los_Angeles
- Cloned repo to `/home/opc/DisCen`, ran `npm install`
- Configured SELinux: `httpd_sys_content_t` context on `/home/opc/DisCen`, `httpd_enable_homedirs` and `httpd_read_user_content` booleans enabled
- Added nginx user to opc group, set `/home/opc` to 750
- Deployed nginx config (`/etc/nginx/conf.d/discen.conf`) with location blocks for games, EJ-EV, utility, shared
- Obtained SSL cert via `certbot --nginx` for `distractioncentral.duckdns.org` (expires 2026-10-15)
- Set up certbot auto-renewal cron (daily at 2 AM)
- Created and enabled systemd service `discen.service` (Node.js on port 3001)
- Reference copy of nginx config saved as `discen.conf` in repo root
- Updated `CLAUDE.md` with full server setup details (SELinux, nginx, SSL, deployment workflow)

### Verification
- HTTPS main page: 200
- Games (asteroids, Wordle): 200
- EJ-EV menu: 200
- Utilities: 200
- HTTP to HTTPS redirect: 301
- Node.js health check (localhost:3001/health): OK

### Commits
- `89851f3` — Initial commit: Distraction Central

## Session 2026-07-17 19:30 PDT

### Summary
Enhanced the Markdown Text Formatter with load-from-URL and sample markdown features.

### Changes
- Added "Load from URL" input section — fetches remote markdown files and loads them into the editor
- Added "Sample Markdown" button — populates the editor with a comprehensive formatting reference (headings, text styles, lists, tables, code blocks, blockquotes, footnotes, HTML-in-markdown)
- Added auto-conversion of git host URLs to raw equivalents for CORS compatibility:
  - GitHub blob → raw.githubusercontent.com
  - GitHub Gists → gist.githubusercontent.com
  - GitLab blob → gitlab.com raw
  - Bitbucket src → bitbucket.org raw

### Commits
- `07ed664` — Add load-from-URL and sample markdown features to markdown viewer
- `547c491` — Auto-convert GitHub blob URLs to raw URLs in markdown viewer
- `1017664` — Add GitLab, Bitbucket, and Gist URL auto-conversion in markdown viewer
