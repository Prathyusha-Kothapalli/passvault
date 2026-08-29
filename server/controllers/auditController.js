const { all, run } = require('../config/database');

async function getLogs(req, res, next) {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 100;

    const logs = await all(
      'SELECT * FROM audit_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
      [userId, limit]
    );

    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
}

async function clearLogs(req, res, next) {
  try {
    const userId = req.user.id;
    await run('DELETE FROM audit_logs WHERE user_id = ?', [userId]);

    await run(
      'INSERT INTO audit_logs (user_id, event_type, description, status) VALUES (?, ?, ?, ?)',
      [userId, 'AUDIT_CLEAR', 'Cleared audit history logs', 'SUCCESS']
    );

    res.json({ success: true, message: 'Audit logs cleared successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLogs,
  clearLogs
};
