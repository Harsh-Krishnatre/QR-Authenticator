const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [254, 'Email cannot be longer than 254 characters'],
    validate: {
      validator: function(email) {
        // RFC 5322 compliant email regex
        return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },

  // Authentication method chosen during registration
  authMethod: {
    type: String,
    enum: ['security_questions', 'picture_pattern'],
    required: [true, 'Authentication method is required']
  },

  // Hashed secret code generated during registration
  hashedSecretCode: {
    type: String,
    required: [true, 'Secret code is required'],
    minlength: [60, 'Invalid secret code format']
  },

  // Security Questions Authentication
  securityAnswers: [{
    question: {
      type: String,
      required: function() { return this.authMethod === 'security_questions'; },
      trim: true,
      maxlength: [200, 'Question cannot be longer than 200 characters']
    },
    hashedAnswer: {
      type: String,
      required: function() { return this.authMethod === 'security_questions'; },
      minlength: [60, 'Invalid answer format']
    }
  }],

  // Picture Pattern Authentication
  picturePattern: {
    hashedPattern: {
      type: String,
      required: function() { return this.authMethod === 'picture_pattern'; },
      minlength: [60, 'Invalid pattern format']
    },
    patternMetadata: {
      type: {
        gridSize: {
          type: String,
          enum: ['3x3', '4x4', '5x5'],
          default: '3x3'
        },
        complexity: {
          type: String,
          enum: ['simple', 'medium', 'complex'],
          default: 'medium'
        }
      },
      required: function() { return this.authMethod === 'picture_pattern'; }
    }
  },

  // Number-Color pattern chosen during registration
  numberColorPattern: {
    hashedPattern: {
      type: String,
      minlength: [60, 'Invalid pattern format']
    },
    patternLength: {
      type: Number,
      min: [4, 'Pattern must be at least 4 elements'],
      max: [8, 'Pattern cannot exceed 8 elements'],
      default: 4
    }
  },

  // Account status and security
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'locked', 'pending_verification'],
    default: 'active'
  },

  // Failed login attempts tracking
  failedLoginAttempts: {
    count: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    lastFailedAt: Date,
    lockUntil: Date
  },

  // Session management
  activeSessions: [{
    sessionId: {
      type: String,
      required: true
    },
    deviceInfo: {
      userAgent: String,
      ipAddress: String,
      deviceType: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    }
  }],

  // Reset token for password reset
  resetToken: {
    token: String,
    hashedToken: String,
    expiresAt: Date,
    used: {
      type: Boolean,
      default: false
    }
  },

  // OTP for login
  loginOTP: {
    hashedOTP: String,
    expiresAt: Date,
    attempts: {
      type: Number,
      default: 0,
      max: 5
    }
  },

  // Audit trail
  registeredAt: {
    type: Date,
    default: Date.now
  },

  lastLoginAt: Date,

  registrationIP: {
    type: String,
    validate: {
      validator: function(ip) {
        // Use Node's net.isIP to validate IPv4/IPv6 (handles shorthand and ::ffff: IPv4-mapped forms)
        try {
          const net = require('net');
          if (!ip) return true;
          // Strip IPv4-mapped IPv6 prefix if present
          const cleaned = ip.replace(/^::ffff:/, '');
          return net.isIP(cleaned) !== 0;
        } catch (e) {
          return false;
        }
      },
      message: 'Invalid IP address format'
    }
  },

  // Security metadata
  securityMetadata: {
    lastPasswordChange: Date,
    lastPatternChange: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    loginNotifications: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for performance
// `email` already has `unique: true` on the path definition above,
// so we avoid declaring the same index twice to prevent mongoose warnings.
// (Removed explicit `userSchema.index({ email: 1 }, { unique: true })`)
userSchema.index({ 'activeSessions.sessionId': 1 });
userSchema.index({ 'resetToken.hashedToken': 1 });
userSchema.index({ 'loginOTP.expiresAt': 1 });
userSchema.index({ registeredAt: 1 });
userSchema.index({ accountStatus: 1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.failedLoginAttempts.lockUntil && this.failedLoginAttempts.lockUntil > Date.now());
});

