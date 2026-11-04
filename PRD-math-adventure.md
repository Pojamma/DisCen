# PRD: Math Adventure - Fun with Numbers v2

## Overview

A math practice game for 5-6 year old children, building on the look and feel of `math-game-claude-v1.html`. The game adds persistent user accounts with server-side storage (progress follows kids across devices), a pretend "store" reward system to motivate repeated play, and an admin panel for grandpa to manage users and prizes. Deployed on DisCen with Nginx serving the frontend and the Express server handling the data API.

---

## 1. Access & Authentication

### 1.1 Entry Gate (Master Password)

When the game loads, a friendly splash screen appears with a single password field and a "Play as Guest" button.

- **Master password** — A full-strength password. The hash (PBKDF2) is stored server-side in the game's JSON data file. The client sends the plaintext to the server over HTTPS; the server hashes and compares. Anyone who knows the master password proceeds to the user-select screen.
- **First-run setup** — On first launch, if no master password exists in the server data file, the app prompts to create one (minimum 8 characters, must include uppercase, lowercase, number, and special character). This only happens once.

### 1.2 User Accounts

After passing the master password gate:

- A **user selection screen** shows existing kid accounts as large, colorful, clickable avatar buttons. Each child has an animal emoji avatar chosen from a preset list of 12 options (cat, dog, bunny, unicorn, bear, fox, owl, penguin, butterfly, dolphin, dragon, panda).
- Tapping a user prompts for **their personal password** (minimum 3 characters, any letters/numbers/special characters allowed).
- An **"Admin"** button is always visible, which requires re-entering the master password to access the admin panel.
- A **"Create Account"** option (visible to anyone past the gate) lets a child create their own username + password. Admin can also create accounts from the admin panel.

### 1.3 Guest Mode

- Guests skip all login entirely.
- Guests can play the full math game but earn **no persistent points** and cannot access the store or prizes.
- A banner is always visible: "Playing as Guest - Ask grandpa to make you an account to earn coins!"
- Session score is shown during play but not saved.

---

## 2. Game Screen Layout

Preserve the colorful, rounded, kid-friendly aesthetic of v1. Key changes:

### 2.1 Number/Icon Alignment (Table Layout)

Replace the flexbox vertical representation with an HTML `<table>` so numbers and icons align in clean columns:

```
+--------+---------+--------------------------------------+
|        |   5     | apple apple apple apple apple        |
+--------+---------+--------------------------------------+
|   +    |   ?     |                                      |
+--------+---------+--------------------------------------+
|   =    |   8     | apple apple apple apple apple apple apple apple |
+--------+---------+--------------------------------------+
```

- **Column 1** (narrow, right-aligned): operator symbol (+, -, x, /) or blank for the first row
- **Column 2** (fixed width, right-aligned, monospace-style): the number (or "?" for the missing number)
- **Column 3** (left-aligned): emoji icons representing the quantity
- A horizontal rule (bottom border on the second row) separates the operands from the result, like written math on paper
- Numbers are right-aligned so ones/tens digits line up vertically

### 2.2 Sections (top to bottom)

1. **Header bar** — Player name + avatar, coin balance (animated gold coin icon), current streak flame indicator, mute button, store button, badges button, logout button
2. **Title** — "Fun with Numbers!" (dynamically changes based on operation, same as v1)
3. **Horizontal formula** — e.g., `5 + ? = 8`
4. **Visual table** — the aligned number/icon table described above
5. **Answer buttons** — 4 multiple-choice options (same as v1)
6. **Message area** — feedback messages ("Great job!", "Try again!")
7. **Controls** — operation checkboxes, age/difficulty selector, help button, new problem button
8. **Progress bar** — shows coin progress toward the next affordable prize milestone

### 2.3 Responsive Design

- Works on phone, tablet, and desktop (the grandkids may use a tablet)
- Touch-friendly large buttons (minimum 48px tap targets)
- No hover-dependent interactions

