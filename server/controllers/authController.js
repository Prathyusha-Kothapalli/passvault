const { get, run } = require('../config/database');
const cryptoService = require('../services/cryptoService');
const { generateToken } = require('../middleware/auth');

async function register(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
    }

    const passwordHash = await cryptoService.hashPassword(password);
    const result = await run(
      'INSERT INTO users (email, password_hash, theme_preference, autolock_timeout) VALUES (?, ?, ?, ?)',
      [normalizedEmail, passwordHash, 'dark', 5]
    );

    const user = { id: result.lastID, email: normalizedEmail, theme_preference: 'dark', autolock_timeout: 5 };
    const token = generateToken(user);

    // Audit log
    await run(
      'INSERT INTO audit_logs (user_id, event_type, description, ip_address, status) VALUES (?, ?, ?, ?, ?)',
      [user.id, 'USER_REGISTER', 'User account registered', req.ip || '127.0.0.1', 'SUCCESS']
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        theme_preference: user.theme_preference,
        autolock_timeout: user.autolock_timeout,
        clipboard_clear_seconds: 30
      }
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await get('SELECT * FROM users WHERE email = ?', [normalizedEmail]);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or master password.' });
    }

    const isMatch = await cryptoService.comparePassword(password, user.password_hash);
    if (!isMatch) {
      // Audit log failed attempt
      await run(
        'INSERT INTO audit_logs (user_id, event_type, description, ip_address, status) VALUES (?, ?, ?, ?, ?)',
        [user.id, 'USER_LOGIN', 'Failed login attempt - incorrect password', req.ip || '127.0.0.1', 'FAILED']
      );
      return res.status(401).json({ success: false, error: 'Invalid email or master password.' });
    }

    const token = generateToken(user);

    // Audit log successful attempt
    await run(
      'INSERT INTO audit_logs (user_id, event_type, description, ip_address, status) VALUES (?, ?, ?, ?, ?)',
      [user.id, 'USER_LOGIN', 'User logged in successfully', req.ip || '127.0.0.1', 'SUCCESS']
    );

    res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        theme_preference: user.theme_preference,
        autolock_timeout: user.autolock_timeout,
        clipboard_clear_seconds: user.clipboard_clear_seconds || 30
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await get(
      'SELECT id, email, theme_preference, autolock_timeout, clipboard_clear_seconds, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    res.json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getMe
};
