"use strict";

// ============================================================
// Scrabble Game Engine
// ============================================================

const BOARD_SIZE = 15;
const RACK_SIZE = 7;
const BINGO_BONUS = 50;
const MAX_SCORELESS_TURNS = 6;

// --- Tile definitions ---
const TILE_DISTRIBUTION = {
  A:9, B:2, C:2, D:4, E:12, F:2, G:3, H:2, I:9, J:1, K:1, L:4, M:2,
  N:6, O:8, P:2, Q:1, R:6, S:4, T:6, U:4, V:2, W:2, X:1, Y:2, Z:1, '?':2
};

const TILE_VALUES = {
  A:1, B:3, C:3, D:2, E:1, F:4, G:2, H:4, I:1, J:8, K:5, L:1, M:3,
  N:1, O:1, P:3, Q:10, R:1, S:1, T:1, U:1, V:4, W:4, X:8, Y:4, Z:10, '?':0
};

// --- Premium square map ---
// Key: "row,col" -> type
function buildPremiumMap() {
  const m = {};
  const set = (r, c, t) => { m[`${r},${c}`] = t; };

  // Triple Word
  const twPos = [[0,0],[0,7],[0,14],[7,0],[7,14],[14,0],[14,7],[14,14]];
  twPos.forEach(([r,c]) => set(r,c,'tw'));

  // Double Word
  const dwPos = [];
  for (let i = 1; i <= 4; i++) { dwPos.push([i,i],[i,14-i],[14-i,i],[14-i,14-i]); }
  dwPos.forEach(([r,c]) => set(r,c,'dw'));

  // Triple Letter
  const tlPos = [[1,5],[1,9],[5,1],[5,5],[5,9],[5,13],
                 [9,1],[9,5],[9,9],[9,13],[13,5],[13,9]];
  tlPos.forEach(([r,c]) => set(r,c,'tl'));

  // Double Letter
  const dlPos = [[0,3],[0,11],[2,6],[2,8],[3,0],[3,7],[3,14],
                 [6,2],[6,6],[6,8],[6,12],[7,3],[7,11],
                 [8,2],[8,6],[8,8],[8,12],[11,0],[11,7],[11,14],
                 [12,6],[12,8],[14,3],[14,11]];
  dlPos.forEach(([r,c]) => set(r,c,'dl'));

  // Center star (also DW)
  set(7, 7, 'star');

  return m;
}

const PREMIUM_MAP = buildPremiumMap();

function premiumLabel(type) {
  switch(type) {
    case 'tw': return 'TW';
    case 'dw': return 'DW';
    case 'tl': return 'TL';
    case 'dl': return 'DL';
    case 'star': return '\u2605';
    default: return '';
  }
}

// ============================================================
// Game State
// ============================================================

let dictionary = null; // Set of uppercase words
let dictionaryLoading = false;

let state = null; // Current game state

function newGameState(p1Name, p1Type, p2Name, p2Type) {
  const bag = [];
  for (const [letter, count] of Object.entries(TILE_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) bag.push(letter);
  }
  shuffle(bag);

  const board = Array.from({length: BOARD_SIZE}, () =>
    Array.from({length: BOARD_SIZE}, () => null)
  );

  const s = {
    board,           // board[r][c] = null | {letter, value, isBlank, blankLetter}
    bag,
    players: [
      { name: p1Name, type: p1Type, score: 0, rack: [] },
      { name: p2Name, type: p2Type, score: 0, rack: [] }
    ],
    currentPlayer: 0,
    moveHistory: [],
    consecutiveScoreless: 0,
    gameOver: false,
    winner: null,
    turnNumber: 1
  };

  // Draw initial tiles
  drawTiles(s, 0, RACK_SIZE);
  drawTiles(s, 1, RACK_SIZE);

  return s;
}

