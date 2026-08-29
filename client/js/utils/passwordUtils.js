/**
 * PassVault Password Strength & Entropy Utility
 */

const PasswordUtils = (function() {
  /**
   * Calculate password entropy (in bits)
   */
  function calculateEntropy(password) {
    if (!password) return 0;

    let poolSize = 0;
    if (/[a-z]/.test(password)) poolSize += 26;
    if (/[A-Z]/.test(password)) poolSize += 26;
    if (/[0-9]/.test(password)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

    if (poolSize === 0) return 0;
    return Math.round(password.length * Math.log2(poolSize));
  }

  /**
   * Evaluate password strength score (0 to 100) and details
   */
  function evaluateStrength(password) {
    if (!password) {
      return { score: 0, level: 'Very Weak', entropy: 0, warnings: ['Password is empty'] };
    }

    const entropy = calculateEntropy(password);
    const length = password.length;
    const warnings = [];

    // Pattern checks
    if (length < 8) warnings.push('Too short (minimum 8 characters required)');
    if (length < 12) warnings.push('Consider using 12+ characters for higher security');
    if (!/[A-Z]/.test(password)) warnings.push('Add uppercase letters (A-Z)');
    if (!/[a-z]/.test(password)) warnings.push('Add lowercase letters (a-z)');
    if (!/[0-9]/.test(password)) warnings.push('Add numbers (0-9)');
    if (!/[^a-zA-Z0-9]/.test(password)) warnings.push('Add special symbols (!@#$%^&*)');
    if (/(.)\1{2,}/.test(password)) warnings.push('Avoid repeating identical characters');
    if (/1234|abcd|qwerty|password|admin/i.test(password)) warnings.push('Contains common predictable patterns');

    // Score calculation (0 - 100)
    let score = Math.min(100, Math.round((entropy / 80) * 100));

    // Deductions for warnings
    if (length < 8) score = Math.min(score, 25);
    if (/1234|abcd|qwerty|password|admin/i.test(password)) score = Math.max(0, score - 30);

    let level = 'Very Weak';
    let color = 'var(--color-danger)';

    if (score >= 85) {
      level = 'Very Strong';
      color = 'var(--color-success)';
    } else if (score >= 70) {
      level = 'Strong';
      color = '#84cc16';
    } else if (score >= 50) {
      level = 'Fair';
      color = 'var(--color-warning)';
    } else if (score >= 30) {
      level = 'Weak';
      color = '#f97316';
    }

    return {
      score,
      level,
      color,
      entropy,
      length,
      warnings
    };
  }

  /**
   * Generate secure random password
   */
  function generatePassword(options = {}) {
    const {
      length = 16,
      uppercase = true,
      lowercase = true,
      numbers = true,
      symbols = true,
      excludeSimilar = false
    } = options;

    let lowerChars = 'abcdefghijklmnopqrstuvwxyz';
    let upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let numberChars = '0123456789';
    let symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (excludeSimilar) {
      lowerChars = lowerChars.replace(/[il]/g, '');
      upperChars = upperChars.replace(/[IO]/g, '');
      numberChars = numberChars.replace(/[01]/g, '');
    }

    let charPool = '';
    const requiredChars = [];

    if (lowercase) {
      charPool += lowerChars;
      requiredChars.push(getRandomChar(lowerChars));
    }
    if (uppercase) {
      charPool += upperChars;
      requiredChars.push(getRandomChar(upperChars));
    }
    if (numbers) {
      charPool += numberChars;
      requiredChars.push(getRandomChar(numberChars));
    }
    if (symbols) {
      charPool += symbolChars;
      requiredChars.push(getRandomChar(symbolChars));
    }

    if (!charPool) charPool = lowerChars;

    const remainingLength = Math.max(0, length - requiredChars.length);
    const randomChars = [];

    for (let i = 0; i < remainingLength; i++) {
      randomChars.push(getRandomChar(charPool));
    }

    const fullList = [...requiredChars, ...randomChars];
    // Shuffle array using Crypto random values
    for (let i = fullList.length - 1; i > 0; i--) {
      const j = getSecureRandomInt(0, i);
      [fullList[i], fullList[j]] = [fullList[j], fullList[i]];
    }

    return fullList.join('');
  }

  function getRandomChar(str) {
    const index = getSecureRandomInt(0, str.length - 1);
    return str[index];
  }

  function getSecureRandomInt(min, max) {
    const range = max - min + 1;
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return min + (array[0] % range);
  }

  return {
    calculateEntropy,
    evaluateStrength,
    generatePassword
  };
})();
