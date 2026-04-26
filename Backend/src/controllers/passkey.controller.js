const logger = require('../utils/logger');
const Passkey = require('../models/passkey.model');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/errorHandling');

class PasskeyController {
    constructor() {
        this.list   = asyncHandler(this.list.bind(this));
        this.upsert = asyncHandler(this.upsert.bind(this));
        this.remove = asyncHandler(this.remove.bind(this));
    }

    /**
     * GET /api/v1/passkeys
     * Returns all passkeys owned by the authenticated user.
     */
    async list(req, res) {
        const passkeys = await Passkey.find({ userId: req.userId }).lean();
        return sendSuccess(res, 'Passkeys fetched', { passkeys }, 200);
    }

    /**
     * POST /api/v1/passkeys
     * Create or update a passkey (upsert by clientId).
     * Body: { clientId, issuer, label, secret, digits, period, algorithm }
     */
    async upsert(req, res) {
        const { clientId, issuer, label, secret, digits, period, algorithm, numberColorPattern } = req.body;

        if (!clientId || typeof clientId !== 'string' || clientId.trim() === '') {
            return sendError(res, 400, 'clientId is required');
        }
        if (!issuer || typeof issuer !== 'string' || issuer.trim() === '') {
            return sendError(res, 400, 'issuer is required');
        }
        if (!secret || typeof secret !== 'string' || secret.trim().length < 16) {
            return sendError(res, 400, 'secret must be at least 16 characters');
        }

        try {
            const passkey = await Passkey.findOneAndUpdate(
                { userId: req.userId, clientId: clientId.trim() },
                {
                    $set: {
                        userId:              req.userId,
                        clientId:            clientId.trim(),
                        issuer:              issuer.trim(),
                        label:               (label || '').trim(),
                        secret:              secret.trim().toUpperCase(),
                        digits:              digits    != null ? Number(digits)  : 6,
                        period:              period    != null ? Number(period)  : 30,
                        algorithm:           algorithm || 'sha1',
                        numberColorPattern:  Array.isArray(numberColorPattern) ? numberColorPattern : [],
                        updatedAt:           new Date(),
                    },
                },
                { upsert: true, new: true, runValidators: true },
            );

            logger.info(`Passkey upserted: userId=${req.userId} clientId=${clientId}`);
            return sendSuccess(res, 'Passkey saved', { passkey }, 201);
        } catch (error) {
            logger.error('Passkey upsert error:', error);
            if (error.name === 'ValidationError') {
                const msgs = Object.values(error.errors).map((e) => e.message);
                return sendError(res, 400, msgs.join('; '));
            }
            return sendError(res, 500, 'Failed to save passkey');
        }
    }

    /**
     * DELETE /api/v1/passkeys/:clientId
     * Removes a passkey belonging to the authenticated user.
     */
    async remove(req, res) {
        const { clientId } = req.params;

        if (!clientId) {
            return sendError(res, 400, 'clientId param is required');
        }

        const result = await Passkey.deleteOne({ userId: req.userId, clientId });
        if (result.deletedCount === 0) {
            return sendError(res, 404, 'Passkey not found');
        }

        logger.info(`Passkey deleted: userId=${req.userId} clientId=${clientId}`);
        return sendSuccess(res, 'Passkey deleted', {}, 200);
    }
}

module.exports = new PasskeyController();
