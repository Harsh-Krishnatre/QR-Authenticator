const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const settings = require('../config/settings');
const logger = require('../utils/logger');
const UserModel = require('../models/user.model');

class Security {
    constructor() {
        this.securityHeaders = helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    scriptSrc: ["'self'"],
                    connectSrc: ["'self'"],
                    frameSrc: ["'none'"],
                    objectSrc: ["'none'"],
                    upgradeInsecureRequests: [],
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            },
            referrerPolicy: {
                policy: 'strict-origin-when-cross-origin',
            },
            permissionsPolicy: {
                features: {
                    geolocation: ["'none'"],
                    microphone: ["'none'"],
                    camera: ["'none'"],
                    payment: ["'none'"],
                    usb: ["'none'"],
                    magnetometer: ["'none'"],
                    gyroscope: ["'none'"],
                    accelerometer: ["'none'"],
                },
            },
        });

        this.noSQLInjectionPrevention = mongoSanitize({
            replaceWith: '_',
            onSanitize: ({ req, key }) => {
                try {
                    logger.warn(`Potential NoSQL injection attempt detected from IP: ${req?.ip || 'unknown'}, Key: ${key}`);
                } catch (e) {
                    logger.warn('Potential NoSQL injection attempt detected (unable to read req details).');
                }
            },
        });
    }

    xssProtection(req, res, next) {
        res.setHeader('X-XSS-Protection', '1; mode=block');

        const sanitizeValue = (value) => {
            if (typeof value === 'string') {
                return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '').replace(/javascript:/gi, '').replace(/on\w+\s*=/gi, '')
                    .trim();
            }
            return value;
        };

        const sanitizeObject = (obj) => {
            if (!obj || typeof obj !== 'object') {
                return;
            }
            Object.keys(obj).forEach((key) => {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitizeObject(obj[key]);
                } else {
                    obj[key] = sanitizeValue(obj[key]);
                }
            });
        };

        sanitizeObject(req.body);
        sanitizeObject(req.query);
        next();
    }

    get corsOptions() {
        return {
            origin: (origin, callback) => {
                if (!origin) {
                    return callback(null, true);
                }

                // Parse comma-separated FRONTEND_URL or use default
                const configUrl = (settings && settings.FRONTEND_URL) || 'http://localhost:5173';
                const allowedOrigins = configUrl.split(',').map((url) => url.trim());

                // In development, also allow localhost and private LAN IPs on any port
                const isLocalNetwork = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin);
                if (settings.NODE_ENV === 'development' && isLocalNetwork) {
                    callback(null, true);
                } else if (allowedOrigins.indexOf(origin) !== -1) {
                    callback(null, true);
                } else {
                    logger.warn(`CORS violation attempt from origin: ${origin}`); callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            optionsSuccessStatus: 200,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-HTTP-Method-Override', 'Accept', 'Origin', 'ngrok-skip-browser-warning'],
            exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
        };
    }

    requestSanitization(req, res, next) {
        const sanitizeString = (str) => (typeof str === 'string' ? str.replace(/\0/g, '') : str);
        const sanitizeObject = (obj) => {
            if (obj && typeof obj === 'object') {
                Object.keys(obj).forEach((key) => {
                    if (typeof obj[key] === 'object' && obj[key] !== null) {
                        sanitizeObject(obj[key]);
                    } else {
                        obj[key] = sanitizeString(obj[key]);
                    }
                });
            }
        };

        sanitizeObject(req.body);
        sanitizeObject(req.query);
        sanitizeObject(req.params);
        next();
    }

    ipFiltering(req, res, next) {
        const clientIP = req.ip || (req.connection && req.connection.remoteAddress) || '';
        const blockedIPs = ((settings && settings.BLOCKED_IPS) || '').split(',').map((ip) => ip.trim()).filter(Boolean);

        if (blockedIPs.includes(clientIP)) {
            logger.warn(`Blocked IP attempt: ${clientIP}`);
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        next();
    }

    securityLogging(req, res, next) {
        const timestamp = new Date().toISOString();
        const clientIP = req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
        const userAgent = req.get('User-Agent') || 'Unknown';
        const { method } = req;
        const url = req.originalUrl || req.url || '';

        if (method !== 'GET' || url.includes('auth') || url.includes('admin')) {
            logger.info(`[SECURITY] ${timestamp} - ${clientIP} - ${method} ${url} - UA: ${userAgent}`);
        }
        next();
    }

    contentTypeValidation(req, res, next) {
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            const contentType = req.get('Content-Type') || '';
            if (!contentType) {
                return res.status(400).json({
                    success: false,
                    error: 'Content-Type header is required',
                });
            }
            if (!contentType.includes('application/json')) {
                return res.status(415).json({
                    success: false,
                    error: 'Unsupported Media Type. Only application/json is allowed',
                });
            }
        }
        next();
    }
}

const security = new Security();

async function requireAuth(req, res, next) {
    const authHeader = req.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    if (!token) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    try {
        const user = await UserModel.findOne({ 'activeSessions.sessionId': token });
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid or expired session' });
        }
        const session = user.activeSessions.find((s) => s.sessionId === token);
        if (!session || session.expiresAt < new Date()) {
            return res.status(401).json({ success: false, error: 'Session expired' });
        }
        req.user = user;
        req.sessionId = token;
        next();
    } catch (err) {
        logger.error('requireAuth error:', err);
        return res.status(500).json({ success: false, error: 'Authentication check failed' });
    }
}

module.exports = {
    securityHeaders: security.securityHeaders,
    noSQLInjectionPrevention: security.noSQLInjectionPrevention,
    xssProtection: security.xssProtection.bind(security),
    corsOptions: security.corsOptions,
    requestSanitization: security.requestSanitization.bind(security),
    ipFiltering: security.ipFiltering.bind(security),
    securityLogging: security.securityLogging.bind(security),
    contentTypeValidation: security.contentTypeValidation.bind(security),
    requireAuth,
};
