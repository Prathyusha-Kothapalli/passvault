const { all, run } = require('../config/database');

async function exportBackup(req, res, next) {
  try {
    const userId = req.user.id;

    const items = await all('SELECT title, username, encrypted_password, url, category, tags, is_favorite, notes, created_at FROM vault_items WHERE user_id = ?', [userId]);
    const notes = await all('SELECT title, encrypted_content, tags, is_favorite, created_at FROM secure_notes WHERE user_id = ?', [userId]);

    const backupPayload = {
      app: 'PassVault',
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      user_email: req.user.email,
      vault_items: items,
      secure_notes: notes
    };

    await run(
      'INSERT INTO audit_logs (user_id, event_type, description, status) VALUES (?, ?, ?, ?)',
      [userId, 'BACKUP_EXPORT', `Exported backup with ${items.length} passwords and ${notes.length} notes`, 'SUCCESS']
    );

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=passvault_backup_${Date.now()}.json`);
    res.json(backupPayload);
  } catch (err) {
    next(err);
  }
}

async function importBackup(req, res, next) {
  try {
    const userId = req.user.id;
    const { backup } = req.body;

    if (!backup || !backup.vault_items) {
      return res.status(400).json({ success: false, error: 'Invalid backup format. Missing vault_items.' });
    }

    let itemsImported = 0;
    let notesImported = 0;

    // Import vault items
    if (Array.isArray(backup.vault_items)) {
      for (const item of backup.vault_items) {
        if (item.title && item.username && item.encrypted_password) {
          await run(
            `INSERT INTO vault_items (user_id, title, username, encrypted_password, url, category, tags, is_favorite, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              userId,
              item.title,
              item.username,
              item.encrypted_password,
              item.url || '',
              item.category || 'General',
              item.tags || '',
              item.is_favorite ? 1 : 0,
              item.notes || ''
            ]
          );
          itemsImported++;
        }
      }
    }

    // Import secure notes
    if (Array.isArray(backup.secure_notes)) {
      for (const note of backup.secure_notes) {
        if (note.title && note.encrypted_content) {
          await run(
            `INSERT INTO secure_notes (user_id, title, encrypted_content, tags, is_favorite)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, note.title, note.encrypted_content, note.tags || '', note.is_favorite ? 1 : 0]
          );
          notesImported++;
        }
      }
    }

    await run(
      'INSERT INTO audit_logs (user_id, event_type, description, status) VALUES (?, ?, ?, ?)',
      [userId, 'BACKUP_IMPORT', `Restored ${itemsImported} vault items and ${notesImported} notes from backup`, 'SUCCESS']
    );

    res.json({
      success: true,
      message: `Backup imported successfully. Restored ${itemsImported} passwords and ${notesImported} notes.`,
      stats: { itemsImported, notesImported }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  exportBackup,
  importBackup
};