---

## 3. Point System & Pretend Store

### 3.1 Earning Coins

| Action | Coins |
|--------|-------|
| Correct answer on first try | 10 |
| Correct answer on second try | 5 |
| Correct answer on third try | 2 |
| Complete a 5-problem streak (no wrong answers) | 25 bonus |
| Complete a 10-problem streak | 75 bonus |
| Daily login (first problem of the day) | 15 bonus |
| Try a new operation for the first time | 20 bonus |
| Bonus round problem (every ~10th problem) | Double the normal coin value |

- Wrong answers earn 0 coins (never negative — no punishment)
- A "cha-ching" sound + animated floating "+10" coin animation plays when coins are earned

### 3.2 Coin Display

- Coin balance is always visible in the header with a gold coin icon
- When coins are earned, an animated "+N" floats up from the coin balance
- Two values tracked: **lifetime coins earned** (never decreases) and **spendable balance** (decreases when buying prizes)

### 3.3 Prize Store

A "Store" button (shopping bag icon) in the header opens a modal showing available prizes:

- Each prize has: an emoji icon, a name, a coin cost, and a description
- Prizes the child can afford are highlighted and tappable; others are grayed out with "X more coins needed"
- When a child "buys" a prize, a celebration animation plays (confetti burst), the prize is added to their **Prize List**, and coins are deducted from their spendable balance
- **The prize is a real-world IOU** — grandpa fulfills it in person. The prize list is a receipt.

**Default prizes (admin-editable):**

| Prize | Cost | Emoji |
|-------|------|-------|
| Sticker | 50 | star |
| Small treat | 100 | cookie |
| Pick a snack | 200 | lollipop |
| Small toy | 500 | teddy bear |
| Special outing | 1000 | ferris wheel |
| BIG surprise | 2500 | gift box |

### 3.4 Prize Fulfillment

- Each purchased prize appears in the child's "My Prizes" list with a status: "Waiting" or "Given!"
- The admin marks prizes as fulfilled from the admin panel
- Fulfilled prizes show a checkmark and the date they were given

---

## 4. Engagement & Motivation Features

### 4.1 Streak System

- A flame icon appears next to the player name during an active streak (2+)
- Streak counter shows: "3 in a row!"
- At 5 streaks, a fireworks animation plays on screen
- At 10 streaks, a dancing stars animation plays on screen
- Streak resets on a wrong first-try answer

### 4.2 Daily Challenge

- One special "Daily Challenge" problem each day (slightly harder than the selected difficulty — one age bracket up)
- Completing it earns a bonus 25 coins + a collectible star for that day
- A calendar view (accessible from the profile) shows which days they played (filled stars for completed days, empty circles for missed days)
- 7 consecutive days = "Super Star Week" bonus of 100 coins

### 4.3 Achievement Badges

Unlockable badges that display on the player's profile:

| Badge | Emoji | Requirement |
|-------|-------|-------------|
| First Steps | footprints | Answer 1 problem correctly |
| Coin Collector | money bag | Earn 100 total coins |
| Addition Ace | plus sign | Get 25 addition problems right |
| Subtraction Star | star | Get 25 subtraction problems right |
| Multiply Master | sparkles | Get 25 multiplication problems right |
| Division Dynamo | lightning | Get 25 division problems right |
| Streak Machine | flame | Get a 10-problem streak |
| Daily Player | calendar | Play 7 days in a row |
| Math Wizard | wizard hat | Get 100 total problems right |
| Store Shopper | shopping bag | Buy first prize |
| Treasure Hunter | gem | Earn 1000 total coins |
| Super Star | trophy | Earn all other badges |

- New badges trigger a congratulatory popup with the badge icon and a trumpet flourish sound
- All earned badges are viewable in a "My Badges" modal from the header

### 4.4 Problem Variety

