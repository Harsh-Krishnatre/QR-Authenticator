const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

// Secure hashing utilities
const hashingUtils = {
  /**
   * Hash a password or sensitive data using bcrypt
   * @param {string} data - Data to hash
   * @param {number} saltRounds - Number of salt rounds (default: 12)
   * @returns {Promise<string>} Hashed data
   */
  async hashData(data, saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12) {
    try {
      if (!data || typeof data !== 'string') {
        throw new Error('Data must be a non-empty string');
      }
      
      const salt = await bcrypt.genSalt(saltRounds);
      return await bcrypt.hash(data, salt);
    } catch (error) {
      console.error('Hashing error:', error.message);
      throw new Error('Failed to hash data');
    }
  },

  /**
   * Compare plaintext data with hashed data
   * @param {string} plaintext - Plaintext data
   * @param {string} hashed - Hashed data
   * @returns {Promise<boolean>} Comparison result
   */
  async compareData(plaintext, hashed) {
    try {
      if (!plaintext || !hashed) {
        return false;
      }
      return await bcrypt.compare(plaintext, hashed);
    } catch (error) {
      console.error('Comparison error:', error.message);
      return false;
    }
  },

  /**
   * Generate a cryptographically secure random string
   * @param {number} length - Length of the string (default: 32)
   * @returns {string} Random string
   */
  generateSecureRandom(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  },

  /**
   * Generate a secure secret code for registration
   * @returns {string} Secret code
   */
  generateSecretCode() {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return crypto.createHash('sha256').update(`${timestamp}_${randomBytes}`).digest('hex');
  },

  /**
   * Hash array patterns (for number-color patterns)
   * @param {Array} pattern - Pattern array
   * @returns {Promise<string>} Hashed pattern
   */
  async hashPattern(pattern) {
    if (!Array.isArray(pattern)) {
      throw new Error('Pattern must be an array');
    }
    
    const patternString = JSON.stringify(pattern.sort((a, b) => 
      a.number - b.number || a.color.localeCompare(b.color)
    ));
    
    return this.hashData(patternString);
  },

  /**
   * Verify pattern against hashed pattern
   * @param {Array} pattern - Pattern to verify
   * @param {string} hashedPattern - Hashed pattern to compare against
   * @returns {Promise<boolean>} Verification result
   */
  async verifyPattern(pattern, hashedPattern) {
    try {
      if (!Array.isArray(pattern) || !hashedPattern) {
        return false;
      }
      
      const patternString = JSON.stringify(pattern.sort((a, b) => 
        a.number - b.number || a.color.localeCompare(b.color)
      ));
      
      return this.compareData(patternString, hashedPattern);
    } catch (error) {
      console.error('Pattern verification error:', error.message);
      return false;
    }
  }
};

// JWT utilities
const jwtUtils = {
  /**
   * Generate JWT token
   * @param {Object} payload - Token payload
   * @param {string} expiresIn - Token expiration time
   * @returns {string} JWT token
   */
  generateToken(payload, expiresIn = process.env.JWT_EXPIRE || '7d') {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET not configured');
      }
      
      return jwt.sign(payload, secret, {
        expiresIn,
        issuer: 'authentication-app',
        audience: 'authentication-client'
      });
    } catch (error) {
      console.error('Token generation error:', error.message);
      throw new Error('Failed to generate authentication token');
    }
  },

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} Decoded payload
   */
  verifyToken(token) {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET not configured');
      }
      
      return jwt.verify(token, secret, {
        issuer: 'authentication-app',
        audience: 'authentication-client'
      });
    } catch (error) {
      console.error('Token verification error:', error.message);
      throw new Error('Invalid or expired token');
    }
  },

  /**
   * Generate session token with device info
   * @param {string} userId - User ID
   * @param {Object} deviceInfo - Device information
   * @returns {Object} Token and session info
   */
  generateSessionToken(userId, deviceInfo = {}) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const payload = {
      userId,
      sessionId,
      deviceInfo,
      type: 'session'
    };
    
    const token = this.generateToken(payload);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    return {
      token,
      sessionId,
      expiresAt
    };
  }
};

