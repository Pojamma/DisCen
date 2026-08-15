# Scrabble

A complete Scrabble board game implemented as a standalone HTML5 web app. Supports human vs human, human vs bot, or bot vs bot play with full official rules.

## Features

- 15x15 board with correct premium square layout (Triple/Double Word, Triple/Double Letter)
- Standard 100-tile distribution and point values
- Word validation against the TWL06 Scrabble dictionary
- Bot AI that finds the highest-scoring valid move
- Blank tile support with letter picker
- 50-point bingo bonus for using all 7 tiles
- Tile exchange and pass actions
- Save/load games via localStorage
- Move-by-move game log
- Responsive design (works on mobile and desktop)
- End-game scoring per official rules

## How to Run

The game loads the dictionary file via `fetch()`, which requires an HTTP server (browsers block `fetch` on `file://` URLs).

### 1. Get the dictionary file

Place a file named `Scrabble-twl06.txt` in the project directory. It should contain one word per line (the TWL06 tournament word list). The game will still work without it — all words will be accepted — but validation won't enforce legal Scrabble words.

### 2. Start a local server

```bash
cd ~/scrabble
python3 -m http.server 8080
```

### 3. Open in a browser

Navigate to `http://localhost:8080`.

On Termux, you can open it in your device's browser. If accessing from another device on the same network, use your device's local IP address instead of `localhost`.

## How to Play

1. **Setup** — Enter player names and choose Human or Bot for each player. Click **START GAME**.
2. **Place tiles** — Click a tile in your rack to select it (it highlights), then click an empty cell on the board to place it. Click a placed tile on the board to return it to your rack.
3. **Blank tiles** — When you place a blank tile, a letter picker appears. Choose the letter it represents.
4. **Play** — Click **Play** to submit your word. All formed words are validated against the dictionary.
5. **Exchange** — Click **Exchange** to enter exchange mode. Click tiles in your rack to select them, then click **Confirm Exchange**. Requires 7+ tiles in the bag.
6. **Pass** — Click **Pass** to skip your turn.
7. **Shuffle** — Click **Shuffle** to rearrange tiles in your rack.
8. **Recall** — Click **Recall** to return all placed tiles from the board to your rack.
9. **Save/Load** — Use the **Save** and **Load** buttons to persist games in your browser's localStorage.

## File Structure

```
scrabble/
  index.html              Game UI
  style.css               Styles
  game.js                 Game logic, bot AI, save/load
  Scrabble-twl06.txt      Dictionary (user-provided)
  README.md               This file
  sessions.md             Development session log
```
