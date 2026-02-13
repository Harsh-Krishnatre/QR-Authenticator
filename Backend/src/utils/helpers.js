const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const settings = require('../config/settings');
const logger = require('./logger');

class Helpers {
  constructor() {
    this.settings = settings;
  }

  async hashData(data, saltRounds = parseInt(this.settings.BCRYPT_SALT_ROUNDS, 10) || 12) {
    try {
      if (!data || typeof data !== 'string') throw new Error('Data must be a non-empty string');
      const salt = await bcrypt.genSalt(saltRounds);
      return await bcrypt.hash(data, salt);
    } catch (error) {
      logger.error('Hashing error:', error.message);
      throw new Error('Failed to hash data');
    }
  }

  async compareData(plaintext, hashed) {
    try {
      if (!plaintext || !hashed) return false;
      return await bcrypt.compare(plaintext, hashed);
    } catch (error) {
      logger.error('Comparison error:', error.message);
      return false;
    }
  }

  generateSecureRandom(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  generateSecretCode() {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return crypto.createHash('sha256').update(`${timestamp}_${randomBytes}`).digest('hex');
  }

  async hashPattern(pattern) {
    if (!Array.isArray(pattern)) throw new Error('Pattern must be an array');
    const sorted = pattern.slice().sort((a, b) => {
      if (a.number !== b.number) return a.number - b.number;
      return a.color.localeCompare(b.color);
    });
    const patternString = JSON.stringify(sorted);
    return this.hashData(patternString);
  }

  async verifyPattern(pattern, hashedPattern) {
    try {
      if (!Array.isArray(pattern) || !hashedPattern) return false;
      const sorted = pattern.slice().sort((a, b) => {
        if (a.number !== b.number) return a.number - b.number;
        return a.color.localeCompare(b.color);
      });
      const patternString = JSON.stringify(sorted);
      return this.compareData(patternString, hashedPattern);
    } catch (error) {
      logger.error('Pattern verification error:', error.message);
      return false;
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  validatePattern(pattern) {
    const result = { isValid: true, errors: [] };
    if (!Array.isArray(pattern)) {
      result.isValid = false;
      result.errors.push('Pattern must be an array');
      return result;
    }

    if (pattern.length < 4 || pattern.length > 8) {
      result.isValid = false;
      result.errors.push('Pattern must have between 4 and 8 elements');
    }

    const validColors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'cyan'];
    const validNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    pattern.forEach((element, index) => {
      if (!element || typeof element !== 'object') {
        result.isValid = false;
        result.errors.push(`Element ${index + 1} must be an object`);
        return;
      }
      if (!validNumbers.includes(element.number)) {
        result.isValid = false;
        result.errors.push(`Element ${index + 1} has invalid number`);
      }
      if (!validColors.includes(element.color)) {
        result.isValid = false;
        result.errors.push(`Element ${index + 1} has invalid color`);
      }
    });

    return result;
  }

  sanitizeInput(input, maxLength = 1000) {
    if (typeof input !== 'string') return '';
    const cleaned = input.trim().slice(0, maxLength).replace(/[<>]/g, '');
    const withoutJsProto = cleaned.replace(/javascript:/gi, '');
    return withoutJsProto.replace(/on\w+=/gi, '');
  }
}

const helpers = new Helpers();

module.exports = {
  hashingUtils: {
    hashData: helpers.hashData.bind(helpers),
    compareData: helpers.compareData.bind(helpers),
    generateSecureRandom: helpers.generateSecureRandom.bind(helpers),
    generateSecretCode: helpers.generateSecretCode.bind(helpers),
    hashPattern: helpers.hashPattern.bind(helpers),
    verifyPattern: helpers.verifyPattern.bind(helpers),
  },
  validationUtils: {
    isValidEmail: helpers.isValidEmail.bind(helpers),
    validatePattern: helpers.validatePattern.bind(helpers),
    sanitizeInput: helpers.sanitizeInput.bind(helpers),
  },
};
