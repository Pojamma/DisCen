# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DisCen (Distraction Central) is a personal collection of web-based games, educational tools, and utilities. The project consists of standalone HTML applications served by Nginx, with a Node.js/Express server for development and health checks. Migrated from [ProBiz](https://github.com/Pojamma/ProBiz) in July 2026.

## Development Commands

```bash
# Start the development server with auto-reload
npm run dev

# Start the production server
npm start
```

## Architecture

### Server Architecture (`src/server.js`)
- Express.js server serving static files from the `websites/` directory
- Health check endpoint at `/health`
- Production traffic is served by Nginx directly (Node.js is for dev/health checks)

### Website Structure

#### Main Portal (`websites/main/public/index.html`)
- "Distraction Central" - categorized menu system for all applications
- Tab-based filtering (All, Entertainment, Utilities, Tools) with search

#### Games (`websites/games/`)
- Standalone HTML5 games using JavaScript and p5.js library
- Games include: Asteroids, Blues Jam, Drawing Pad, Flight Game, Game of Life, Guess Capitals, Hangman, Kaleidoscope variants, Kitten Pop Bugs, Minecraft Command Builder, Maze, Pacman, Pong, Sky Adventure, Snake, Space Invaders, Tetris, Word Search, Wordle
- Each game is self-contained with its own assets (images, sounds, scripts)

#### Educational Tools (`websites/EJ-EV/`)
- Interactive educational applications for children
- Menu at `websites/EJ-EV/menu.html`
- Includes: Animal Sounds Match, Alphabet Search, Bubbles, Scribble, Trace, Speak Text, Maze

#### Utilities (`websites/utility/`)
- Letter Frequency Counter and Local Storage utilities

### Shared Resources (`shared/`)
- **CSS**: Common stylesheets (`shared/css/main.css`)
- **JavaScript**: Shared libraries including p5.js and Eruda debugger
- **Images**: Common image assets
- **Templates**: Reusable HTML templates

## Deployment

### Server Details
- **Host**: Oracle Cloud A1 ARM instance (129.146.103.78, 6GB RAM)
- **OS**: Oracle Linux 9.7 (aarch64)
- **SSH**: `ssh discen` (configured in ~/.ssh/config)
- **Domain**: `distractioncentral.duckdns.org`
- **Web Server**: Nginx 1.20.1 with Let's Encrypt SSL
- **Node.js**: v24.18 (via NodeSource LTS)
- **Document Root**: `/home/opc/DisCen/websites/main/public`
- **Systemd Service**: `discen.service` (Node.js on port 3001)

### Nginx Configuration
- Config file: `/etc/nginx/conf.d/discen.conf`
- Location blocks for `/games/`, `/EJ-EV/`, `/utility/`, `/shared/`
- Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, etc.)
- Gzip compression enabled
- Hidden files and backup files blocked
- ACME challenge exception (`^~` prefix) before hidden files deny rule
- Logs: `/var/log/nginx/discen_access.log`, `/var/log/nginx/discen_error.log`
- Reference copy of the config is kept at `~/DisCen/discen.conf`

### SSL Certificate Management
- Domain: `distractioncentral.duckdns.org`
- Managed by certbot 3.1.0 with nginx plugin
- Certificate expires: 2026-10-15 (auto-renews)
- Auto-renewal via cron: `0 2 * * * /usr/bin/certbot renew --quiet --nginx`
- Certbot SSL options: `/etc/letsencrypt/options-ssl-nginx.conf`

### SELinux
- SELinux is **Enforcing** on the server
- `/home/opc/DisCen` has `httpd_sys_content_t` context applied
- `httpd_enable_homedirs` and `httpd_read_user_content` booleans are enabled
- When adding new files, run: `sudo restorecon -Rv /home/opc/DisCen/path/to/new/files`

### File Permissions
**IMPORTANT:** When adding new files to `websites/` directories:
- Nginx user is in the `opc` group
- `/home/opc` has `750` permissions
- Files need to be readable by the nginx group
- Without proper permissions, Nginx will return 403 Forbidden errors

### Other Services
- **Fail2Ban**: Active for SSH protection
- **Firewalld**: HTTP (80) and HTTPS (443) open

## Key Development Patterns

### Static File Serving
Most applications are standalone HTML files served directly by Nginx. The Express server handles development serving and health checks.

### Asset Organization
- Each application maintains its own assets in subdirectories
- Shared resources (p5.js, Eruda) are centralized in `/shared/js/`

## Development Workflow
1. **ALWAYS create a new branch before making changes** - Use `git checkout -b feature/description`
2. Most changes involve editing standalone HTML applications
3. For server changes, modify `src/server.js` and restart with `npm run dev`
4. Static assets are served directly without build process
5. After pushing changes, SSH to server and `cd /home/opc/DisCen && git pull` to deploy

## End-of-Session Protocol
At the end of every session, always:
1. **Update `sessions.md`** in the project root
2. **Commit and push to GitHub**
