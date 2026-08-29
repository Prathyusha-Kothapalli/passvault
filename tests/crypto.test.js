const test = require('node:test');
const assert = require('node:assert');
const cryptoService = require('../server/services/cryptoService');

test('Crypto Service Test Suite', async (t) => {
  const masterSecret = 'demo@passvault.com:Demo@123';
  const plainText = 'SuperSecretBankPassword2026!';

  await t.test('AES-256-GCM encryption & decryption symmetry', () => {
    const encrypted = cryptoService.encrypt(plainText, masterSecret);
    assert.ok(encrypted.includes(':'), 'Encrypted string should be delimited by colons');

    const parts = encrypted.split(':');
    assert.strictEqual(parts.length, 4, 'Encrypted string must contain iv, authTag, encryptedHex, and salt');

    const decrypted = cryptoService.decrypt(encrypted, masterSecret);
    assert.strictEqual(decrypted, plainText, 'Decrypted text must match original plain text');
  });

  await t.test('Decryption with invalid passphrase fails', () => {
    const encrypted = cryptoService.encrypt(plainText, masterSecret);
    assert.throws(() => {
      cryptoService.decrypt(encrypted, 'WrongSecretPassphrase');
    }, 'Should throw error when decrypting with wrong secret');
  });
});
