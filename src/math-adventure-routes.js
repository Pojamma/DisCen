const express = require('express');
const router = express.Router();
const { getData, saveData, getUserById, generateId, hashPassword, verifyPassword } = require('./math-adventure-data');

// ── Session Management ──────────────────────────────────────────────
const sessions = new Map(); // token → { type: 'admin'|'user', userId?, expiresAt }
const SESSION_TTL = 2 * 60 * 60 * 1000; // 2 hours

function createSession(type, userId) {
  const token = generateId();
  sessions.set(token, {
    type,
    userId: userId || null,
    expiresAt: Date.now() + SESSION_TTL
  });
  return token;
}

function getSession(token) {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  // Refresh expiry on use
  session.expiresAt = Date.now() + SESSION_TTL;
  return session;
}

// Clean up expired sessions every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (now > session.expiresAt) sessions.delete(token);
  }
}, 10 * 60 * 1000);

// ── Rate Limiting ───────────────────────────────────────────────────
const loginAttempts = new Map(); // ip → { count, resetAt }
const MAX_ATTEMPTS = 10;
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

// ── Middleware ───────────────────────────────────────────────────────
function requireAuth(type) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const token = authHeader.slice(7);
    const session = getSession(token);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    if (type === 'admin' && session.type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    if (type === 'user' && session.type !== 'admin' && session.type !== 'user') {
      return res.status(403).json({ error: 'Access denied' });
    }
    req.session = session;
    next();
  };
}

// ── Auth Routes ─────────────────────────────────────────────────────

// Check if master password is set
router.get('/auth/status', (req, res) => {
  const data = getData();
  res.json({ initialized: !!data.masterPassword });
});

// Set master password (first run only)
router.post('/auth/setup-master', (req, res) => {
  const data = getData();
  if (data.masterPassword) {
    return res.status(400).json({ error: 'Master password already set' });
  }
  const { password } = req.body;
  if (!password || password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }
  const { hash, salt } = hashPassword(password);
  data.masterPassword = { hash, salt };
  saveData(data);
  const token = createSession('admin');
  res.json({ success: true, token });
});

// Verify master password
router.post('/auth/verify-master', (req, res) => {
  if (!checkRateLimit(req.ip)) {
    return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  }
  const data = getData();
  if (!data.masterPassword) {
    return res.status(400).json({ error: 'Master password not set' });
  }
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }
  try {
    if (!verifyPassword(password, data.masterPassword.hash, data.masterPassword.salt)) {
      return res.status(401).json({ error: 'Incorrect password' });
    }
  } catch (e) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  const token = createSession('admin');
  res.json({ success: true, token });
});

// Change master password
router.post('/auth/change-master', requireAuth('admin'), (req, res) => {
  const data = getData();
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both current and new passwords required' });
  }
  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters' });
  }
  try {
    if (!verifyPassword(currentPassword, data.masterPassword.hash, data.masterPassword.salt)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
  } catch (e) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  const { hash, salt } = hashPassword(newPassword);
  data.masterPassword = { hash, salt };
  saveData(data);
  res.json({ success: true });
});

// User login
router.post('/auth/login', (req, res) => {
  if (!checkRateLimit(req.ip)) {
    return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  }
  const data = getData();
  const { userId, password } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ error: 'User ID and password required' });
  }
  const user = getUserById(data, userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  try {
    if (!verifyPassword(password, user.password.hash, user.password.salt)) {
      return res.status(401).json({ error: 'Incorrect password' });
    }
  } catch (e) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  const token = createSession('user', userId);
  // Return user data (without password hash)
  const { password: pw, ...userData } = user;
  res.json({ success: true, token, user: userData, passwordResetRequired: !!user.passwordResetRequired });
});

