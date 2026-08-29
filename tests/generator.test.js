const test = require('node:test');
const assert = require('node:assert');

// Node.js simulation of password generation logic
function generateTestPassword(length = 16, uppercase = true, lowercase = true, numbers = true, symbols = true) {
  let lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  let upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let numberChars = '0123456789';
  let symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let charPool = '';
  if (lowercase) charPool += lowerChars;
  if (uppercase) charPool += upperChars;
  if (numbers) charPool += numberChars;
  if (symbols) charPool += symbolChars;

  let pwd = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * charPool.length);
    pwd += charPool[idx];
  }
  return pwd;
}

test('Password Generator Test Suite', async (t) => {
  await t.test('Generates password of exact requested length', () => {
    const pwd16 = generateTestPassword(16);
    assert.strictEqual(pwd16.length, 16);

    const pwd32 = generateTestPassword(32);
    assert.strictEqual(pwd32.length, 32);
  });

  await t.test('Respects character set options', () => {
    const pwdNumbersOnly = generateTestPassword(20, false, false, true, false);
    assert.match(pwdNumbersOnly, /^[0-9]+$/);
  });
});
