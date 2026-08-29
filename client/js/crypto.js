/**
 * PassVault Web Crypto API Wrapper (AES-GCM-256, PBKDF2)
 * Zero-Knowledge Client-Side Encryption Utilities
 */

const CryptoUtil = (function() {
  const PBKDF2_ITERATIONS = 100000;
  const ALGORITHM = 'AES-GCM';
  const KEY_LENGTH = 256;

  /**
   * Derive Web Crypto CryptoKey from master secret and salt
   */
  async function deriveKey(masterSecret, saltBuffer) {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(masterSecret),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: ALGORITHM, length: KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt text using AES-256-GCM
   * Returns iv:authTag:encryptedHex:saltHex format matching server format
   */
  async function encryptText(text, masterSecret) {
    const encoder = new TextEncoder();
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveKey(masterSecret, salt);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: ALGORITHM, iv: iv },
      key,
      encoder.encode(text)
    );

    const encryptedArray = new Uint8Array(encryptedBuffer);
    // GCM tag is the last 16 bytes of Web Crypto cipher text
    const dataBytes = encryptedArray.slice(0, encryptedArray.length - 16);
    const tagBytes = encryptedArray.slice(encryptedArray.length - 16);

    const ivHex = buf2hex(iv);
    const tagHex = buf2hex(tagBytes);
    const dataHex = buf2hex(dataBytes);
    const saltHex = buf2hex(salt);

    return `${ivHex}:${tagHex}:${dataHex}:${saltHex}`;
  }

  /**
   * Decrypt string formatted as iv:authTag:encryptedHex:saltHex
   */
  async function decryptText(encryptedString, masterSecret) {
    const parts = encryptedString.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted format');
    }

    const [ivHex, tagHex, dataHex, saltHex] = parts;
    const iv = hex2buf(ivHex);
    const tag = hex2buf(tagHex);
    const data = hex2buf(dataHex);
    const salt = hex2buf(saltHex);

    // Combine data and GCM tag back into single Uint8Array for Web Crypto API
    const cipherBytes = new Uint8Array(data.length + tag.length);
    cipherBytes.set(data, 0);
    cipherBytes.set(tag, data.length);

    const key = await deriveKey(masterSecret, salt);
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: ALGORITHM, iv: iv },
      key,
      cipherBytes
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }

  function buf2hex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function hex2buf(hexString) {
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
      bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
    }
    return bytes;
  }

  return {
    encryptText,
    decryptText
  };
})();
