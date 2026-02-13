const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const settings = require('../config/settings');
const logger = require('../utils/logger');

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
                preload: true
            },
            referrerPolicy: {
                policy: 'strict-origin-when-cross-origin'
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
            for (const key in obj) {
                if (!Object.prototype.hasOwnProperty.call(obj, key)) {
                    continue;
                }
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitizeObject(obj[key]);
                } else {
                    obj[key] = sanitizeValue(obj[key]);
                }
            }
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

                const allowedOrigins = [(settings && settings.FRONTEND_URL) || 'http://localhost:3000', 'http://localhost:5173'];
                if (allowedOrigins.indexOf(origin) !== -1) {
                    callback(null, true);
                } else {
                    logger.warn(`CORS violation attempt from origin: ${origin}`); callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            optionsSuccessStatus: 200,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-HTTP-Method-Override', 'Accept', 'Origin'],
            exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
        };
    }

    requestSanitization(req, res, next) {
        const sanitizeString = (str) => (typeof str === 'string' ? str.replace(/\0/g, '') : str);
        const sanitizeObject = (obj) => {
            if (obj && typeof obj === 'object') {
                for (const key in obj) {
                    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
                        continue;
                    }
                    if (typeof obj[key] === 'object' && obj[key] !== null) {
                        sanitizeObject(obj[key]);
                    } else {
                        obj[key] = sanitizeString(obj[key]);
                    }
                }
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
                    error: 'Content-Type header is required'
                });
            }
            if (!contentType.includes('application/json')) {
                return res.status(415).json({
                    success: false,
                    error: 'Unsupported Media Type. Only application/json is allowed'
                });
            }
        }
        next();
    }
}

const security = new Security();

module.exports = {
    securityHeaders: security.securityHeaders,
    noSQLInjectionPrevention: security.noSQLInjectionPrevention,
    xssProtection: security.xssProtection.bind(security),
    corsOptions: security.corsOptions,
    requestSanitization: security.requestSanitization.bind(security),
    ipFiltering: security.ipFiltering.bind(security),
    securityLogging: security.securityLogging.bind(security),
    contentTypeValidation: security.contentTypeValidation.bind(security),
};