// Change user password (user sets their own new password after reset)
router.post('/users/:id/change-password', requireAuth('user'), (req, res) => {
  const data = getData();
  const user = getUserById(data, req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  // Only allow if admin or same user
  if (req.session.type !== 'admin' && req.session.userId !== req.params.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 2) {
    return res.status(400).json({ error: 'Password must be at least 2 characters' });
  }
  const { hash, salt } = hashPassword(newPassword);
  user.password = { hash, salt };
  user.passwordResetRequired = false;
  saveData(data);
  const { password: pw, ...userData } = user;
  res.json({ success: true, user: userData });
});

// ── User Routes ─────────────────────────────────────────────────────

// List users (public - for selection screen)
router.get('/users', (req, res) => {
  const data = getData();
  const users = data.users.map(u => ({
    id: u.id,
    username: u.username,
    avatar: u.avatar
  }));
  res.json(users);
});

// Create user (admin only)
router.post('/users', requireAuth('admin'), (req, res) => {
  const data = getData();
  const { username, password, avatar } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  if (password.length < 2) {
    return res.status(400).json({ error: 'Password must be at least 2 characters' });
  }
  // Check for duplicate username
  if (data.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  const { hash, salt } = hashPassword(password);
  const newUser = {
    id: generateId(),
    username,
    password: { hash, salt },
    avatar: avatar || '🦊',
    coins: 0,
    stats: {
      totalProblems: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalCoinsEarned: 0,
      problemsByOperation: { addition: 0, subtraction: 0, multiplication: 0, division: 0 },
      correctByOperation: { addition: 0, subtraction: 0, multiplication: 0, division: 0 },
      dailyActivity: {},
      bonusRoundsCompleted: 0,
      dailyChallengesCompleted: 0
    },
    badges: [],
    purchasedPrizes: [],
    settings: {
      operations: ['addition', 'subtraction'],
      ageGroup: '3-5',
      soundEnabled: true
    },
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString()
  };
  data.users.push(newUser);
  saveData(data);
  const { password: pw, ...userData } = newUser;
  res.status(201).json(userData);
});

// Get full user data
router.get('/users/:id', requireAuth('user'), (req, res) => {
  const data = getData();
  const user = getUserById(data, req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  // Only allow if admin or same user
  if (req.session.type !== 'admin' && req.session.userId !== req.params.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { password, ...userData } = user;
  res.json(userData);
});

// Update user data
router.put('/users/:id', requireAuth('user'), (req, res) => {
  const data = getData();
  const userIdx = data.users.findIndex(u => u.id === req.params.id);
  if (userIdx === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  // Only allow if admin or same user
  if (req.session.type !== 'admin' && req.session.userId !== req.params.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const updates = req.body;
  const user = data.users[userIdx];

  // Allowed fields to update
  if (updates.coins !== undefined) user.coins = updates.coins;
  if (updates.stats) user.stats = { ...user.stats, ...updates.stats };
  if (updates.badges) user.badges = updates.badges;
  if (updates.settings) user.settings = { ...user.settings, ...updates.settings };
  if (updates.avatar) user.avatar = updates.avatar;
  if (updates.username && req.session.type === 'admin') user.username = updates.username;
  user.lastActive = new Date().toISOString();

  data.users[userIdx] = user;
  saveData(data);
  const { password, ...userData } = user;
  res.json(userData);
});

// Delete user (admin only)
router.delete('/users/:id', requireAuth('admin'), (req, res) => {
  const data = getData();
  const idx = data.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  data.users.splice(idx, 1);
  saveData(data);
  res.json({ success: true });
});

// Reset user password (admin only) - forces new password on next login
router.post('/users/:id/reset-password', requireAuth('admin'), (req, res) => {
  const data = getData();
  const user = getUserById(data, req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  user.passwordResetRequired = true;
  saveData(data);
  res.json({ success: true });
});

// Reset user progress (admin only)
router.post('/users/:id/reset', requireAuth('admin'), (req, res) => {
  const data = getData();
  const user = getUserById(data, req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  user.coins = 0;
  user.stats = {
    totalProblems: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalCoinsEarned: 0,
    problemsByOperation: { addition: 0, subtraction: 0, multiplication: 0, division: 0 },
    correctByOperation: { addition: 0, subtraction: 0, multiplication: 0, division: 0 },
    dailyActivity: {},
    bonusRoundsCompleted: 0,
    dailyChallengesCompleted: 0
  };
  user.badges = [];
  user.purchasedPrizes = [];
  saveData(data);
  const { password, ...userData } = user;
  res.json(userData);
});

// Purchase a prize
router.post('/users/:id/purchase', requireAuth('user'), (req, res) => {
  const data = getData();
  const user = getUserById(data, req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (req.session.type !== 'admin' && req.session.userId !== req.params.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { prizeId } = req.body;
  const prize = data.prizes.find(p => p.id === prizeId);
  if (!prize) {
    return res.status(404).json({ error: 'Prize not found' });
  }
  if (!prize.active) {
    return res.status(400).json({ error: 'Prize is no longer available' });
  }
  if (user.coins < prize.cost) {
    return res.status(400).json({ error: 'Not enough coins' });
  }
  user.coins -= prize.cost;
  user.purchasedPrizes.push({
    prizeId: prize.id,
    name: prize.name,
    emoji: prize.emoji,
    cost: prize.cost,
    purchasedAt: new Date().toISOString(),
    fulfilled: false
  });
  saveData(data);
  const { password, ...userData } = user;
  res.json(userData);
});

// ── Prize Routes ────────────────────────────────────────────────────

// List all prizes (public)
router.get('/prizes', (req, res) => {
  const data = getData();
  res.json(data.prizes.filter(p => p.active));
});

// Add prize (admin only)
router.post('/prizes', requireAuth('admin'), (req, res) => {
  const data = getData();
  const { name, description, cost, emoji } = req.body;
  if (!name || !cost) {
    return res.status(400).json({ error: 'Name and cost required' });
  }
  const prize = {
    id: 'prize-' + generateId().slice(0, 8),
    name,
    description: description || '',
    cost: Number(cost),
    emoji: emoji || '🎁',
    active: true
  };
  data.prizes.push(prize);
  saveData(data);
  res.status(201).json(prize);
});

// Edit prize (admin only)
router.put('/prizes/:id', requireAuth('admin'), (req, res) => {
  const data = getData();
  const prize = data.prizes.find(p => p.id === req.params.id);
  if (!prize) {
    return res.status(404).json({ error: 'Prize not found' });
  }
  const updates = req.body;
  if (updates.name !== undefined) prize.name = updates.name;
  if (updates.description !== undefined) prize.description = updates.description;
  if (updates.cost !== undefined) prize.cost = Number(updates.cost);
  if (updates.emoji !== undefined) prize.emoji = updates.emoji;
  if (updates.active !== undefined) prize.active = updates.active;
  saveData(data);
  res.json(prize);
});

// Delete prize (admin only)
router.delete('/prizes/:id', requireAuth('admin'), (req, res) => {
  const data = getData();
  const idx = data.prizes.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Prize not found' });
  }
  data.prizes.splice(idx, 1);
  saveData(data);
  res.json({ success: true });
});

// Mark prize fulfilled (admin only)
router.post('/users/:userId/prizes/:prizeIdx/fulfill', requireAuth('admin'), (req, res) => {
  const data = getData();
  const user = getUserById(data, req.params.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const idx = parseInt(req.params.prizeIdx, 10);
  if (isNaN(idx) || idx < 0 || idx >= user.purchasedPrizes.length) {
    return res.status(404).json({ error: 'Prize purchase not found' });
  }
  user.purchasedPrizes[idx].fulfilled = true;
  user.purchasedPrizes[idx].fulfilledAt = new Date().toISOString();
  saveData(data);
  res.json({ success: true });
});

// ── Admin Routes ────────────────────────────────────────────────────

// Stats dashboard
router.get('/admin/stats', requireAuth('admin'), (req, res) => {
  const data = getData();
  const stats = data.users.map(u => ({
    id: u.id,
    username: u.username,
    avatar: u.avatar,
    coins: u.coins,
    stats: u.stats,
    badges: u.badges.length,
    purchasedPrizes: u.purchasedPrizes.length,
    lastActive: u.lastActive
  }));
  res.json({
    totalUsers: data.users.length,
    totalPrizes: data.prizes.length,
    users: stats
  });
});

// Pending prizes
router.get('/admin/pending-prizes', requireAuth('admin'), (req, res) => {
  const data = getData();
  const pending = [];
  data.users.forEach(u => {
    u.purchasedPrizes.forEach((p, idx) => {
      if (!p.fulfilled) {
        pending.push({
          userId: u.id,
          username: u.username,
          avatar: u.avatar,
          prizeIdx: idx,
          ...p
        });
      }
    });
  });
  res.json(pending);
});

// Export data
router.get('/admin/export', requireAuth('admin'), (req, res) => {
  const data = getData();
  res.json(data);
});

// Import data
router.post('/admin/import', requireAuth('admin'), (req, res) => {
  const importData = req.body;
  if (!importData || !importData.version) {
    return res.status(400).json({ error: 'Invalid data format' });
  }
  saveData(importData);
  res.json({ success: true });
});

// Nuclear reset
router.post('/admin/reset', requireAuth('admin'), (req, res) => {
  const data = getData();
  const { confirmPassword } = req.body;
  if (!confirmPassword) {
    return res.status(400).json({ error: 'Password confirmation required' });
  }
  try {
    if (!verifyPassword(confirmPassword, data.masterPassword.hash, data.masterPassword.salt)) {
      return res.status(401).json({ error: 'Incorrect password' });
    }
  } catch (e) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  // Keep master password, reset everything else
  const resetData = {
    masterPassword: data.masterPassword,
    users: [],
    prizes: require('./math-adventure-data').DEFAULT_PRIZES,
    createdAt: data.createdAt,
    resetAt: new Date().toISOString(),
    version: 1
  };
  saveData(resetData);
  res.json({ success: true });
});

module.exports = router;
