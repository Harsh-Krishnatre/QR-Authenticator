const mongoose = require('mongoose');
const net = require('net');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [254, 'Email cannot be longer than 254 characters'],
    validate: {
      validator: function (email) {
        return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email);
      },
      message: 'Please provide a valid email address',
    },
  },

  authMethod: {
    type: String,
    enum: ['security_questions', 'picture_pattern'],
    required: [true, 'Authentication method is required'],
  },

  hashedSecretCode: {
    type: String,
    required: [true, 'Secret code is required'],
    minlength: [60, 'Invalid secret code format'],
  },

  securityAnswers: [{
    question: {
      type: String,
      required: function () { return this.authMethod === 'security_questions'; },
      trim: true,
      maxlength: [200, 'Question cannot be longer than 200 characters'],
    },
    hashedAnswer: {
      type: String,
      required: function () { return this.authMethod === 'security_questions'; },
      minlength: [60, 'Invalid answer format'],
    },
  }],

  picturePattern: {
    hashedPattern: {
      type: String,
      required: function () { return this.authMethod === 'picture_pattern'; },
      minlength: [60, 'Invalid pattern format'],
    },
    patternMetadata: {
      type: {
        gridSize: {
          type: String,
          enum: ['3x3', '4x4', '5x5'],
          default: '3x3',
        },
        complexity: {
          type: String,
          enum: ['simple', 'medium', 'complex'],
          default: 'medium',
        },
      },
      required: function () { return this.authMethod === 'picture_pattern'; },
    },
  },

  numberColorPattern: {
    hashedPattern: {
      type: String,
      minlength: [60, 'Invalid pattern format'],
    },
    patternLength: {
      type: Number,
      min: [4, 'Pattern must be at least 4 elements'],
      max: [8, 'Pattern cannot exceed 8 elements'],
      default: 4,
    },
  },

  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'locked', 'pending_verification'],
    default: 'active',
  },

  failedLoginAttempts: {
    count: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    lastFailedAt: Date,
    lockUntil: Date,
  },

  activeSessions: [{
    sessionId: {
      type: String,
      required: true,
    },
    deviceInfo: {
      userAgent: String,
      ipAddress: String,
      deviceType: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  }],

  resetToken: {
    token: String,
    hashedToken: String,
    expiresAt: Date,
    used: {
      type: Boolean,
      default: false,
    },
  },

  loginOTP: {
    hashedOTP: String,
    expiresAt: Date,
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
  },

  registeredAt: {
    type: Date,
    default: Date.now,
  },

  lastLoginAt: Date,

  registrationIP: {
    type: String,
    validate: {
      validator: function (ip) {
        try {
          if (!ip) return true;
          const cleaned = ip.replace(/^::ffff:/, '');
          return net.isIP(cleaned) !== 0;
        } catch (e) {
          return false;
        }
      },
      message: 'Invalid IP address format',
    },
  },

  securityMetadata: {
    lastPasswordChange: Date,
    lastPatternChange: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    loginNotifications: {
      type: Boolean,
      default: true,
    },
  },
}, {
  timestamps: true,
  versionKey: false,
});

userSchema.index({ 'activeSessions.sessionId': 1 });
userSchema.index({ 'resetToken.hashedToken': 1 });
userSchema.index({ 'loginOTP.expiresAt': 1 });
userSchema.index({ registeredAt: 1 });
userSchema.index({ accountStatus: 1 });

userSchema.virtual('isLocked').get(function () {
  return !!(this.failedLoginAttempts.lockUntil && this.failedLoginAttempts.lockUntil > Date.now());
});

userSchema.pre('save', async function (next) {
  try {
    if (this.authMethod === 'security_questions') {
      if (!this.securityAnswers || this.securityAnswers.length === 0) throw new Error('Security questions are required for this authentication method');
      for (const qa of this.securityAnswers) {
        if (!qa.question || !qa.hashedAnswer) throw new Error('All security questions must have both question and answer');
      }
    } else if (this.authMethod === 'picture_pattern') {
      if (!this.picturePattern || !this.picturePattern.hashedPattern) throw new Error('Picture pattern is required for this authentication method');
    }

    if (this.accountStatus === 'active') {
      if (!this.numberColorPattern || !this.numberColorPattern.hashedPattern) throw new Error('Number-color pattern is required');
    }

    if (this.activeSessions) {
      this.activeSessions = this.activeSessions.filter((session) => session.expiresAt > new Date());
    }

    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.isAccountLocked = function () {
  return !!(this.failedLoginAttempts.lockUntil && this.failedLoginAttempts.lockUntil > Date.now());
};

userSchema.methods.incrementFailedAttempts = function () {
  if (this.failedLoginAttempts.lockUntil && this.failedLoginAttempts.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'failedLoginAttempts.lockUntil': 1 },
      $set: {
        'failedLoginAttempts.count': 1,
        'failedLoginAttempts.lastFailedAt': Date.now(),
      },
    });
  }

  const updates = {
    $inc: { 'failedLoginAttempts.count': 1 },
    $set: { 'failedLoginAttempts.lastFailedAt': Date.now() },
  };

  if (this.failedLoginAttempts.count + 1 >= 5) {
    updates.$set['failedLoginAttempts.lockUntil'] = Date.now() + (30 * 60 * 1000);
  }

  return this.updateOne(updates);
};

userSchema.methods.resetFailedAttempts = function () {
  return this.updateOne({
    $unset: {
      'failedLoginAttempts.count': 1,
      'failedLoginAttempts.lastFailedAt': 1,
      'failedLoginAttempts.lockUntil': 1,
    },
  });
};

userSchema.methods.addSession = function (sessionId, deviceInfo, expiresAt) {
  if (this.activeSessions.length >= 5) {
    this.activeSessions.sort((a, b) => a.createdAt - b.createdAt);
    this.activeSessions.shift();
  }

  this.activeSessions.push({
    sessionId,
    deviceInfo,
    expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return this.save();
};

userSchema.methods.removeSession = function (sessionId) {
  this.activeSessions = this.activeSessions.filter((session) => session.sessionId !== sessionId);
  return this.save();
};

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

userSchema.statics.cleanupExpiredData = function () {
  const now = new Date();
  return this.updateMany(
    {},
    {
      $pull: { activeSessions: { expiresAt: { $lt: now } } },
      $unset: {
        'resetToken.token': 1,
        'resetToken.hashedToken': 1,
        'resetToken.expiresAt': 1,
        'loginOTP.hashedOTP': 1,
        'loginOTP.expiresAt': 1,
      },
    },
    {
      conditions: {
        $or: [
          { 'resetToken.expiresAt': { $lt: now } },
          { 'loginOTP.expiresAt': { $lt: now } },
        ],
      },
    },
  );
};

module.exports = mongoose.model('User', userSchema);
