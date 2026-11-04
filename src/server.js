const express = require('express');
const path = require('path');
require('dotenv').config();

const mathAdventureRoutes = require('./math-adventure-routes');

const app = express();
const PORT = process.env.PORT || 3001;

// JSON body parser (before static files so API routes work)
app.use(express.json({ limit: '5mb' }));

// Math Adventure API routes
app.use('/api/math-adventure', mathAdventureRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'websites')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
    console.log(`DisCen server running on http://localhost:${PORT}`);
});
