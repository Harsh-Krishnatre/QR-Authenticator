require('dotenv').config();

class Settings {
    constructor() {
        // Environment Variables
        this.NODE_ENV = process.env.NODE_ENV;
        this.PORT = Number(process.env.PORT);

        // Database
        this.MONGODB_URI = process.env.MONGODB_URI;

        // Security
        this.JWT_SECRET = process.env.JWT_SECRET;
        this.JWT_EXPIRE = process.env.JWT_EXPIRE;
        this.BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS);

        // Email Configuration
        this.EMAIL_HOST = process.env.EMAIL_HOST;
        this.EMAIL_PORT = Number(process.env.EMAIL_PORT);
        this.EMAIL_USER = process.env.EMAIL_USER;
        this.EMAIL_PASS = process.env.EMAIL_PASS;
        this.EMAIL_FROM = process.env.EMAIL_FROM;

        // Rate Limiting
        this.RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS);
        this.RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS);

        // Token Expiry
        this.RESET_TOKEN_EXPIRE = process.env.RESET_TOKEN_EXPIRE;
        this.OTP_TOKEN_EXPIRE = process.env.OTP_TOKEN_EXPIRE;

        // Frontend URL
        this.FRONTEND_URL = process.env.FRONTEND_URL;
    }
}

const settings = new Settings();

module.exports = settings;
