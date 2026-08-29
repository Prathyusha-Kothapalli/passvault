const { all, get, run } = require('../config/database');

async function getAllNotes(req, res, next) {
  try {
    const userId = req.user.id;
    const { search, is_favorite } = req.query;

    let query = 'SELECT * FROM secure_notes WHERE user_id = ?';
    const params = [userId];

    if (is_favorite === 'true' || is_favorite === '1') {
      query += ' AND is_favorite = 1';
    }

    if (search) {
      query += ' AND (title LIKE ? OR tags LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY updated_at DESC';

    const notes = await all(query, params);
    res.json({ success: true, notes });
  } catch (err) {
    next(err);
  }
}

async function getNoteById(req, res, next) {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;

    const note = await get('SELECT * FROM secure_notes WHERE id = ? AND user_id = ?', [noteId, userId]);
    if (!note) {
      return res.status(404).json({ success: false, error: 'Secure note not found.' });
    }

    await run(
      'INSERT INTO audit_logs (user_id, event_type, description, status) VALUES (?, ?, ?, ?)',
      [userId, 'NOTE_ACCESS', `Accessed secure note: ${note.title}`, 'SUCCESS']
    );

    res.json({ success: true, note });
  } catch (err) {
    next(err);
  }
}

async function createNote(req, res, next) {
  try {
    const userId = req.user.id;
    const { title, encrypted_content, tags, is_favorite } = req.body;

    if (!title || !encrypted_content) {
      return res.status(400).json({ success: false, error: 'Title and encrypted_content are required.' });
    }

    const result = await run(
      `INSERT INTO secure_notes (user_id, title, encrypted_content, tags, is_favorite) VALUES (?, ?, ?, ?, ?)`,
      [userId, title.trim(), encrypted_content, tags || '', is_favorite ? 1 : 0]
    );

    const newNote = await get('SELECT * FROM secure_notes WHERE id = ?', [result.lastID]);

    await run(
      'INSERT INTO audit_logs (user_id, event_type, description, status) VALUES (?, ?, ?, ?)',
      [userId, 'NOTE_CREATE', `Created secure note: ${title}`, 'SUCCESS']
    );

    res.status(201).json({ success: true, note: newNote });
  } catch (err) {
    next(err);
  }
}

async function updateNote(req, res, next) {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;
    const { title, encrypted_content, tags, is_favorite } = req.body;

    const existing = await get('SELECT * FROM secure_notes WHERE id = ? AND user_id = ?', [noteId, userId]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Secure note not found.' });
    }

    await run(
      `UPDATE secure_notes 
       SET title = ?, encrypted_content = ?, tags = ?, is_favorite = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        title !== undefined ? title.trim() : existing.title,
        encrypted_content !== undefined ? encrypted_content : existing.encrypted_content,
        tags !== undefined ? tags : existing.tags,
        is_favorite !== undefined ? (is_favorite ? 1 : 0) : existing.is_favorite,
        noteId,
        userId
      ]
    );

    const updated = await get('SELECT * FROM secure_notes WHERE id = ?', [noteId]);

    await run(
      'INSERT INTO audit_logs (user_id, event_type, description, status) VALUES (?, ?, ?, ?)',
      [userId, 'NOTE_UPDATE', `Updated secure note: ${updated.title}`, 'SUCCESS']
    );

    res.json({ success: true, note: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteNote(req, res, next) {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;

    const existing = await get('SELECT * FROM secure_notes WHERE id = ? AND user_id = ?', [noteId, userId]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Secure note not found.' });
    }

    await run('DELETE FROM secure_notes WHERE id = ? AND user_id = ?', [noteId, userId]);

    await run(
      'INSERT INTO audit_logs (user_id, event_type, description, status) VALUES (?, ?, ?, ?)',
      [userId, 'NOTE_DELETE', `Deleted secure note: ${existing.title}`, 'SUCCESS']
    );

    res.json({ success: true, message: 'Secure note deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote
};
