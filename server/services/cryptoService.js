const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12;  // 96 bits for GCM
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;
const AUTH_TAG_LENGTH = 16;

/**
 * Derive encryption key from user master key / secret using PBKDF2
 * @param {string} masterSecret 
 * @param {Buffer|string} salt 
 * @returns {Buffer} 32-byte derived key
 */
function deriveKey(masterSecret, salt) {
  const saltBuf = typeof salt === 'string' ? Buffer.from(salt, 'hex') : salt;
  return crypto.pbkdf2Sync(masterSecret, saltBuf, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt plain text using AES-256-GCM
 * @param {string} text 
 * @param {string|Buffer} key 
 * @returns {string} Formatted as iv:authTag:encryptedData:salt
 */
function encrypt(text, secretOrKey) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = typeof secretOrKey === 'string' ? deriveKey(secretOrKey, salt) : secretOrKey;
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}:${salt.toString('hex')}`;
}

/**
 * Decrypt string formatted as iv:authTag:encryptedData:salt
 * @param {string} encryptedString 
 * @param {string|Buffer} secretOrKey 
 * @returns {string} Decrypted text
 */
function decrypt(encryptedString, secretOrKey) {
  const parts = encryptedString.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted payload format');
  }

  const [ivHex, authTagHex, encryptedHex, saltHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const salt = Buffer.from(saltHex, 'hex');

  const key = typeof secretOrKey === 'string' ? deriveKey(secretOrKey, salt) : secretOrKey;

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Hash password securely with bcrypt
 * @param {string} password 
 * @returns {Promise<string>}
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password against hash
 * @param {string} password 
 * @param {string} hash 
 * @returns {Promise<boolean>}
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate secure random string
 * @param {number} length 
 * @returns {string}
 */
function generateRandomToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

module.exports = {
  deriveKey,
  encrypt,
  decrypt,
  hashPassword,
  comparePassword,
  generateRandomToken
};
