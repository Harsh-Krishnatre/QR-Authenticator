const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

class RateLimiting {
    constructor() {
        this.authLimiter = rateLimit({
            windowMs: 5 * 60 * 1000,
            max: 20,
            message: {
                success: false,
                error: 'Too many authentication attempts, please try again in 5 minutes',
                retryAfter: 300,
            },
            standardHeaders: true,
            legacyHeaders: false,
            skipSuccessfulRequests: true,
        });

        this.registrationInitLimiter = rateLimit({
            windowMs: 5 * 60 * 1000,
            max: 30,
            message: {
                success: false,
                error: 'Too many check email attempts, please try again in 5 minutes',
                retryAfter: 300,
            },
            standardHeaders: true,
            legacyHeaders: false,
        });

        this.registrationLimiter = rateLimit({
            windowMs: 1000, //change to 5 * 60 * 1000 for production
            max: 3,
            message: {
                success: false,
                error: 'Too many registration attempts, please try again in 10 minutes',
                retryAfter: 600,
            },
            standardHeaders: true,
            legacyHeaders: false,
        });

        this.resetLimiter = rateLimit({
            windowMs: 30 * 60 * 1000,
            max: 3,
            message: {
                success: false,
                error: 'Too many reset attempts, please try again in 30 minutes',
                retryAfter: 1800,
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
                    retryAfter: 900,
                },
            }),
            authenticated: rateLimit({
                windowMs: 15 * 60 * 1000,
                max: 100,
                message: {
                    success: false,
                    error: 'Too many requests from authenticated user',
                    retryAfter: 900,
                },
            }),
            admin: rateLimit({
                windowMs: 15 * 60 * 1000,
                max: 200,
                message: {
                    success: false,
                    error: 'Too many admin requests',
                    retryAfter: 900,
                },
            }),
        };
    }
}

const limiter = new RateLimiting();

module.exports = {
    authLimiter: limiter.authLimiter,
    registrationInitLimiter: limiter.registrationInitLimiter,
    registrationLimiter: limiter.registrationLimiter,
    resetLimiter: limiter.resetLimiter,
    loginLimiter: limiter.loginLimiter,
    speedLimiter: limiter.speedLimiter,
    tieredRateLimiter: limiter.tieredRateLimiter,
};
