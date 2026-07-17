# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DisCen (Distraction Central) is a personal collection of web-based games, educational tools, and utilities. The project consists of standalone HTML applications served by Nginx, with a Node.js/Express server for development and health checks.

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

#### Games (`websites/games/`)
- Standalone HTML5 games using JavaScript and p5.js library
- Games include: Asteroids, Flight Game, Guess Capitals, Kaleidoscope variants, Maze, Pacman, Snake, Space Invaders, Tetris, Word Search, Wordle
- Each game is self-contained with its own assets (images, sounds, scripts)

#### Educational Tools (`websites/EJ-EV/`)
- Interactive educational applications for children
- Includes: Animal Sounds Match, Alphabet Search, Bubbles, Scribble, Trace, Speak Text

#### Utilities (`websites/utility/`)
- Development and text processing tools
- Letter Frequency Counter and Local Storage utilities

### Shared Resources (`shared/`)
- **CSS**: Common stylesheets (`shared/css/main.css`)
- **JavaScript**: Shared libraries including p5.js and Eruda debugger
- **Images**: Common image assets
- **Templates**: Reusable HTML templates

## Deployment

### Server Details
- **Host**: Oracle Cloud A1 ARM instance (129.146.103.78)
- **SSH**: `ssh discen` (configured in ~/.ssh/config)
- **Domain**: `distractioncentral.duckdns.org`
- **Web Server**: Nginx with Let's Encrypt SSL
- **Document Root**: `/home/opc/DisCen/websites/main/public`

### SSL Certificate Management
- Domain: `distractioncentral.duckdns.org`
- Managed by certbot with nginx plugin
- Auto-renewal via cron: `0 2 * * * /usr/local/bin/certbot renew --quiet --nginx`

### File Permissions
**IMPORTANT:** When adding new files to `websites/` directories, ensure proper permissions for Nginx to serve them:
- Use `chmod 660` for HTML, CSS, JS files (read/write for owner and group)
- Without group read permissions, Nginx will return 403 Forbidden errors

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

## End-of-Session Protocol
At the end of every session, always:
1. **Update `sessions.md`** in the project root
2. **Commit and push to GitHub**
