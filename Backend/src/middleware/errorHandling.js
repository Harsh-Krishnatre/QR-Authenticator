const settings = require('../config/settings');
const logger = require('../utils/logger');

class ErrorHandling {
    errorHandler(err, req, res, _next) {
        // eslint-disable-next-line no-void
        void _next;
        logger.error('Error Stack:', err.stack);

        let error = { ...err };
        error.message = err.message;

        if (err.name === 'ValidationError') {
            const message = Object.values(err.errors).map((val) => val.message).join(', ');
            error = {
                name: 'ValidationError',
                message,
                statusCode: 400,
            };
        }

        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
            error = {
                name: 'DuplicateError',
                message,
                statusCode: 400,
            };
        }

        if (err.name === 'CastError') {
            const message = 'Invalid resource ID format';
            error = {
                name: 'CastError',
                message,
                statusCode: 400,
            };
        }

        if (err.name === 'JsonWebTokenError') {
            const message = 'Invalid authentication token';
            error = {
                name: 'AuthenticationError',
                message,
                statusCode: 401,
            };
        }

        if (err.name === 'TokenExpiredError') {
            const message = 'Authentication token has expired';
            error = {
                name: 'AuthenticationError',
                message,
                statusCode: 401,
            };
        }

        if (err.status === 429) {
            error = {
                name: 'RateLimitError',
                message: 'Too many requests, please try again later',
                statusCode: 429,
                retryAfter: err.retryAfter || 900,
            };
        }

        if (err.name === 'MongooseError' || err.name === 'MongoError') {
            error = {
                name: 'DatabaseError',
                message: 'Database operation failed',
                statusCode: 500,
            };
        }

        if (err.message && err.message.includes('CORS')) {
            error = {
                name: 'CORSError',
                message: 'Cross-origin request blocked',
                statusCode: 403,
            };
        }

        if (err.code === 'LIMIT_FILE_SIZE') {
            error = {
                name: 'FileSizeError',
                message: 'File size too large',
                statusCode: 413,
            };
        }

        const statusCode = error.statusCode || 500;
        const message = error.message || 'Internal Server Error';

        const responseError = {
            success: false,
            error: message,
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method,
        };

        if (settings.NODE_ENV === 'development') {
            responseError.stack = err.stack;
            responseError.details = error;
        }

        if (statusCode === 429) {
            responseError.retryAfter = error.retryAfter;
        }

        if (statusCode >= 500) {
            logger.error(`[CRITICAL ERROR] ${new Date().toISOString()} - ${req.ip} - ${req.method} ${req.originalUrl}`, {
                error: err.message,
                stack: err.stack,
                user: req.user?.email || 'Anonymous',
            });
        }

        res.status(statusCode).json(responseError);
    }

    notFoundHandler(req, res, _next) {
        // eslint-disable-next-line no-void
        void _next;
        const error = new Error(`Route ${req.originalUrl} not found`);
        error.statusCode = 404;

        res.status(404).json({
            success: false,
            error: 'Route not found',
            message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
            timestamp: new Date().toISOString(),
            availableEndpoints: {
                auth: [
                    'POST /api/auth/register',
                    'POST /api/auth/submit-pattern',
                    'POST /api/auth/login',
                    'POST /api/auth/logout',
                    'POST /api/auth/reset-request',
                    'POST /api/auth/reset-complete',
                ],
                general: ['GET /api/health', 'GET /'],
            },
        });
    }

    asyncHandler(fn) {
        return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
    }

    sendError(res, statusCode, message, details = null) {
        const response = {
            success: false,
            error: message,
            timestamp: new Date().toISOString(),
        };
        if (details) {
            response.details = details;
        }
        return res.status(statusCode).json(response);
    }

    sendSuccess(res, message, data = null, statusCode = 200) {
        const response = {
            success: true,
            message,
            timestamp: new Date().toISOString(),
        };
        if (data) {
            response.data = data;
        }
        return res.status(statusCode).json(response);
    }

    formatValidationErrors(errors) {
        const formattedErrors = {};
        errors.forEach((error) => {
            const field = error.param || error.path || 'general';
            if (!formattedErrors[field]) {
                formattedErrors[field] = [];
            }
            formattedErrors[field].push(error.msg || error.message);
        });
        return formattedErrors;
    }

    handleDatabaseError(error) {
        logger.error('Database Error:', error);
        const createAPIError = (message, statusCode = 500, isOperational = true) => {
            const err = new Error(message);
            err.statusCode = statusCode;
            err.isOperational = isOperational;
            return err;
        };

        if (error.name === 'MongooseError' || (error.message && error.message.includes('connection'))) {
            return createAPIError('Database connection failed. Please try again later.', 503);
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err) => err.message);
            return createAPIError(`Validation failed: ${messages.join(', ')}`, 400);
        }
        return createAPIError('Database operation failed', 500);
    }

    logSecurityIncident(req, type, details) {
        const timestamp = new Date().toISOString();
        const clientIP = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent') || 'Unknown';
        logger.warn(`[SECURITY INCIDENT] ${timestamp} - Type: ${type} - IP: ${clientIP} - UA: ${userAgent} - Details: ${JSON.stringify(details)}`);
    }
}

const errorHandling = new ErrorHandling();

module.exports = {
    errorHandler: errorHandling.errorHandler.bind(errorHandling),
    notFoundHandler: errorHandling.notFoundHandler.bind(errorHandling),
    asyncHandler: errorHandling.asyncHandler.bind(errorHandling),
    sendError: errorHandling.sendError.bind(errorHandling),
    sendSuccess: errorHandling.sendSuccess.bind(errorHandling),
    formatValidationErrors: errorHandling.formatValidationErrors.bind(errorHandling),
    handleDatabaseError: errorHandling.handleDatabaseError.bind(errorHandling),
    logSecurityIncident: errorHandling.logSecurityIncident.bind(errorHandling),
};
