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

## Session 2026-07-28 PDT

### Summary
Renamed `websites/task_master/` directory to `websites/taskmaster/` and updated all references across the project.

### Changes
- Renamed directory `websites/task_master/` to `websites/taskmaster/` via `git mv`
- Updated main menu link path in `websites/main/public/index.html`
- Updated nginx location block and alias in `discen.conf`
- Updated deploy script restorecon path in `websites/taskmaster/deploy.sh`
- Updated file structure diagram in `websites/taskmaster/README.md`
- Updated dev server path in `websites/taskmaster/test_server.sh`
- Updated permission pattern in `.claude/settings.local.json`
- Left `sessions.md` historical entries and `task_master.json` filename/export prefixes unchanged (product name, not directory references)

### Deployment Notes
- Server nginx config (`/etc/nginx/conf.d/discen.conf`) needs to be updated to match the new `discen.conf`
- Run `sudo restorecon -Rv /home/opc/DisCen/websites/taskmaster` for SELinux after deploy

## Session 2026-08-15 PDT

### Summary
Added Kitten Story interactive storybook game for young children (age 4) and added it to the main menu.

### Changes
- Added `websites/games/kitten_story/` directory containing `kitten_story.html` and 8 kitten illustration images
- Added "Kitten Story" entry to the entertainment section in `websites/main/public/index.html`

### Commits
- `fd08e23` — Add Kitten Story game to menu and games directory

## Session 2026-08-15 21:45 PDT

### Summary
Added Puppy Sisters Sports Storybook — a 10-page interactive reading storybook for young children about two puppy sisters (Sunny and Sandy) who live by the beach and love sports. Created a reusable storybook template for generating future storybooks with consistent look and feel.

### Changes
- Created `websites/games/puppy_story/` directory with `puppy_story.html` and 10 claymation-style puppy illustration PNGs
- Added "Puppy Story" entry to the entertainment section in `websites/main/public/index.html`
- Created `websites/games/STORYBOOK_TEMPLATE.md` — reusable guide and HTML template for generating future storybooks with consistent styling and features
- Engagement improvements over kitten_story: pastel page backgrounds, bouncy word animations, fade-in page transitions, star progress indicator, confetti celebration on final page, navigation arrow hints, bigger touch targets, word-by-word highlighting during Read To Me

### Commits
- `06a19e2` — Add Puppy Sisters Sports Storybook to menu and games directory
- `0d916d4` — Add storybook template and session summary
- `1cb98a7` — Add Cooking Kittens storybook to menu and games directory

## Session 2026-08-15 22:45 PDT

### Summary
Added Cooking Kittens storybook — a 10-page interactive reading storybook about two kittens (Whiskers and Mittens) who bake a cake together. Used the storybook template workflow for the first time.

### Changes
- Created `websites/games/cooking_kittens/` directory with `cooking_kittens.html` and 10 claymation-style kitten illustration PNGs
- Added "Cooking Kittens" entry to the entertainment section in `websites/main/public/index.html`

### Commits
- `1cb98a7` — Add Cooking Kittens storybook to menu and games directory

## Session 2026-09-18 17:59 PDT

### Summary
Added hideable project tabs with tray and context menu to Task Master. The X button on project tabs now hides the tab instead of deleting it. Hidden tabs appear in a "📂 N hidden" tray button at the end of the tab row, with a dropdown to restore them. Delete and Rename are now accessed via long-press (touch) or right-click context menu instead of dblclick/X. Also updated the `~/TaskMasterApp/build-apk.sh` script to automatically copy latest source files from DisCen, apply APK-specific patches via sed, and output the APK to the shared Downloads directory.

### Changes
- `websites/taskmaster/task_manager.js` — Added `hiddenProjects` array to data model with localStorage persistence; `hideProjectTab()`/`showProjectTab()` methods; hidden tabs tray dropdown (`toggleHiddenTabsMenu()`); long-press and right-click context menu (`showTabContextMenu()`) with Rename/Delete options; updated `deleteProjectTab()`/`renameProjectTab()` to clean up hidden state; Escape key closes menus
- `websites/taskmaster/task_manager.html` — Added CSS for `.hidden-tabs-btn`, `.hidden-tabs-menu`, `.hidden-tab-item`, `.tab-context-menu`, `.tab-context-item`; bumped script cache version to v=3
- `~/TaskMasterApp/build-apk.sh` — Rewrote to copy fresh source from DisCen, patch index.html with APK-specific meta tags/safe-area padding/Capacitor back button handler via sed, output APK to `/storage/emulated/0/Download/TaskMaster.apk`

### Commits
- `7e7af12` — Add multi-select status filter chips and On Hold status to Task Master
- `309b92f` — Add hideable project tabs with tray and context menu to Task Master

## Session 2026-11-03 18:00 PST

### Summary
Built the full Math Adventure game — a math practice app for 5-6 year olds with server-side persistent storage, pretend monetization (coin rewards and prize store), user accounts, badges, and an admin panel for parents. Created a deploy script for the project. Deployed everything to the DisCen production server.