- Randomly selected emoji icons per problem (fruits, animals, etc. — same pool as v1)
- Every ~10th problem is a "Bonus Round" announced with a sparkle border effect around the problem area. Bonus rounds award double coins.
- Encouraging messages rotate on correct/incorrect answers (expanded set from v1)

### 4.5 Sounds

All sounds generated programmatically via the Web Audio API (no external audio files):

| Event | Sound |
|-------|-------|
| Correct answer | Cheerful ascending chime (C-E-G arpegio) |
| Wrong answer | Gentle low tone (not harsh or punishing) |
| Coins earned | Cash register "cha-ching" (short metallic burst) |
| Streak milestone (5, 10) | Brief fanfare (ascending scale) |
| Badge earned | Trumpet flourish |
| Prize purchased | Celebration jingle |
| Bonus round start | Sparkle/shimmer tone |

- Sounds are **on by default**
- A mute/unmute button is always visible in the header (speaker icon)
- Mute preference is saved per user

---

## 5. Admin Panel

Accessible via the "Admin" button + master password. Full-screen modal with tabs:

### 5.1 User Management

- **List all users** — shows username, avatar, total coins, problems solved, last active date
- **Create user** — set username, password (min 3 chars), choose avatar from the preset list
- **Edit user** — change password, change avatar
- **Delete user** — with confirmation dialog ("Are you sure? This deletes all of [name]'s progress!")
- **Reset progress** — clear a user's coins/stats while keeping the account (with confirmation)

### 5.2 Prize Management

- **List prizes** — shows all prizes with name, cost, emoji, description
- **Add prize** — name, coin cost, emoji (picked from a grid of ~40 common emojis), description
- **Edit prize** — modify any field
- **Delete prize** — with confirmation
- **Reorder prizes** — up/down arrow buttons to change display order

### 5.3 Prize Fulfillment

- **Pending prizes** — list of all purchased-but-unfulfilled prizes across all users
- **Mark as given** — check off prizes that have been delivered in real life (adds a fulfillment date)
- Shows which child purchased what and when

### 5.4 Stats Dashboard

- Per-child stats: problems attempted, correct %, favorite operation, current streak, best streak, total coins earned, badges earned
- Simple bar chart (CSS-only, no library) showing each child's total problems solved for comparison

### 5.5 Settings

- **Change master password** (requires current password)
- **Export data** — download all game data as a JSON file (for backup)
- **Import data** — upload a JSON file to restore (for migration to a new server or recovery)
- **Reset everything** — deletes all users, prizes, stats. Requires typing "RESET" to confirm, plus a second confirmation dialog.

---

## 6. Data Storage (Server-Side)

All game data is stored in a **JSON file on the DisCen server** at `data/math-adventure.json`. The Express server reads/writes this file via API endpoints. This means progress persists across any device or browser — the kids can play at home, at grandpa's house, or anywhere.

### 6.1 Data File Structure

`data/math-adventure.json`:

```json
{
  "masterPasswordHash": "hex-string",
  "masterPasswordSalt": "hex-string",
  "settings": {
    "defaultSoundOn": true
  },
  "prizes": [
    {
      "id": "prize-uuid",
      "name": "Sticker",
      "cost": 50,
      "emoji": "star",
      "description": "A fun sticker!",
      "sortOrder": 0
    }
  ],
  "users": [
    {
      "id": "user-uuid",
      "username": "EJ",
      "passwordHash": "hex-string",
      "passwordSalt": "hex-string",
      "avatar": "cat",
      "coins": 450,
      "totalCoinsEarned": 780,
      "soundOn": true,
      "stats": {
        "totalProblems": 142,
        "correctFirstTry": 98,
        "currentStreak": 3,
        "bestStreak": 12,
        "byOperation": {
          "addition": { "attempted": 80, "correct": 65 },
          "subtraction": { "attempted": 42, "correct": 28 },
          "multiplication": { "attempted": 15, "correct": 5 },
          "division": { "attempted": 5, "correct": 0 }
        }
      },
      "badges": ["first-steps", "coin-collector"],
      "purchasedPrizes": [
        {
          "prizeId": "prize-uuid",
          "name": "Sticker",
          "purchaseDate": "2026-11-03",
          "fulfilled": false,
          "fulfilledDate": null
        }
      ],
      "dailyLog": ["2026-11-01", "2026-11-02", "2026-11-03"],
      "consecutiveDays": 3,
      "lastActiveDate": "2026-11-03",
      "createdAt": "2026-11-03T10:30:00Z"
    }
  ]
}
```

