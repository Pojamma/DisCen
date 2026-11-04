const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'math-adventure.json');

// Simple promise queue to prevent concurrent write corruption
let writeQueue = Promise.resolve();

function enqueue(fn) {
  writeQueue = writeQueue.then(fn, fn);
  return writeQueue;
}

const DEFAULT_PRIZES = [
  { id: 'prize-1', name: 'Sticker Sheet', description: 'A sheet of fun stickers!', cost: 50, emoji: '⭐', active: true },
  { id: 'prize-2', name: 'Extra Screen Time (15 min)', description: '15 extra minutes of screen time', cost: 100, emoji: '📱', active: true },
  { id: 'prize-3', name: 'Choose Dinner', description: 'You get to pick what\'s for dinner!', cost: 150, emoji: '🍕', active: true },
  { id: 'prize-4', name: 'Small Toy', description: 'Pick a small toy from the prize box', cost: 200, emoji: '🧸', active: true },
  { id: 'prize-5', name: 'Movie Night Pick', description: 'You choose the family movie!', cost: 250, emoji: '🎬', active: true },
  { id: 'prize-6', name: 'Ice Cream Trip', description: 'A trip to the ice cream shop!', cost: 500, emoji: '🍦', active: true }
];

function getDefaultData() {
  return {
    masterPassword: null,
    users: [],
    prizes: DEFAULT_PRIZES,
    createdAt: new Date().toISOString(),
    version: 1
  };
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getData() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    const defaultData = getDefaultData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
    return defaultData;
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

function saveData(data) {
  return enqueue(() => {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  });
}

function getUserById(data, id) {
  return data.users.find(u => u.id === id) || null;
}

function generateId() {
  return crypto.randomUUID();
}

// PBKDF2 password hashing
function hashPassword(password, existingSalt) {
  const salt = existingSalt || crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const result = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(result, 'hex'), Buffer.from(hash, 'hex'));
}

module.exports = {
  getData,
  saveData,
  getUserById,
  generateId,
  hashPassword,
  verifyPassword,
  DEFAULT_PRIZES
};
