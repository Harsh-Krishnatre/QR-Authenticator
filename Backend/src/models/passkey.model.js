const mongoose = require('mongoose');

/**
 * Passkey stored by the authenticator app.
 * Many passkeys → one User (userId is a FK to User._id).
 */
const passkeySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'userId is required'],
        index: true,
    },

    issuer: {
        type: String,
        required: [true, 'Issuer is required'],
        trim: true,
        maxlength: [200, 'Issuer cannot exceed 200 characters'],
    },

    label: {
        type: String,
        trim: true,
        maxlength: [200, 'Label cannot exceed 200 characters'],
        default: '',
    },

    // Encrypted TOTP secret (stored as-is; client normalises to uppercase Base32)
    secret: {
        type: String,
        required: [true, 'Secret is required'],
        minlength: [16, 'Secret must be at least 16 characters'],
    },

    digits: {
        type: Number,
        min: [6, 'Digits must be 6-10'],
        max: [10, 'Digits must be 6-10'],
        default: 6,
    },

    period: {
        type: Number,
        min: [15, 'Period must be 15-90 seconds'],
        max: [90, 'Period must be 15-90 seconds'],
        default: 30,
    },

    algorithm: {
        type: String,
        enum: ['sha1', 'sha256', 'sha512'],
        default: 'sha1',
    },

    // Client-side UUID so mobile can upsert by clientId
    clientId: {
        type: String,
        required: [true, 'clientId is required'],
        trim: true,
    },

    // Optional number-color pattern locked to this passkey (verified on-device)
    numberColorPattern: [{
        number: {
            type: Number,
            min: [0, 'Number must be 0-9'],
            max: [9, 'Number must be 0-9'],
            required: true,
        },
        color: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
    }],

    createdAt: {
        type: Date,
        default: Date.now,
    },

    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
    versionKey: false,
});

// One user cannot have two passkeys with the same clientId
passkeySchema.index({ userId: 1, clientId: 1 }, { unique: true });

passkeySchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Passkey', passkeySchema);
