const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const settings = require('../config/settings');

class RateLimiting {
    constructor() {
        this.generalLimiter = rateLimit({
            windowMs: parseInt(settings.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
            max: parseInt(settings.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
            message: {
                success: false,
                error: 'Too many requests from this IP, please try again later',
                retryAfter: Math.ceil((parseInt(settings.RATE_LIMIT_WINDOW_MS, 10) || 900000) / 1000),
            },
            standardHeaders: true,
            legacyHeaders: false,
            skip: (req) => req.path === '/health' || req.path === '/api/health',
        });

        this.authLimiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 20,
            message: {
                success: false,
                error: 'Too many authentication attempts, please try again in 15 minutes',
                retryAfter: 900,
            },
            standardHeaders: true,
            legacyHeaders: false,
            skipSuccessfulRequests: true,
        });

        this.registrationLimiter = rateLimit({
            windowMs: 60 * 60 * 1000,
            max: 3,
            message: {
                success: false,
                error: 'Too many registration attempts, please try again in 1 hour',
                retryAfter: 3600,
            },
            standardHeaders: true,
            legacyHeaders: false,
        });

        this.resetLimiter = rateLimit({
            windowMs: 60 * 60 * 1000,
            max: 5,
            message: {
                success: false,
                error: 'Too many reset attempts, please try again in 1 hour',
                retryAfter: 3600,
            },
            standardHeaders: true,
            legacyHeaders: false,
        });

        this.loginLimiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 10,
            message: {
                success: false,
                error: 'Too many login attempts, please try again in 15 minutes',
                retryAfter: 900,
            },
            standardHeaders: true,
            legacyHeaders: false,
            skipSuccessfulRequests: true,
        });

        this.speedLimiter = slowDown({
            windowMs: 15 * 60 * 1000,
            delayAfter: 5,
            delayMs: () => 500,
            maxDelayMs: 20000,
            skipSuccessfulRequests: true,
        });

        this.tieredRateLimiter = {
            public: rateLimit({
                windowMs: 15 * 60 * 1000,
                max: 30,
                message: {
                    success: false,
                    error: 'Too many requests from this IP for public endpoints',
                    retryAfter: 900
                },
            }),
            authenticated: rateLimit({
                windowMs: 15 * 60 * 1000,
                max: 100,
                message: { success: false, error: 'Too many requests from authenticated user', retryAfter: 900 },
            }),
            admin: rateLimit({
                windowMs: 15 * 60 * 1000,
                max: 200,
                message: { success: false, error: 'Too many admin requests', retryAfter: 900 },
            }),
        };
    }

    createCustomLimiter(options = {}) {
        const defaultOptions = {
            windowMs: 15 * 60 * 1000, max: 50, message: { success: false, error: 'Rate limit exceeded', retryAfter: 900 }, standardHeaders: true, legacyHeaders: false,
        };
        return rateLimit({ ...defaultOptions, ...options });
    }

    adaptiveRateLimiter(req, res, next) {
        return this.generalLimiter(req, res, next);
    }
}

const limiter = new RateLimiting();

module.exports = {
    generalLimiter: limiter.generalLimiter,
    authLimiter: limiter.authLimiter,
    registrationLimiter: limiter.registrationLimiter,
    resetLimiter: limiter.resetLimiter,
    loginLimiter: limiter.loginLimiter,
    speedLimiter: limiter.speedLimiter,
    adaptiveRateLimiter: limiter.adaptiveRateLimiter.bind(limiter),
    createCustomLimiter: limiter.createCustomLimiter.bind(limiter),
    tieredRateLimiter: limiter.tieredRateLimiter,
};