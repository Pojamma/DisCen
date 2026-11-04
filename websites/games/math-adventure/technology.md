# Math Adventure — Technology Documentation

## Architecture

Single-page HTML5 application (`index.html`) backed by a Node.js/Express REST API. All game logic runs client-side; the server handles persistent storage and authentication.

```
Browser (index.html)
  ├── CSS (~470 lines) — layout, animations, responsive design
  ├── HTML — 4 screens + 5 modals
  └── JavaScript (~700 lines) — game engine, API client, sound, UI
        │
        ▼  fetch('/api/math-adventure/...')
Express Router (math-adventure-routes.js)
        │
        ▼  read/write
JSON File Store (data/math-adventure.json)
```

## Backend

### Server
- **Runtime:** Node.js v24 (LTS)
- **Framework:** Express.js 4.x
- **Entry point:** `src/server.js` — mounts API router at `/api/math-adventure`, serves static files
- **Data layer:** `src/math-adventure-data.js` — JSON file I/O with promise-queue mutex
- **Routes:** `src/math-adventure-routes.js` — 20 REST endpoints

### Authentication
- **Password hashing:** PBKDF2 via Node.js `crypto` module (100,000 iterations, SHA-512, 64-byte key, random 32-byte salt). bcrypt is not used because native compilation fails on the Termux development environment.
- **Timing-safe comparison:** `crypto.timingSafeEqual()` for password verification
- **Session tokens:** UUID v4 via `crypto.randomUUID()`, stored in an in-memory `Map`
- **Session TTL:** 2 hours, refreshed on each API call
- **Rate limiting:** In-memory tracker, max 10 failed login attempts per IP per minute

### Data Storage
- **Format:** Single JSON file at `data/math-adventure.json`
- **Concurrency:** Promise queue (simple mutex) prevents write corruption from overlapping requests
- **Auto-initialization:** Directory and seed data (default prizes) created on first access
- **Backup:** Admin can export/import full JSON via the admin panel

### API Endpoints (20 total)
| Group | Endpoints |
|-------|-----------|
| Auth (5) | `GET /auth/status`, `POST /auth/setup-master`, `POST /auth/verify-master`, `POST /auth/change-master`, `POST /auth/login` |
| Users (6) | `GET /users`, `POST /users`, `GET /users/:id`, `PUT /users/:id`, `DELETE /users/:id`, `POST /users/:id/reset` |
| Purchases (2) | `POST /users/:id/purchase`, `POST /users/:userId/prizes/:prizeIdx/fulfill` |
| Prizes (3) | `GET /prizes`, `POST /prizes`, `PUT /prizes/:id`, `DELETE /prizes/:id` |
| Admin (4) | `GET /admin/stats`, `GET /admin/pending-prizes`, `GET /admin/export`, `POST /admin/import`, `POST /admin/reset` |

## Frontend

### Screens
1. **Splash** — first-run password setup or login prompt, guest mode button
2. **User Select** — avatar grid of existing players, create new player, admin access
3. **Game** — header bar, math problem, visual representation, answer buttons, controls

### Modals
- **Store** — browse prizes, purchase with coins, view purchased prizes
- **Badges** — 12-badge grid showing earned/locked status
- **Profile** — stats summary, monthly activity calendar, prize history
- **Help** — gameplay instructions
- **Admin Panel** — 5 tabs: Users, Prizes, Fulfillment, Stats, Settings

### CSS
- **Custom properties** for theming (--primary, --secondary, --accent, --success, --error)
- **CSS Grid** for the visual math representation (2-column: numbers | icons)
- **Flexbox** for all other layouts
- **Animations:** `@keyframes` for correct/incorrect answer feedback, floating coin text, confetti burst
- **Responsive breakpoints:** 768px and 480px

### JavaScript

**API Client** — `fetch()` wrapper that injects `Authorization: Bearer <token>` header. Token stored in JS variable (not localStorage — intentionally lost on refresh so kids re-enter password).

**Sound Engine** — Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`). All sounds are generated programmatically with frequency/duration/envelope parameters — no audio files. Audio context created on first user click to comply with browser autoplay policy.

| Sound | Technique |
|-------|-----------|
| Correct answer | Three ascending sine tones (C5→E5→G5) |
| Wrong answer | Low sawtooth tone (200Hz) |
| Coin earned | Two quick high sine tones (880→1100Hz) |
| Streak milestone | Four ascending sine tones |
| Badge earned | C5→E5→G5→C6 arpeggio |
| Purchase | Three ascending triangle tones |
| Bonus round | Five-note ascending scale |

**Game Engine** — Generates math problems based on selected operations (add/subtract/multiply/divide) and age group (3-5, 6-8, 9+). Number ranges scale with age. Division always produces whole-number results. Visual representation shows emoji icons capped at 20.

**Coin System** — 5 coins per correct answer, +3 first-try bonus, +1 per 5-streak, doubled during bonus rounds (every 10th problem). Floating "+N" animation on the coin display.

**Badges** — 12 achievements checked after each answer: milestones for correct answers (1, 10, 50, 100), streaks (5, 10, 25), all operations, coin totals (50, 200), first purchase, and bonus rounds completed.

**Animations** — Confetti burst (30 colored divs with CSS `@keyframes` fall + rotate), floating coin text (CSS translateY + fade), answer button scale/shake feedback.

## Infrastructure

### Production Server
- **Host:** Oracle Cloud A1 ARM instance (aarch64, 6GB RAM)
- **OS:** Oracle Linux 9.7
- **Web server:** Nginx 1.20.1 with Let's Encrypt SSL
- **Process manager:** systemd (`discen.service`)
- **Node.js port:** 3001 (proxied by nginx for `/api/math-adventure/`)
- **Domain:** `distractioncentral.duckdns.org`

### Nginx
- Serves static files directly from the filesystem
- Proxies `/api/math-adventure/` to `http://127.0.0.1:3001`
- Security headers: HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- Gzip compression for text/JS/CSS/JSON/SVG

### SELinux
- Enforcing mode
- Files labeled with `httpd_sys_content_t` context
- `restorecon` required after adding new files

### Deployment
- `deploy.sh` script: commit → push → SSH pull → npm install (if needed) → SELinux fix → nginx reload (if config changed) → service restart → health check

## Dependencies

### Production (npm)
- `express` ^4.18.2 — HTTP server and routing
- `dotenv` ^16.3.1 — environment variable loading

### Development
- `nodemon` ^3.0.1 — auto-restart on file changes

### Frontend (zero external dependencies)
- No frameworks, libraries, or CDN resources
- All JavaScript is vanilla ES6+
- All CSS is plain CSS with custom properties
- All sounds are Web Audio API (no audio files)
- All icons are Unicode emoji (no image assets)
