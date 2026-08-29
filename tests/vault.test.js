const test = require('node:test');
const assert = require('node:assert');
const { initDatabase, run, get, all } = require('../server/config/database');
const cryptoService = require('../server/services/cryptoService');

test('Vault Database & Seed Test Suite', async (t) => {
  await t.test('Initialize database tables and check seed capability', async () => {
    await initDatabase();
    
    // Check tables exist
    const userTable = await get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    assert.strictEqual(userTable.name, 'users');

    const vaultTable = await get("SELECT name FROM sqlite_master WHERE type='table' AND name='vault_items'");
    assert.strictEqual(vaultTable.name, 'vault_items');
  });

  await t.test('Insert and query encrypted vault entry', async () => {
    const testEmail = `test_${Date.now()}@passvault.com`;
    const masterSecret = `${testEmail}:Pass123`;
    const encryptedPassword = cryptoService.encrypt('Secret123!', masterSecret);

    const userRes = await run('INSERT INTO users (email, password_hash) VALUES (?, ?)', [testEmail, 'hash']);
    const userId = userRes.lastID;

    const itemRes = await run(
      'INSERT INTO vault_items (user_id, title, username, encrypted_password, category) VALUES (?, ?, ?, ?, ?)',
      [userId, 'Test App', 'testuser', encryptedPassword, 'Work']
    );

    const item = await get('SELECT * FROM vault_items WHERE id = ?', [itemRes.lastID]);
    assert.strictEqual(item.title, 'Test App');

    const decrypted = cryptoService.decrypt(item.encrypted_password, masterSecret);
    assert.strictEqual(decrypted, 'Secret123!');
  });
});