function drawTiles(s, playerIdx, count) {
  const actual = Math.min(count, s.bag.length);
  for (let i = 0; i < actual; i++) {
    s.players[playerIdx].rack.push(s.bag.pop());
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ============================================================
// UI State
// ============================================================

let selectedRackIndex = null;   // Index in rack of selected tile
let placedTiles = [];           // [{row, col, letter, rackIndex, isBlank, blankLetter}]
let exchangeMode = false;
let exchangeSelected = new Set(); // rack indices selected for exchange
let logCollapsed = false;

// ============================================================
// Dictionary Loading
// ============================================================

async function loadDictionary() {
  if (dictionary) return;
  if (dictionaryLoading) return;
  dictionaryLoading = true;

  try {
    const resp = await fetch('Scrabble-twl06.txt');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    dictionary = new Set();
    for (const line of text.split(/\r?\n/)) {
      const w = line.trim().toUpperCase();
      if (w.length >= 2) dictionary.add(w);
    }
    console.log(`Dictionary loaded: ${dictionary.size} words`);
  } catch (e) {
    console.error('Failed to load dictionary:', e);
    alert('Could not load Scrabble-twl06.txt. Make sure the dictionary file is in the same directory as index.html. You may need to serve the files via an HTTP server (e.g. "python3 -m http.server").');
    dictionary = null;
  } finally {
    dictionaryLoading = false;
  }
}

function isValidWord(word) {
  if (!dictionary) return true; // If no dictionary, allow everything
  return dictionary.has(word.toUpperCase());
}

// ============================================================
// Board Helpers
// ============================================================

function getCell(r, c) {
  if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return undefined;
  return state.board[r][c];
}

function isBoardEmpty() {
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++)
      if (state.board[r][c]) return false;
  return true;
}

function isOccupied(r, c) {
  return getCell(r, c) != null;
}

function isJustPlaced(r, c) {
  return placedTiles.some(t => t.row === r && t.col === c);
}

function getPlacedTile(r, c) {
  return placedTiles.find(t => t.row === r && t.col === c);
}

function letterAt(r, c) {
  const placed = getPlacedTile(r, c);
  if (placed) {
    return placed.isBlank ? placed.blankLetter : placed.letter;
  }
  const cell = getCell(r, c);
  if (cell) {
    return cell.isBlank ? cell.blankLetter : cell.letter;
  }
  return null;
}

function tileValueAt(r, c) {
  const placed = getPlacedTile(r, c);
  if (placed) return placed.isBlank ? 0 : TILE_VALUES[placed.letter];
  const cell = getCell(r, c);
  if (cell) return cell.value;
  return 0;
}

// ============================================================
// Word Detection & Validation
// ============================================================

function getWordsFormedByPlacement() {
  // Returns {words: [{word, cells:[{r,c}], score}], totalScore, valid}
  if (placedTiles.length === 0) return { words: [], totalScore: 0, valid: false };

  const rows = placedTiles.map(t => t.row);
  const cols = placedTiles.map(t => t.col);
  const minR = Math.min(...rows), maxR = Math.max(...rows);
  const minC = Math.min(...cols), maxC = Math.max(...cols);

  // All in same row or same column?
  const sameRow = rows.every(r => r === rows[0]);
  const sameCol = cols.every(c => c === cols[0]);

  if (!sameRow && !sameCol) return { words: [], totalScore: 0, valid: false };

  // For a single tile, determine direction by adjacency
  let isHorizontal;
  if (placedTiles.length === 1) {
    // Check if adjacent tiles exist horizontally
    const r = rows[0], c = cols[0];
    const hasLeft = c > 0 && isOccupied(r, c-1);
    const hasRight = c < 14 && isOccupied(r, c+1);
    const hasUp = r > 0 && isOccupied(r-1, c);
    const hasDown = r < 14 && isOccupied(r+1, c);
    isHorizontal = (hasLeft || hasRight) ? true : (hasUp || hasDown) ? false : true;
  } else {
    isHorizontal = sameRow;
  }

  // Check continuity: all cells between min and max must be occupied (by board or placed tiles)
  if (isHorizontal) {
    const r = rows[0];
    for (let c = minC; c <= maxC; c++) {
      if (!isOccupied(r, c) && !isJustPlaced(r, c)) {
        return { words: [], totalScore: 0, valid: false };
      }
    }
  } else {
    const c = cols[0];
    for (let r = minR; r <= maxR; r++) {
      if (!isOccupied(r, c) && !isJustPlaced(r, c)) {
        return { words: [], totalScore: 0, valid: false };
      }
    }
  }

  // First move must cover center
  if (isBoardEmpty()) {
    const coversCenter = placedTiles.some(t => t.row === 7 && t.col === 7);
    if (!coversCenter) return { words: [], totalScore: 0, valid: false };
    // First word must be at least 2 letters
    // (single tile + center is possible if that's all we require -- official rules require 2+ letters)
  }

  // Must connect to existing tiles (unless first move)
  if (!isBoardEmpty()) {
    let connected = false;
    for (const t of placedTiles) {
      const {row: r, col: c} = t;
      if ((r > 0 && isOccupied(r-1, c)) || (r < 14 && isOccupied(r+1, c)) ||
          (c > 0 && isOccupied(r, c-1)) || (c < 14 && isOccupied(r, c+1))) {
        connected = true;
        break;
      }
    }
    if (!connected) return { words: [], totalScore: 0, valid: false };
  }

  const words = [];

  // Get the main word
  const mainWord = extractWord(
    isHorizontal ? rows[0] : minR,
    isHorizontal ? minC : cols[0],
    isHorizontal
  );
  if (mainWord && mainWord.word.length >= 2) {
    words.push(mainWord);
  }

  // Get cross words
  for (const t of placedTiles) {
    const crossWord = extractWord(t.row, t.col, !isHorizontal);
    if (crossWord && crossWord.word.length >= 2) {
      words.push(crossWord);
    }
  }

  // If only one tile placed and no words formed of length >= 2, invalid
  if (words.length === 0) {
    return { words: [], totalScore: 0, valid: false };
  }

  // Validate all words
  let allValid = true;
  for (const w of words) {
    w.valid = isValidWord(w.word);
    if (!w.valid) allValid = false;
  }

  // Calculate scores
  let totalScore = 0;
  for (const w of words) {
    totalScore += w.score;
  }

  // Bingo bonus
  const usedAllTiles = placedTiles.length === RACK_SIZE;
  if (usedAllTiles) totalScore += BINGO_BONUS;

  return { words, totalScore, valid: allValid, bingo: usedAllTiles };
}

function extractWord(startR, startC, horizontal) {
  // Find the start of the word
  let r = startR, c = startC;
  if (horizontal) {
    while (c > 0 && (isOccupied(r, c-1) || isJustPlaced(r, c-1))) c--;
  } else {
    while (r > 0 && (isOccupied(r-1, c) || isJustPlaced(r-1, c))) r--;
  }

  // Read the word
  let word = '';
  const cells = [];
  let score = 0;
  let wordMultiplier = 1;

  let cr = r, cc = c;
  while (cr < BOARD_SIZE && cc < BOARD_SIZE && (isOccupied(cr, cc) || isJustPlaced(cr, cc))) {
    const letter = letterAt(cr, cc);
    word += letter;
    cells.push({r: cr, c: cc});

    let letterScore = tileValueAt(cr, cc);

    // Apply premium only if just placed
    if (isJustPlaced(cr, cc)) {
      const prem = PREMIUM_MAP[`${cr},${cc}`];
      if (prem === 'dl') letterScore *= 2;
      else if (prem === 'tl') letterScore *= 3;
      else if (prem === 'dw' || prem === 'star') wordMultiplier *= 2;
      else if (prem === 'tw') wordMultiplier *= 3;
    }

    score += letterScore;

    if (horizontal) cc++; else cr++;
  }

  score *= wordMultiplier;

  if (word.length < 2) return null;
  return { word, cells, score };
}

// ============================================================
// Move Execution
// ============================================================

function executePlay() {
  const result = getWordsFormedByPlacement();
  if (!result.valid || result.words.length === 0) {
    const invalidWords = result.words.filter(w => !w.valid).map(w => w.word);
    if (invalidWords.length > 0) {
      alert(`Invalid word(s): ${invalidWords.join(', ')}`);
    } else {
      alert('Invalid tile placement. Tiles must form a line, connect to existing tiles, and form valid words.');
    }
    return false;
  }

  const player = state.players[state.currentPlayer];

  // Place tiles on board
  for (const t of placedTiles) {
    state.board[t.row][t.col] = {
      letter: t.letter,
      value: t.isBlank ? 0 : TILE_VALUES[t.letter],
      isBlank: t.isBlank,
      blankLetter: t.isBlank ? t.blankLetter : null
    };
  }

  // Remove placed tiles from rack (descending order to preserve indices)
  const usedIndices = placedTiles.map(t => t.rackIndex).sort((a, b) => b - a);
  for (const idx of usedIndices) {
    player.rack.splice(idx, 1);
  }

  player.score += result.totalScore;
  state.consecutiveScoreless = 0;

  const wordsStr = result.words.map(w => `${w.word}(${w.score})`).join(', ');
  const bonusStr = result.bingo ? ' +50 BINGO!' : '';
  addLog(`${player.name}: ${wordsStr} = ${result.totalScore} pts${bonusStr}`);

  // Draw replacement tiles
  drawTiles(state, state.currentPlayer, usedIndices.length);

  // Record move
  state.moveHistory.push({
    type: 'play',
    player: state.currentPlayer,
    tiles: placedTiles.map(t => ({...t})),
    words: result.words.map(w => w.word),
    score: result.totalScore,
    turn: state.turnNumber
  });

  placedTiles = [];
  selectedRackIndex = null;

  // Check game over (player used all tiles and bag is empty)
  if (player.rack.length === 0 && state.bag.length === 0) {
    endGame(state.currentPlayer);
    return true;
  }

  nextTurn();
  return true;
}

function executeExchange(tilesToExchange) {
  if (state.bag.length < 7) {
    alert('Not enough tiles in the bag to exchange (need at least 7).');
    return false;
  }
  if (tilesToExchange.size === 0) {
    alert('Select at least one tile to exchange.');
    return false;
  }

  const player = state.players[state.currentPlayer];

  // Remove selected tiles from rack (sorted descending to avoid index shift)
  const sortedIndices = [...tilesToExchange].sort((a, b) => b - a);
  const removed = [];
  for (const idx of sortedIndices) {
    removed.push(player.rack.splice(idx, 1)[0]);
  }

  // Draw same number from bag
  drawTiles(state, state.currentPlayer, removed.length);

  // Put removed tiles back in bag and shuffle
  state.bag.push(...removed);
  shuffle(state.bag);

  state.consecutiveScoreless++;
  addLog(`${player.name}: exchanged ${removed.length} tile(s)`);

  state.moveHistory.push({
    type: 'exchange',
    player: state.currentPlayer,
    count: removed.length,
    turn: state.turnNumber
  });

  checkScorelessEnd();
  if (!state.gameOver) nextTurn();
  return true;
}

function executePass() {
  const player = state.players[state.currentPlayer];
  state.consecutiveScoreless++;
  addLog(`${player.name}: passed`);

  state.moveHistory.push({
    type: 'pass',
    player: state.currentPlayer,
    turn: state.turnNumber
  });

  checkScorelessEnd();
  if (!state.gameOver) nextTurn();
}

function checkScorelessEnd() {
  if (state.consecutiveScoreless >= MAX_SCORELESS_TURNS) {
    endGame(-1); // No specific winner from going out
  }
}

function endGame(playerWhoWentOut) {
  state.gameOver = true;

  // Subtract remaining tile values
  let remainingPoints = [0, 0];
  for (let p = 0; p < 2; p++) {
    for (const tile of state.players[p].rack) {
      remainingPoints[p] += (tile === '?') ? 0 : TILE_VALUES[tile];
    }
  }

  if (playerWhoWentOut >= 0) {
    // Player who went out gets sum of opponent's remaining tiles
    const other = 1 - playerWhoWentOut;
    state.players[playerWhoWentOut].score += remainingPoints[other];
    state.players[other].score -= remainingPoints[other];
  } else {
    // Both subtract their remaining tiles
    state.players[0].score -= remainingPoints[0];
    state.players[1].score -= remainingPoints[1];
  }

  // Determine winner
  if (state.players[0].score > state.players[1].score) {
    state.winner = 0;
  } else if (state.players[1].score > state.players[0].score) {
    state.winner = 1;
  } else {
    state.winner = -1; // Tie
  }

  const winnerText = state.winner >= 0 ? `${state.players[state.winner].name} wins!` : "It's a tie!";
  addLog(`Game Over! ${winnerText} Final: ${state.players[0].name} ${state.players[0].score} - ${state.players[1].name} ${state.players[1].score}`);

  renderAll();
}

function nextTurn() {
  state.currentPlayer = 1 - state.currentPlayer;
  state.turnNumber++;
  exchangeMode = false;
  exchangeSelected.clear();
  selectedRackIndex = null;
  placedTiles = [];

  renderAll();

  // If bot's turn, trigger after short delay
  if (!state.gameOver && state.players[state.currentPlayer].type === 'bot') {
    disableControls(true);
    setTimeout(() => botTurn(), 300);
  }
}

// ============================================================
// Bot AI
// ============================================================

function botTurn() {
  if (state.gameOver) return;

  const move = findBestMove(state.currentPlayer);

  if (move) {
    // Place tiles
    const player = state.players[state.currentPlayer];
    let totalScore = 0;
    const wordsMade = [];

    // Temporarily place tiles on board and calculate score
    placedTiles = move.tiles;
    const result = getWordsFormedByPlacement();
    totalScore = result.totalScore;

    // Commit to board
    for (const t of move.tiles) {
      state.board[t.row][t.col] = {
        letter: t.letter,
        value: t.isBlank ? 0 : TILE_VALUES[t.letter],
        isBlank: t.isBlank,
        blankLetter: t.isBlank ? t.blankLetter : null
      };
    }

    // Remove used tiles from rack
    const usedIndices = move.tiles.map(t => t.rackIndex).sort((a, b) => b - a);
    for (const idx of usedIndices) {
      player.rack.splice(idx, 1);
    }

    player.score += totalScore;
    state.consecutiveScoreless = 0;

    const wordsStr = result.words.map(w => `${w.word}(${w.score})`).join(', ');
    const bonusStr = result.bingo ? ' +50 BINGO!' : '';
    addLog(`${player.name} (bot): ${wordsStr} = ${totalScore} pts${bonusStr}`);

    state.moveHistory.push({
      type: 'play',
      player: state.currentPlayer,
      tiles: move.tiles.map(t => ({...t})),
      words: result.words.map(w => w.word),
      score: totalScore,
      turn: state.turnNumber
    });

    drawTiles(state, state.currentPlayer, move.tiles.length);

    placedTiles = [];

    if (player.rack.length === 0 && state.bag.length === 0) {
      endGame(state.currentPlayer);
      return;
    }
  } else {
    // No valid move found; try exchange, or pass
    const player = state.players[state.currentPlayer];
    if (state.bag.length >= 7 && player.rack.length > 0) {
      // Exchange all tiles
      const removed = player.rack.splice(0, player.rack.length);
      drawTiles(state, state.currentPlayer, removed.length);
      state.bag.push(...removed);
      shuffle(state.bag);
      state.consecutiveScoreless++;
      addLog(`${player.name} (bot): exchanged ${removed.length} tile(s)`);
      state.moveHistory.push({
        type: 'exchange',
        player: state.currentPlayer,
        count: removed.length,
        turn: state.turnNumber
      });
    } else {
      state.consecutiveScoreless++;
      addLog(`${player.name} (bot): passed`);
      state.moveHistory.push({
        type: 'pass',
        player: state.currentPlayer,
        turn: state.turnNumber
      });
    }

    checkScorelessEnd();
  }

  if (!state.gameOver) {
    nextTurn();
  }
}

function findBestMove(playerIdx) {
  const player = state.players[playerIdx];
  const rack = [...player.rack];
  let bestMove = null;
  let bestScore = 0;
  const boardEmpty = isBoardEmpty();

  if (boardEmpty) {
    // First move: try words through center (7,7)
    bestMove = findBestFirstMove(rack);
  } else {
    // Find all anchor squares (empty squares adjacent to a filled square)
    const anchors = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (state.board[r][c]) continue;
        const adj = (r > 0 && state.board[r-1][c]) || (r < 14 && state.board[r+1][c]) ||
                    (c > 0 && state.board[r][c-1]) || (c < 14 && state.board[r][c+1]);
        if (adj) anchors.push({r, c});
      }
    }

    // For each anchor, try placing words in both directions
    for (const anchor of anchors) {
      for (const horizontal of [true, false]) {
        const moves = tryMovesAtAnchor(anchor.r, anchor.c, horizontal, rack);
        for (const move of moves) {
          if (move.score > bestScore) {
            bestScore = move.score;
            bestMove = move;
          }
        }
      }
    }
  }

  return bestMove;
}

