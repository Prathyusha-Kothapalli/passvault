const test = require('node:test');
const assert = require('node:assert');
const cryptoService = require('../server/services/cryptoService');
const { generateToken, JWT_SECRET } = require('../server/middleware/auth');
const jwt = require('jsonwebtoken');

test('Authentication Test Suite', async (t) => {
  await t.test('hashPassword & comparePassword verify correct bcrypt hashes', async () => {
    const rawPassword = 'Demo@123';
    const hash = await cryptoService.hashPassword(rawPassword);
    
    assert.ok(hash !== rawPassword, 'Hash should not match raw password');
    assert.strictEqual(await cryptoService.comparePassword(rawPassword, hash), true, 'Password match should be true');
    assert.strictEqual(await cryptoService.comparePassword('WrongPassword', hash), false, 'Incorrect password should fail');
  });

  await t.test('JWT token generation and verification', () => {
    const mockUser = { id: 101, email: 'demo@passvault.com' };
    const token = generateToken(mockUser);
    
    assert.ok(token, 'Token should be generated string');

    const decoded = jwt.verify(token, JWT_SECRET);
    assert.strictEqual(decoded.id, 101);
    assert.strictEqual(decoded.email, 'demo@passvault.com');
  });
});
