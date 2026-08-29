const { all, get, run } = require('../config/database');

async function getAllItems(req, res, next) {
  try {
    const userId = req.user.id;
    const { category, is_favorite, search, sort } = req.query;

    let query = 'SELECT * FROM vault_items WHERE user_id = ?';
    const params = [userId];

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (is_favorite === 'true' || is_favorite === '1') {
      query += ' AND is_favorite = 1';
    }

    if (search) {
      query += ' AND (title LIKE ? OR username LIKE ? OR url LIKE ? OR tags LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (sort === 'title') {
      query += ' ORDER BY title ASC';
    } else if (sort === 'updated') {
      query += ' ORDER BY updated_at DESC';
    } else {
      query += ' ORDER BY created_at DESC';
    }

    const items = await all(query, params);
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

async function getItemById(req, res, next) {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;

    const item = await get('SELECT * FROM vault_items WHERE id = ? AND user_id = ?', [itemId, userId]);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Vault entry not found.' });
    }

    // Log audit for password access
    await run(
      'INSERT INTO audit_logs (user_id, event_type, description, status) VALUES (?, ?, ?, ?)',
      [userId, 'VAULT_ACCESS', `Accessed vault entry: ${item.title}`, 'SUCCESS']
    );

    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

async function createItem(req, res, next) {
  try {
    const userId = req.user.id;
    const { title, username, encrypted_password, url, category, tags, is_favorite, notes } = req.body;

    if (!title || !username || !encrypted_password) {
      return res.status(400).json({
        success: false,
        error: 'Title, username, and encrypted_password are required fields.'
      });
    }

    const result = await run(
      `INSERT INTO vault_items 
       (user_id, title, username, encrypted_password, url, category, tags, is_favorite, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        title.trim(),
        username.trim(),
        encrypted_password,
        url ? url.trim() : '',
        category || 'General',
        tags || '',
        is_favorite ? 1 : 0,
        notes || ''
      ]
    );

    const newItem = await get('SELECT * FROM vault_items WHERE id = ?', [result.lastID]);

    // Audit log
    await run(
      'INSERT INTO audit_logs (user_id, event_type, description, status) VALUES (?, ?, ?, ?)',
      [userId, 'VAULT_CREATE', `Created vault entry: ${title}`, 'SUCCESS']
    );

    res.status(201).json({ success: true, item: newItem });
  } catch (err) {
    next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    const { title, username, encrypted_password, url, category, tags, is_favorite, notes } = req.body;

    const existing = await get('SELECT * FROM vault_items WHERE id = ? AND user_id = ?', [itemId, userId]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Vault entry not found.' });
    }

    await run(
      `UPDATE vault_items 
       SET title = ?, username = ?, encrypted_password = ?, url = ?, category = ?, tags = ?, is_favorite = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        title !== undefined ? title.trim() : existing.title,
        username !== undefined ? username.trim() : existing.username,
        encrypted_password !== undefined ? encrypted_password : existing.encrypted_password,
        url !== undefined ? url.trim() : existing.url,
        category !== undefined ? category : existing.category,
        tags !== undefined ? tags : existing.tags,
        is_favorite !== undefined ? (is_favorite ? 1 : 0) : existing.is_favorite,
        notes !== undefined ? notes : existing.notes,
        itemId,
        userId
      ]
    );

    const updated = await get('SELECT * FROM vault_items WHERE id = ?', [itemId]);

    await run(
      'INSERT INTO audit_logs (user_id, event_type, description, status) VALUES (?, ?, ?, ?)',
      [userId, 'VAULT_UPDATE', `Updated vault entry: ${updated.title}`, 'SUCCESS']
    );

    res.json({ success: true, item: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteItem(req, res, next) {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;

    const existing = await get('SELECT * FROM vault_items WHERE id = ? AND user_id = ?', [itemId, userId]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Vault entry not found.' });
    }

    await run('DELETE FROM vault_items WHERE id = ? AND user_id = ?', [itemId, userId]);

    await run(
      'INSERT INTO audit_logs (user_id, event_type, description, status) VALUES (?, ?, ?, ?)',
      [userId, 'VAULT_DELETE', `Deleted vault entry: ${existing.title}`, 'SUCCESS']
    );

    res.json({ success: true, message: 'Vault entry deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

async function toggleFavorite(req, res, next) {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;

    const existing = await get('SELECT * FROM vault_items WHERE id = ? AND user_id = ?', [itemId, userId]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Vault entry not found.' });
    }

    const newFav = existing.is_favorite ? 0 : 1;
    await run('UPDATE vault_items SET is_favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newFav, itemId]);

    res.json({ success: true, is_favorite: newFav });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  toggleFavorite
};