// Pre-save middleware for validation
userSchema.pre('save', async function(next) {
  try {
    // Validate that at least one authentication method is properly set
    if (this.authMethod === 'security_questions') {
      if (!this.securityAnswers || this.securityAnswers.length === 0) {
        throw new Error('Security questions are required for this authentication method');
      }
      // Ensure all security answers are provided
      for (const qa of this.securityAnswers) {
        if (!qa.question || !qa.hashedAnswer) {
          throw new Error('All security questions must have both question and answer');
        }
      }
    } else if (this.authMethod === 'picture_pattern') {
      if (!this.picturePattern || !this.picturePattern.hashedPattern) {
        throw new Error('Picture pattern is required for this authentication method');
      }
    }

    // Validate number-color pattern only when activating account
    if (this.accountStatus === 'active') {
      if (!this.numberColorPattern || !this.numberColorPattern.hashedPattern) {
        throw new Error('Number-color pattern is required');
      }
    }

    // Clean up expired sessions
    if (this.activeSessions) {
      this.activeSessions = this.activeSessions.filter(session => 
        session.expiresAt > new Date()
      );
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check if account is locked
userSchema.methods.isAccountLocked = function() {
  return !!(this.failedLoginAttempts.lockUntil && this.failedLoginAttempts.lockUntil > Date.now());
};

// Instance method to increment failed login attempts
userSchema.methods.incrementFailedAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.failedLoginAttempts.lockUntil && this.failedLoginAttempts.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'failedLoginAttempts.lockUntil': 1 },
      $set: {
        'failedLoginAttempts.count': 1,
        'failedLoginAttempts.lastFailedAt': Date.now()
      }
    });
  }

  const updates = {
    $inc: { 'failedLoginAttempts.count': 1 },
    $set: { 'failedLoginAttempts.lastFailedAt': Date.now() }
  };

  // Lock account after 5 failed attempts for 30 minutes
  if (this.failedLoginAttempts.count + 1 >= 5) {
    updates.$set['failedLoginAttempts.lockUntil'] = Date.now() + (30 * 60 * 1000); // 30 minutes
  }

  return this.updateOne(updates);
};

// Instance method to reset failed attempts
userSchema.methods.resetFailedAttempts = function() {
  return this.updateOne({
    $unset: {
      'failedLoginAttempts.count': 1,
      'failedLoginAttempts.lastFailedAt': 1,
      'failedLoginAttempts.lockUntil': 1
    }
  });
};

// Instance method to add session
userSchema.methods.addSession = function(sessionId, deviceInfo, expiresAt) {
  // Limit to 5 active sessions per user
  if (this.activeSessions.length >= 5) {
    // Remove oldest session
    this.activeSessions.sort((a, b) => a.createdAt - b.createdAt);
    this.activeSessions.shift();
  }

  this.activeSessions.push({
    sessionId,
    deviceInfo,
    expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days default
  });

  return this.save();
};

// Instance method to remove session
userSchema.methods.removeSession = function(sessionId) {
  this.activeSessions = this.activeSessions.filter(session => session.sessionId !== sessionId);
  return this.save();
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

// Static method to cleanup expired data
userSchema.statics.cleanupExpiredData = function() {
  const now = new Date();
  return this.updateMany(
    {},
    {
      $pull: {
        activeSessions: { expiresAt: { $lt: now } }
      },
      $unset: {
        'resetToken.token': 1,
        'resetToken.hashedToken': 1,
        'resetToken.expiresAt': 1,
        'loginOTP.hashedOTP': 1,
        'loginOTP.expiresAt': 1
      }
    },
    {
      conditions: {
        $or: [
          { 'resetToken.expiresAt': { $lt: now } },
          { 'loginOTP.expiresAt': { $lt: now } }
        ]
      }
    }
  );
};

module.exports = mongoose.model('User', userSchema);