function findBestFirstMove(rack) {
  if (!dictionary) return null;

  let bestMove = null;
  let bestScore = 0;

  // Try all words that can be formed from rack tiles
  const rackLetters = rack.map(t => t === '?' ? '?' : t);
  const possibleWords = findWordsFromRack(rackLetters);

  for (const {word, tilesUsed} of possibleWords) {
    if (word.length < 2) continue;

    // Try all valid horizontal starting columns that cross center (7,7)
    const minStartC = Math.max(0, 7 - word.length + 1);
    const maxStartC = Math.min(7, BOARD_SIZE - word.length);

    for (let startC = minStartC; startC <= maxStartC; startC++) {
      const tiles = [];
      for (let i = 0; i < word.length; i++) {
        const tu = tilesUsed[i];
        tiles.push({
          row: 7,
          col: startC + i,
          letter: tu.letter,
          rackIndex: tu.rackIndex,
          isBlank: tu.isBlank,
          blankLetter: tu.isBlank ? word[i] : null
        });
      }

      // Calculate score
      placedTiles = tiles;
      const result = getWordsFormedByPlacement();
      placedTiles = [];

      if (result.valid && result.totalScore > bestScore) {
        bestScore = result.totalScore;
        bestMove = { tiles, score: result.totalScore };
      }
    }
  }

  return bestMove;
}