### 6.2 Password Hashing (Server-Side)

- Use Node.js `crypto` module: `crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512')`
- Each user gets a unique random salt (32 bytes, hex-encoded)
- Master password gets its own unique salt
- No plaintext passwords are ever stored
- Passwords travel over HTTPS (enforced by Nginx redirect)

### 6.3 API Endpoints

All endpoints live under `/api/math-adventure/`. Added to `src/server.js`.

**Authentication:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/math-adventure/auth/verify-master` | Verify master password. Body: `{ password }`. Returns `{ valid: true/false }` |
| POST | `/api/math-adventure/auth/setup-master` | Set master password (first run only). Body: `{ password }`. Returns `{ success: true }` |
| POST | `/api/math-adventure/auth/change-master` | Change master password. Body: `{ currentPassword, newPassword }` |
| POST | `/api/math-adventure/auth/login` | Log in a user. Body: `{ userId, password }`. Returns user object (minus password fields) |
| GET | `/api/math-adventure/auth/status` | Returns `{ initialized: true/false }` (whether master password is set) |

**Users:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/math-adventure/users` | List all users (id, username, avatar only — for the selection screen) |
| POST | `/api/math-adventure/users` | Create user. Body: `{ username, password, avatar }` |
| GET | `/api/math-adventure/users/:id` | Get full user data (after authentication) |
| PUT | `/api/math-adventure/users/:id` | Update user data (stats, coins, badges, etc.) |
| DELETE | `/api/math-adventure/users/:id` | Delete user (admin only) |
| POST | `/api/math-adventure/users/:id/reset` | Reset user progress (admin only) |

**Prizes:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/math-adventure/prizes` | List all prizes |
| POST | `/api/math-adventure/prizes` | Add a prize (admin only) |
| PUT | `/api/math-adventure/prizes/:id` | Edit a prize (admin only) |
| DELETE | `/api/math-adventure/prizes/:id` | Delete a prize (admin only) |
| POST | `/api/math-adventure/users/:id/purchase` | Purchase a prize. Body: `{ prizeId }` |
| POST | `/api/math-adventure/users/:userId/prizes/:prizeIdx/fulfill` | Mark prize as fulfilled (admin only) |

**Admin:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/math-adventure/admin/stats` | Get stats dashboard data for all users |
| GET | `/api/math-adventure/admin/pending-prizes` | Get all unfulfilled prizes across all users |
| GET | `/api/math-adventure/admin/export` | Download full data file as JSON |
| POST | `/api/math-adventure/admin/import` | Upload JSON file to replace all data |
| POST | `/api/math-adventure/admin/reset` | Nuclear reset — delete everything |

**Settings:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/math-adventure/settings` | Get app settings |
| PUT | `/api/math-adventure/settings` | Update app settings (admin only) |

### 6.4 API Security

- All admin endpoints require the master password to be sent in a `X-Admin-Password` header. The server verifies it before processing.
- User data update endpoints require the user's password in a `X-User-Password` header (or a session token approach — see below).
- Simple approach: after successful login, the server returns a short-lived session token (stored in memory on the server, expires after 2 hours of inactivity). The client sends this token in an `Authorization: Bearer <token>` header for subsequent requests. This avoids sending passwords on every request.
- Rate limiting: no more than 10 failed login attempts per minute per IP (simple in-memory counter).

### 6.5 Nginx Configuration Changes

Add a proxy block to `discen.conf` to route API requests to the Express server:

```nginx
# Math Adventure API proxy
location /api/math-adventure/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## 7. File Structure