### Changes
- `src/math-adventure-data.js` — **Created.** Data access layer: JSON file read/write with promise-queue mutex, PBKDF2 password hashing via Node.js `crypto`, auto-creates `data/` directory and seeds default prizes on first access
- `src/math-adventure-routes.js` — **Created.** Express router with 20 REST API endpoints: auth (master password setup/verify/change, user login), user CRUD, prize CRUD, purchase/fulfillment, admin stats/export/import/reset. In-memory session management (2hr TTL) and rate limiting (10 attempts/min/IP)
- `src/server.js` — Added `express.json()` middleware and mounted math-adventure router at `/api/math-adventure`
- `websites/games/math-adventure/index.html` — **Created.** Single-page game: splash/login screen, user selection, math game engine (add/subtract/multiply/divide, 3 age groups), visual emoji representation with CSS grid alignment, 4-choice answer buttons, coin system (5 base + first-try/streak/bonus multipliers), prize store, 12 badges, profile with monthly calendar, full admin panel (5 tabs), Web Audio API sound effects, confetti animations, responsive design
- `websites/games/math-adventure/technology.md` — **Created.** Full technology documentation covering architecture, backend, frontend, infrastructure, and dependencies
- `websites/main/public/index.html` — Added "Math Adventure" entry to the entertainment items array
- `websites/EJ-EV/menu.html` — Added "Math" button linking directly to Math Adventure (bypasses `openGame()` since it has its own auth)
- `discen.conf` — Added nginx `proxy_pass` block for `/api/math-adventure/` to Node.js on port 3001
- `.gitignore` — Added `data/` to prevent committing user data and password hashes
- `deploy.sh` — **Created.** Deployment script: commit, push, SSH pull, conditional npm install, SELinux restorecon, conditional nginx reload, service restart, health check verification
- `PRD-math-adventure.md` — **Created.** Committed the planning/requirements document
- `math-game-claude-v1.html` — Deleted standalone prototype (superseded by Math Adventure)

### Commits
- `0ee8c22` — Add Math Adventure game with server-side persistence and admin panel
- `193e18f` — Fix vertical alignment in Math Adventure visual representation
- `4eaf631` — Add deploy script and Math Adventure technology docs
- `ebf2c29` — Add Math Adventure PRD and remove standalone prototype HTML

## Session 2026-11-11 PST

### Summary
Added admin password reset for child accounts and show/hide password toggle to Math Adventure. Admins can now reset a child's password from the Users tab, forcing the child to choose a new password on their next login. All password fields throughout the app now have an eye icon toggle for showing/hiding the password, making it easier for young children.

### Changes
- `src/math-adventure-routes.js` — Added `POST /users/:id/reset-password` (admin only, sets `passwordResetRequired` flag), `POST /users/:id/change-password` (user auth, sets new password and clears reset flag), updated `POST /auth/login` to return `passwordResetRequired` in response
- `websites/games/math-adventure/index.html` — Added `.pw-wrapper` / `.pw-toggle` CSS for show/hide password toggle; added `togglePw()` and `pwFieldHtml()` utility functions; replaced all raw password inputs with toggle-wrapped versions (setup, login, user login, admin login, create user, admin create user, admin change password); added `showForcePasswordChange()` and `doForcePasswordChange()` for forced password change flow after login; added `adminResetPassword()` function and "Reset Pwd" button to admin Users tab; renamed existing "Reset" button to "Reset Progress" for clarity

### Commits
- `879dc87` — Add admin password reset for children and show/hide password toggle

## Session 2026-11-11 PST (2)

### Summary
Added guess-based scoring system, per-problem logging, and an admin Problem Logs tab to Math Adventure. The flat coin formula (5 base + 3 first-try bonus) is replaced with a guess-count system where multiplication/division earn more than addition/subtraction. After 3 wrong guesses the correct answer is auto-revealed with 0 coins. Every problem is logged per child and viewable in a new admin tab with filters, pagination, and color-coded "needs work" summary cards.

### Changes
- `src/math-adventure-routes.js` — Added `problemLog` and `statsByOperationAndAge` fields to user creation; PUT handler now accepts `newLogEntry` (appended to log) and `statsByOperationAndAge` (incremental merge); user reset clears both fields; added `GET /admin/problem-logs` (filterable, sortable, paginated) and `GET /admin/problem-logs/summary` (per-user breakdown with weak areas <60% accuracy, 5+ attempts)
- `websites/games/math-adventure/index.html` — Replaced `firstTry` boolean with `guessCount` tracker; added `calculateBaseCoins()` (add/sub: 5/3/1/0, mult/div: 7/5/3/0); added `revealAnswer()` and `logProblem()` helpers; rewrote `checkAnswer()` for guess-based scoring and auto-reveal after 3 wrong; updated `saveStats()` to send `newLogEntry` and incremental `statsByOperationAndAge`; added admin "Problem Logs" tab with filter bar (child, operation, age level, sort), "Needs Work" summary cards (green/yellow/red by accuracy), scrollable log table with color-coded guess counts and prev/next pagination; updated Help modal with new coin values

### Commits
- `a83bbd9` — Add guess-based scoring, problem logs, and admin stats tab