function findWordsFromRack(rackLetters) {
  if (!dictionary) return [];

  const results = [];
  const rackCounts = {};
  let blanks = 0;

  for (const l of rackLetters) {
    if (l === '?') blanks++;
    else rackCounts[l] = (rackCounts[l] || 0) + 1;
  }

  // Only check words up to rack length
  for (const word of dictionary) {
    if (word.length > rackLetters.length) continue;
    if (word.length < 2) continue;

    const needed = {};
    for (const ch of word) {
      needed[ch] = (needed[ch] || 0) + 1;
    }

    let blanksNeeded = 0;
    let canMake = true;
    for (const [ch, cnt] of Object.entries(needed)) {
      const have = rackCounts[ch] || 0;
      if (have < cnt) {
        blanksNeeded += cnt - have;
        if (blanksNeeded > blanks) { canMake = false; break; }
      }
    }

    if (!canMake) continue;

    // Build tilesUsed mapping
    const tilesUsed = [];
    const usedIndices = new Set();
    let blanksLeft = blanks;

    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      // Find a rack tile matching this letter
      let found = false;
      for (let ri = 0; ri < rackLetters.length; ri++) {
        if (usedIndices.has(ri)) continue;
        if (rackLetters[ri] === ch) {
          tilesUsed.push({ letter: ch, rackIndex: ri, isBlank: false });
          usedIndices.add(ri);
          found = true;
          break;
        }
      }
      if (!found) {
        // Use a blank
        for (let ri = 0; ri < rackLetters.length; ri++) {
          if (usedIndices.has(ri)) continue;
          if (rackLetters[ri] === '?') {
            tilesUsed.push({ letter: '?', rackIndex: ri, isBlank: true });
            usedIndices.add(ri);
            found = true;
            break;
          }
        }
      }
    }

    results.push({ word, tilesUsed });
  }

  return results;
}

