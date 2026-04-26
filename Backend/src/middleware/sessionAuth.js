const User = require('../models/user.model');
const { sendError } = require('./errorHandling');

/**
 * Middleware: verify the Bearer session token passed in the Authorization header.
 * Attaches req.userId (Mongoose ObjectId) when valid.
 *
 * Token is the sessionId returned by /auth/login/verify.
 * It is stored inside user.activeSessions[].sessionId.
 */
async function requireSession(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    if (!token) {
        return sendError(res, 401, 'Authentication required. Please log in first.');
    }

    try {
        const user = await User.findOne({
            'activeSessions.sessionId': token,
            'activeSessions.expiresAt': { $gt: new Date() },
            accountStatus: 'active',
        });

        if (!user) {
            return sendError(res, 401, 'Session expired or invalid. Please log in again.');
        }

        req.userId = user._id;
        req.sessionToken = token;
        return next();
    } catch (err) {
        return sendError(res, 500, 'Failed to verify session');
    }
}

module.exports = { requireSession };