// QR Code utilities
const qrUtils = {
  /**
   * Generate QR code for authentication
   * @param {string} email - User email
   * @param {string} hashedSecret - Hashed secret code
   * @param {Object} options - QR code options
   * @returns {Promise<string>} Base64 QR code image
   */
  async generateAuthQR(email, hashedSecret, options = {}) {
    try {
      const qrData = {
        email,
        secret: hashedSecret,
        timestamp: Date.now(),
        app: 'authentication-app'
      };
      
      const qrOptions = {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        ...options
      };
      
      return await QRCode.toDataURL(JSON.stringify(qrData), qrOptions);
    } catch (error) {
      console.error('QR code generation error:', error.message);
      throw new Error('Failed to generate QR code');
    }
  },

  /**
   * Generate QR code as buffer
   * @param {string} email - User email
   * @param {string} hashedSecret - Hashed secret code
   * @returns {Promise<Buffer>} QR code buffer
   */
  async generateAuthQRBuffer(email, hashedSecret) {
    try {
      const qrData = {
        email,
        secret: hashedSecret,
        timestamp: Date.now(),
        app: 'authentication-app'
      };
      
      return await QRCode.toBuffer(JSON.stringify(qrData));
    } catch (error) {
      console.error('QR code buffer generation error:', error.message);
      throw new Error('Failed to generate QR code buffer');
    }
  }
};

// Validation utilities
const validationUtils = {
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Validation result
   */
  isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  },

  /**
   * Validate pattern format
   * @param {Array} pattern - Pattern to validate
   * @returns {Object} Validation result with details
   */
  validatePattern(pattern) {
    const result = {
      isValid: true,
      errors: []
    };

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
  },

  /**
   * Sanitize input string
   * @param {string} input - Input to sanitize
   * @param {number} maxLength - Maximum length allowed
   * @returns {string} Sanitized input
   */
  sanitizeInput(input, maxLength = 1000) {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  }
};

// Device detection utilities
const deviceUtils = {
  /**
   * Extract device information from request
   * @param {Object} req - Express request object
   * @returns {Object} Device information
   */
  getDeviceInfo(req) {
    const userAgent = req.get('User-Agent') || '';
    const ip = req.ip || req.connection.remoteAddress || '';
    
    return {
      userAgent,
      ipAddress: ip,
      deviceType: this.detectDeviceType(userAgent),
      browser: this.detectBrowser(userAgent),
      os: this.detectOS(userAgent)
    };
  },

  /**
   * Detect device type from user agent
   * @param {string} userAgent - User agent string
   * @returns {string} Device type
   */
  detectDeviceType(userAgent) {
    const ua = userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipad|tablet/.test(ua)) {
      return 'mobile';
    } else if (/tablet|ipad/.test(ua)) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  },

  /**
   * Detect browser from user agent
   * @param {string} userAgent - User agent string
   * @returns {string} Browser name
   */
  detectBrowser(userAgent) {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    if (ua.includes('opera')) return 'Opera';
    
    return 'Unknown';
  },

  /**
   * Detect operating system from user agent
   * @param {string} userAgent - User agent string
   * @returns {string} OS name
   */
  detectOS(userAgent) {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac os')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('ios')) return 'iOS';
    
    return 'Unknown';
  }
};

// Time utilities
const timeUtils = {
  /**
   * Get expiration time for tokens
   * @param {number} minutes - Minutes from now
   * @returns {Date} Expiration date
   */
  getExpirationTime(minutes) {
    return new Date(Date.now() + minutes * 60 * 1000);
  },

  /**
   * Check if date is expired
   * @param {Date} date - Date to check
   * @returns {boolean} Whether date is expired
   */
  isExpired(date) {
    return date && date < new Date();
  },

  /**
   * Format timestamp for logging
   * @param {Date} date - Date to format
   * @returns {string} Formatted timestamp
   */
  formatTimestamp(date = new Date()) {
    return date.toISOString();
  }
};

module.exports = {
  hashingUtils,
  jwtUtils,
  qrUtils,
  validationUtils,
  deviceUtils,
  timeUtils
};