function tryMovesAtAnchor(anchorR, anchorC, horizontal, rack) {
  if (!dictionary) return [];

  const results = [];
  const rackLetters = rack.map(t => t === '?' ? '?' : t);

  // Determine the prefix (existing tiles before the anchor in the given direction)
  let prefix = '';
  let prefixCells = [];

  if (horizontal) {
    let c = anchorC - 1;
    while (c >= 0 && state.board[anchorR][c]) {
      prefix = state.board[anchorR][c].isBlank
        ? state.board[anchorR][c].blankLetter + prefix
        : state.board[anchorR][c].letter + prefix;
      prefixCells.unshift({r: anchorR, c});
      c--;
    }
  } else {
    let r = anchorR - 1;
    while (r >= 0 && state.board[r][anchorC]) {
      prefix = state.board[r][anchorC].isBlank
        ? state.board[r][anchorC].blankLetter + prefix
        : state.board[r][anchorC].letter + prefix;
      prefixCells.unshift({r, c: anchorC});
      r--;
    }
  }

  // Try extending from the anchor with rack tiles
  // We need to place at least one tile on the anchor itself
  const maxExtend = Math.min(rack.length, horizontal ? BOARD_SIZE - anchorC : BOARD_SIZE - anchorR);

  // Generate all possible extensions using rack tiles (up to length of rack)
  const extensions = generateExtensions(rackLetters, maxExtend, anchorR, anchorC, horizontal);

  for (const ext of extensions) {
    // ext.word includes both new tile letters and existing board tile letters
    // ext.tiles only includes the new tiles from the rack

    // Walk through positions from anchor, mapping new tiles to empty cells
    // and skipping existing board tiles (they're already in ext.word)
    const tiles = [];
    let valid = true;
    let curR = anchorR, curC = anchorC;
    let tileIdx = 0;
    let wordPos = 0;

    while (wordPos < ext.word.length) {
      if (curR >= BOARD_SIZE || curC >= BOARD_SIZE) { valid = false; break; }

      if (state.board[curR][curC]) {
        // Existing board tile — skip, it's already in ext.word
        if (horizontal) curC++; else curR++;
        wordPos++;
        continue;
      }

      if (tileIdx >= ext.tiles.length) { valid = false; break; }

      const wordChar = ext.word[wordPos];
      tiles.push({
        row: curR,
        col: curC,
        letter: ext.tiles[tileIdx].letter,
        rackIndex: ext.tiles[tileIdx].rackIndex,
        isBlank: ext.tiles[tileIdx].isBlank,
        blankLetter: ext.tiles[tileIdx].isBlank ? wordChar : null
      });
      tileIdx++;
      wordPos++;
      if (horizontal) curC++; else curR++;
    }

    if (!valid || tiles.length === 0) continue;

    // Build the full word including prefix and any suffix from existing tiles
    let suffix = '';
    let sr = curR, sc = curC;
    while (sr < BOARD_SIZE && sc < BOARD_SIZE && state.board[sr][sc]) {
      suffix += state.board[sr][sc].isBlank
        ? state.board[sr][sc].blankLetter
        : state.board[sr][sc].letter;
      if (horizontal) sc++; else sr++;
    }

    const fullWord = prefix + ext.word + suffix;
    if (fullWord.length < 2) continue;
    if (!isValidWord(fullWord)) continue;

    // Validate cross words using the scoring system
    placedTiles = tiles;
    const result = getWordsFormedByPlacement();
    placedTiles = [];

    if (result.valid && result.totalScore > 0) {
      results.push({ tiles, score: result.totalScore });
    }
  }

  return results;
}

