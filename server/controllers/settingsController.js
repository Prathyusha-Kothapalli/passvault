const { get, run } = require('../config/database');
const cryptoService = require('../services/cryptoService');

async function updateSettings(req, res, next) {
  try {
    const userId = req.user.id;
    const { theme_preference, autolock_timeout, clipboard_clear_seconds } = req.body;

    const existing = await get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const newTheme = theme_preference || existing.theme_preference;
    const newTimeout = autolock_timeout !== undefined ? parseInt(autolock_timeout) : existing.autolock_timeout;
    const newClipboard = clipboard_clear_seconds !== undefined ? parseInt(clipboard_clear_seconds) : existing.clipboard_clear_seconds;

    await run(
      'UPDATE users SET theme_preference = ?, autolock_timeout = ?, clipboard_clear_seconds = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newTheme, newTimeout, newClipboard, userId]
    );

    await run(
      'INSERT INTO audit_logs (user_id, event_type, description, status) VALUES (?, ?, ?, ?)',
      [userId, 'SETTINGS_UPDATE', 'Updated user settings and preferences', 'SUCCESS']
    );

    res.json({
      success: true,
      settings: {
        theme_preference: newTheme,
        autolock_timeout: newTimeout,
        clipboard_clear_seconds: newClipboard
      }
    });
  } catch (err) {
    next(err);
  }
}

async function changeMasterPassword(req, res, next) {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, error: 'Current password and new password are required.' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters long.' });
    }

    const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
    const isMatch = await cryptoService.comparePassword(current_password, user.password_hash);

    if (!isMatch) {
      await run(
        'INSERT INTO audit_logs (user_id, event_type, description, status) VALUES (?, ?, ?, ?)',
        [userId, 'PASSWORD_CHANGE', 'Failed master password update - incorrect current password', 'FAILED']
      );
      return res.status(401).json({ success: false, error: 'Incorrect current master password.' });
    }

    const newHash = await cryptoService.hashPassword(new_password);
    await run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newHash, userId]);

    await run(
      'INSERT INTO audit_logs (user_id, event_type, description, status) VALUES (?, ?, ?, ?)',
      [userId, 'PASSWORD_CHANGE', 'Successfully changed master password', 'SUCCESS']
    );

    res.json({ success: true, message: 'Master password updated successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  updateSettings,
  changeMasterPassword
};
