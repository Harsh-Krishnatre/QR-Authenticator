const express = require('express');
const logger = require('../utils/logger');
const settings = require('../config/settings');
const { sendSuccess, sendError } = require('../middleware/errorHandling');

const router = express.Router();

router.get('/security-questions', (req, res) => {
    try {
        const securityQuestions = settings.SECURITY_QUESTIONS || [];

        return sendSuccess(
            res,
            'Security questions fetched successfully!',
            {
                securityQuestions,
                length: securityQuestions.length,
            },
            200,
        );
    } catch (error) {
        logger.error('Sequrity question error:', error);
        return sendError(res, 500, 'Failed to fetch security questions');
    }
});

module.exports = router;