function generateExtensions(rackLetters, maxLen, startR, startC, horizontal) {
  const results = [];
  const MAX_EXTENSIONS = 50000;

  function recurse(pos, word, tiles, usedIndices, r, c) {
    if (results.length >= MAX_EXTENSIONS) return;
    if (tiles.length > 0) {
      results.push({ word: word.slice(), tiles: tiles.slice() });
    }
    if (tiles.length >= maxLen || pos >= maxLen) return;
    if (r >= BOARD_SIZE || c >= BOARD_SIZE) return;

    // If current position has an existing tile, incorporate it and move on
    if (state.board[r][c]) {
      const existing = state.board[r][c].isBlank
        ? state.board[r][c].blankLetter
        : state.board[r][c].letter;
      const nextR = horizontal ? r : r + 1;
      const nextC = horizontal ? c + 1 : c;
      recurse(pos, word + existing, tiles, usedIndices, nextR, nextC);
      return;
    }

    // Try each unused rack tile
    const tried = new Set(); // Avoid duplicate letters from rack
    for (let ri = 0; ri < rackLetters.length; ri++) {
      if (usedIndices.has(ri)) continue;
      const letter = rackLetters[ri];
      if (letter === '?') {
        // Try blank as each letter
        for (let ch = 65; ch <= 90; ch++) {
          const c2 = String.fromCharCode(ch);
          const key = '?' + c2;
          if (tried.has(key)) continue;
          tried.add(key);

          const nextR = horizontal ? r : r + 1;
          const nextC = horizontal ? c + 1 : c;
          const newUsed = new Set(usedIndices);
          newUsed.add(ri);
          recurse(pos + 1, word + c2,
            [...tiles, { letter: '?', rackIndex: ri, isBlank: true }],
            newUsed, nextR, nextC);
        }
      } else {
        if (tried.has(letter)) continue;
        tried.add(letter);

        const nextR = horizontal ? r : r + 1;
        const nextC = horizontal ? c + 1 : c;
        const newUsed = new Set(usedIndices);
        newUsed.add(ri);
        recurse(pos + 1, word + letter,
          [...tiles, { letter, rackIndex: ri, isBlank: false }],
          newUsed, nextR, nextC);
      }
    }
  }

  recurse(0, '', [], new Set(), startR, startC);
  return results;
}

// ============================================================
// Save / Load
// ============================================================

function saveGame() {
  const name = prompt('Enter a name for this save:');
  if (!name || !name.trim()) return;

  const saveData = {
    state: JSON.parse(JSON.stringify(state)),
    timestamp: new Date().toISOString(),
    name: name.trim()
  };

  localStorage.setItem(`scrabble_save_${name.trim()}`, JSON.stringify(saveData));
  addLog(`Game saved as "${name.trim()}"`);
  alert(`Game saved as "${name.trim()}"`);
}

function showLoadDialog() {
  const saves = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('scrabble_save_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        saves.push({ key, name: data.name, timestamp: data.timestamp });
      } catch(e) { /* skip corrupt saves */ }
    }
  }

  if (saves.length === 0) {
    alert('No saved games found.');
    return;
  }

  // Build modal content
  const modal = document.getElementById('load-modal');
  const list = document.getElementById('save-list');
  list.innerHTML = '';

  saves.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  for (const save of saves) {
    const li = document.createElement('li');

    const info = document.createElement('div');
    const nameSpan = document.createElement('span');
    nameSpan.className = 'save-name';
    nameSpan.textContent = save.name;
    const dateSpan = document.createElement('span');
    dateSpan.className = 'save-date';
    dateSpan.textContent = ' - ' + new Date(save.timestamp).toLocaleString();
    info.appendChild(nameSpan);
    info.appendChild(dateSpan);

    const btnContainer = document.createElement('div');
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-save';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Delete save "${save.name}"?`)) {
        localStorage.removeItem(save.key);
        li.remove();
        if (list.children.length === 0) {
          closeModal('load-modal');
        }
      }
    });
    btnContainer.appendChild(delBtn);

    li.appendChild(info);
    li.appendChild(btnContainer);
    li.addEventListener('click', () => {
      loadGame(save.key);
      closeModal('load-modal');
    });

    list.appendChild(li);
  }

  openModal('load-modal');
}

function loadGame(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    state = data.state;
    placedTiles = [];
    selectedRackIndex = null;
    exchangeMode = false;
    exchangeSelected.clear();

    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';

    addLog(`Loaded save "${data.name}"`);
    renderAll();

    if (!state.gameOver && state.players[state.currentPlayer].type === 'bot') {
      disableControls(true);
      setTimeout(() => botTurn(), 500);
    }
  } catch(e) {
    alert('Failed to load save: ' + e.message);
  }
}

// ============================================================
// UI Rendering
// ============================================================

