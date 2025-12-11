const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
    sendSuccess(res, 200, 'Welcome to Authentication API', {
        message: 'Secure MERN stack authentication system',
        version: '1.0.0',
        documentation: '/api/v1/docs',
        endpoints: {
            health: '/api/v1/health',
            auth: '/api/v1/auth',
        },
    });
});

module.exports = router;