```
src/
  server.js                           — Express server (add API routes + JSON body parser)
  math-adventure-routes.js            — All /api/math-adventure/* route handlers
  math-adventure-data.js              — Data layer: read/write JSON file, password hashing

data/
  math-adventure.json                 — Game data file (created on first run)

websites/games/math-adventure/
  index.html                          — Single-page frontend (all HTML/CSS/JS in one file)
```

The `data/` directory is outside `websites/` so it is not served as a static file by Nginx.

---

## 8. Menu Integration

Add to `websites/main/public/index.html` items array:

```javascript
{ name: "Math Adventure", path: "games/math-adventure/index.html", category: "entertainment" }
```

Add to `websites/EJ-EV/menu.html` as a new menu button alongside the other kids' activities.

---

## 9. Screen Flow Summary

```
[Splash Screen]
    |
    +-- [Enter Master Password] --> [User Select Screen]
    |                                   |
    |                                   +-- [Tap user] --> [Enter user password] --> [Game Screen]
    |                                   |
    |                                   +-- [Create Account] --> [Set username/password/avatar] --> [Game Screen]
    |                                   |
    |                                   +-- [Admin] --> [Re-enter master password] --> [Admin Panel]
    |
    +-- [Play as Guest] --> [Game Screen (no coins saved, banner shown)]
```

**Game Screen accessible areas:**
- **Header:** player name + avatar, coins, streak flame, store button, badges button, mute button, profile button, logout
- **Main area:** math problem (horizontal formula + visual table + answer buttons + feedback message)
- **Controls bar:** operation checkboxes, age/difficulty selector, help button, new problem button, progress bar toward next prize
- **Store modal:** browse prizes, buy prizes, view "My Prizes" with fulfillment status
- **Badges modal:** grid of all badges (earned = colorful, unearned = grayed silhouette with requirement text)
- **Profile modal:** stats summary, daily calendar, my prizes list
- **Daily Challenge:** appears as a special highlighted problem once per day before normal play begins

---

## 10. Technical Notes

- **No build step** — plain HTML/CSS/JS frontend, no frameworks
- **Server-side data** — Express API reads/writes a JSON file on disk via Node.js `fs` module
- **PBKDF2 via Node.js `crypto`** — password hashing happens server-side (no bcrypt needed, per Termux constraints)
- **HTTPS enforced** — Nginx redirects HTTP to HTTPS; passwords travel encrypted
- **Responsive** — CSS media queries for phone, tablet, and desktop
- **Touch-friendly** — minimum 48px tap targets, no hover-dependent interactions
- **Single frontend file** — all HTML/CSS/JS in one `index.html` file
- **No external dependencies** — no CDN libraries; sounds generated via Web Audio API
- **File locking** — write operations on the JSON file use a simple in-memory mutex to prevent concurrent write corruption
- **Backup** — the export/import feature lets the admin download and restore the full data file

---

## 11. Deployment Steps

After building:

1. Push code to GitHub
2. SSH to `discen` server, `cd /home/opc/DisCen && git pull`
3. Create the `data/` directory: `mkdir -p /home/opc/DisCen/data`
4. Set permissions: `chmod 750 /home/opc/DisCen/data`
5. Apply SELinux context: `sudo restorecon -Rv /home/opc/DisCen/data /home/opc/DisCen/websites/games/math-adventure`
6. Update Nginx config with the API proxy block, then `sudo nginx -t && sudo systemctl reload nginx`
7. Restart the Node.js service: `sudo systemctl restart discen`
8. Visit the game URL and set the master password on first launch

---

## 12. Out of Scope (for now)

- Multiplayer / competitive mode between siblings
- Custom problem sets / worksheets
- Timed challenge mode
- Division with remainders
- Cross-server replication