function renderBoard() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;

      const premium = PREMIUM_MAP[`${r},${c}`];
      const boardTile = state.board[r][c];
      const placed = getPlacedTile(r, c);

      if (placed) {
        cell.classList.add('has-tile', 'just-placed');
        const letter = placed.isBlank ? placed.blankLetter : placed.letter;
        const value = placed.isBlank ? 0 : TILE_VALUES[placed.letter];
        cell.innerHTML = `<span class="tile-letter">${letter || '?'}</span><span class="tile-value">${value}</span>`;
        cell.addEventListener('click', () => returnPlacedTile(r, c));
      } else if (boardTile) {
        cell.classList.add('has-tile');
        const letter = boardTile.isBlank ? boardTile.blankLetter : boardTile.letter;
        cell.innerHTML = `<span class="tile-letter">${letter}</span><span class="tile-value">${boardTile.value}</span>`;
      } else {
        if (premium) cell.classList.add(premium);
        cell.innerHTML = `<span class="premium-label">${premiumLabel(premium) || ''}</span>`;
        cell.addEventListener('click', () => handleCellClick(r, c));
      }

      boardEl.appendChild(cell);
    }
  }
}

function renderRack() {
  const rackEl = document.getElementById('rack');
  rackEl.innerHTML = '';

  const player = state.players[state.currentPlayer];
  if (!player) return;

  // Build display rack: current rack minus tiles that are placed on board
  const placedRackIndices = new Set(placedTiles.map(t => t.rackIndex));

  for (let i = 0; i < player.rack.length; i++) {
    if (placedRackIndices.has(i)) continue; // Don't show tiles already placed on board

    const tile = player.rack[i];
    const tileEl = document.createElement('div');
    tileEl.className = 'rack-tile';

    if (exchangeMode && exchangeSelected.has(i)) {
      tileEl.classList.add('exchange-selected');
    } else if (selectedRackIndex === i) {
      tileEl.classList.add('selected');
    }

    const isBlank = tile === '?';
    const letter = isBlank ? ' ' : tile;
    const value = isBlank ? 0 : TILE_VALUES[tile];

    tileEl.innerHTML = `<span class="tile-letter">${letter}</span><span class="tile-value">${value}</span>`;
    tileEl.addEventListener('click', () => handleRackClick(i));
    rackEl.appendChild(tileEl);
  }
}

function renderScoreboard() {
  for (let i = 0; i < 2; i++) {
    const el = document.getElementById(`player${i}-score`);
    const nameEl = el.querySelector('.name');
    const scoreEl = el.querySelector('.score');
    nameEl.textContent = state.players[i].name;
    scoreEl.textContent = state.players[i].score;
    el.classList.toggle('active', i === state.currentPlayer && !state.gameOver);
  }

  document.getElementById('bag-count').textContent = `Bag: ${state.bag.length} tiles`;
  document.getElementById('turn-indicator').textContent = state.gameOver
    ? 'Game Over'
    : `Turn ${state.turnNumber}: ${state.players[state.currentPlayer].name}`;
}

function renderGameOver() {
  const banner = document.getElementById('game-over-banner');
  if (state.gameOver) {
    banner.style.display = 'flex';
    const winText = state.winner >= 0
      ? `${state.players[state.winner].name} Wins!`
      : "It's a Tie!";
    banner.querySelector('h2').textContent = winText;
    banner.querySelector('.final-scores').textContent =
      `${state.players[0].name}: ${state.players[0].score} | ${state.players[1].name}: ${state.players[1].score}`;
  } else {
    banner.style.display = 'none';
  }
}

function renderAll() {
  renderBoard();
  renderRack();
  renderScoreboard();
  renderGameOver();
  updateButtonStates();
}

function updateButtonStates() {
  const isBot = state.players[state.currentPlayer].type === 'bot';
  const isOver = state.gameOver;

  document.getElementById('btn-play').disabled = isBot || isOver || placedTiles.length === 0;
  document.getElementById('btn-exchange').disabled = isBot || isOver;
  document.getElementById('btn-pass').disabled = isBot || isOver;
  document.getElementById('btn-shuffle').disabled = isBot || isOver;
  document.getElementById('btn-recall').disabled = isBot || isOver || placedTiles.length === 0;

  const banner = document.getElementById('exchange-banner');
  banner.style.display = exchangeMode ? 'block' : 'none';
}

function disableControls(disabled) {
  document.getElementById('btn-play').disabled = disabled;
  document.getElementById('btn-exchange').disabled = disabled;
  document.getElementById('btn-pass').disabled = disabled;
  document.getElementById('btn-shuffle').disabled = disabled;
  document.getElementById('btn-recall').disabled = disabled;
}

// ============================================================
// UI Event Handlers
// ============================================================

function handleRackClick(rackIndex) {
  if (state.gameOver) return;
  if (state.players[state.currentPlayer].type === 'bot') return;

  if (exchangeMode) {
    if (exchangeSelected.has(rackIndex)) {
      exchangeSelected.delete(rackIndex);
    } else {
      exchangeSelected.add(rackIndex);
    }
    renderRack();
    return;
  }

  if (selectedRackIndex === rackIndex) {
    selectedRackIndex = null;
  } else {
    selectedRackIndex = rackIndex;
  }
  renderRack();
}

function handleCellClick(r, c) {
  if (state.gameOver) return;
  if (state.players[state.currentPlayer].type === 'bot') return;
  if (exchangeMode) return;
  if (selectedRackIndex === null) return;
  if (state.board[r][c]) return;
  if (isJustPlaced(r, c)) return;

  const player = state.players[state.currentPlayer];
  const tile = player.rack[selectedRackIndex];

  if (tile === '?') {
    // Show blank tile letter picker
    showBlankPicker(r, c, selectedRackIndex);
    return;
  }

  placedTiles.push({
    row: r,
    col: c,
    letter: tile,
    rackIndex: selectedRackIndex,
    isBlank: false,
    blankLetter: null
  });

  selectedRackIndex = null;
  renderAll();
}

