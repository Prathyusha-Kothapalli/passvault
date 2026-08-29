const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

const { initDatabase } = require('./config/database');
const { seedDemoAccount } = require('./services/seedService');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const vaultRoutes = require('./routes/vaultRoutes');
const noteRoutes = require('./routes/noteRoutes');
const auditRoutes = require('./routes/auditRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const backupRoutes = require('./routes/backupRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Parsing Middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts/styles for single page app
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '../client')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    name: 'PassVault Security Server',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/backup', backupRoutes);

// SPA fallback to client/index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Global Error Handler
app.use(errorHandler);

// Initialize DB and start server
async function startServer() {
  try {
    await initDatabase();
    await seedDemoAccount();

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` PassVault Security Manager running on port ${PORT}`);
      console.log(` Web App: http://localhost:${PORT}`);
      console.log(` Demo Account: demo@passvault.com / Demo@123`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Fatal server startup error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
