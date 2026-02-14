const express = require('express');
const { sendSuccess } = require('../middleware/errorHandling');

const router = express.Router();

router.get('/', (req, res) => {
    sendSuccess(res, 'Welcome to Authentication API', {
        message: 'Secure authentication system',
        version: '1.0.0',
        documentation: '/api/v1/docs',
        endpoints: {
            health: '/api/v1/health',
            auth: '/api/v1/auth',
        },
    }, 200);
});

module.exports = router;