function returnPlacedTile(r, c) {
  if (state.gameOver) return;
  if (state.players[state.currentPlayer].type === 'bot') return;

  const idx = placedTiles.findIndex(t => t.row === r && t.col === c);
  if (idx >= 0) {
    placedTiles.splice(idx, 1);
    renderAll();
  }
}

function recallTiles() {
  placedTiles = [];
  selectedRackIndex = null;
  renderAll();
}

function shuffleRack() {
  const player = state.players[state.currentPlayer];
  // Recall placed tiles so rack indices don't go stale after shuffle
  placedTiles = [];
  selectedRackIndex = null;
  shuffle(player.rack);
  renderAll();
}

function toggleExchangeMode() {
  if (state.gameOver) return;
  if (placedTiles.length > 0) {
    alert('Recall your tiles from the board first.');
    return;
  }
  exchangeMode = !exchangeMode;
  exchangeSelected.clear();
  selectedRackIndex = null;

  if (exchangeMode) {
    document.getElementById('btn-exchange').textContent = 'Confirm Exchange';
  } else {
    document.getElementById('btn-exchange').textContent = 'Exchange';
  }

  renderAll();
}

function handleExchangeOrToggle() {
  if (exchangeMode) {
    // Confirm the exchange
    if (exchangeSelected.size === 0) {
      alert('Select tiles to exchange by clicking them, then press Confirm Exchange.');
      return;
    }
    const success = executeExchange(exchangeSelected);
    if (success) {
      exchangeMode = false;
      document.getElementById('btn-exchange').textContent = 'Exchange';
    }
  } else {
    toggleExchangeMode();
  }
}

function handlePlay() {
  if (exchangeMode) return;
  if (placedTiles.length === 0) return;
  executePlay();
}

function handlePass() {
  if (exchangeMode) {
    exchangeMode = false;
    document.getElementById('btn-exchange').textContent = 'Exchange';
    exchangeSelected.clear();
    renderAll();
    return;
  }
  if (placedTiles.length > 0) {
    if (!confirm('You have tiles on the board. Pass anyway? (tiles will be returned to your rack)')) return;
    recallTiles();
  }
  executePass();
}

// ============================================================
// Blank Tile Picker
// ============================================================

function showBlankPicker(row, col, rackIndex) {
  const modal = document.getElementById('blank-modal');
  const grid = document.getElementById('blank-letter-grid');
  grid.innerHTML = '';

  for (let i = 65; i <= 90; i++) {
    const ch = String.fromCharCode(i);
    const btn = document.createElement('button');
    btn.textContent = ch;
    btn.addEventListener('click', () => {
      placedTiles.push({
        row, col,
        letter: '?',
        rackIndex,
        isBlank: true,
        blankLetter: ch
      });
      selectedRackIndex = null;
      closeModal('blank-modal');
      renderAll();
    });
    grid.appendChild(btn);
  }

  openModal('blank-modal');
}

// ============================================================
// Modal Helpers
// ============================================================

function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// ============================================================
// Game Log
// ============================================================

function addLog(msg) {
  const logEl = document.getElementById('game-log');
  if (!logEl) return;
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = msg;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
}

function toggleLog() {
  const logEl = document.getElementById('game-log');
  logCollapsed = !logCollapsed;
  logEl.style.display = logCollapsed ? 'none' : 'block';
}

// ============================================================
// New Game / Setup
// ============================================================

function startNewGame() {
  if (state && !state.gameOver) {
    if (!confirm('Start a new game? Current game will be lost unless saved.')) return;
  }

  document.getElementById('setup-screen').style.display = 'flex';
  document.getElementById('game-container').style.display = 'none';
}

function initGame() {
  const p1Name = document.getElementById('p1-name').value.trim() || 'Player 1';
  const p1Type = document.getElementById('p1-type').value;
  const p2Name = document.getElementById('p2-name').value.trim() || 'Player 2';
  const p2Type = document.getElementById('p2-type').value;

  state = newGameState(p1Name, p1Type, p2Name, p2Type);

  document.getElementById('setup-screen').style.display = 'none';
  document.getElementById('game-container').style.display = 'flex';

  addLog('New game started!');
  addLog(`${state.players[0].name} (${state.players[0].type}) vs ${state.players[1].name} (${state.players[1].type})`);

  renderAll();

  if (state.players[0].type === 'bot') {
    disableControls(true);
    setTimeout(() => botTurn(), 500);
  }
}

// ============================================================
// Initialization
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  loadDictionary();

  // Setup screen
  document.getElementById('btn-start-game').addEventListener('click', initGame);

  // Game controls
  document.getElementById('btn-play').addEventListener('click', handlePlay);
  document.getElementById('btn-exchange').addEventListener('click', handleExchangeOrToggle);
  document.getElementById('btn-pass').addEventListener('click', handlePass);
  document.getElementById('btn-shuffle').addEventListener('click', shuffleRack);
  document.getElementById('btn-recall').addEventListener('click', recallTiles);
  document.getElementById('btn-save').addEventListener('click', saveGame);
  document.getElementById('btn-load').addEventListener('click', showLoadDialog);
  document.getElementById('btn-new-game').addEventListener('click', startNewGame);

  // Log toggle
  document.getElementById('log-header').addEventListener('click', toggleLog);

  // Modal close buttons
  document.getElementById('blank-modal-close').addEventListener('click', () => closeModal('blank-modal'));
  document.getElementById('load-modal-close').addEventListener('click', () => closeModal('load-modal'));

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Check if there are any saved games for the load button on setup
  document.getElementById('btn-load-setup').addEventListener('click', () => {
    showLoadDialog();
  });
});
