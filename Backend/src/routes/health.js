const express = require('express');
const mongoose = require('mongoose');
const settings = require('../config/settings');
const { sendSuccess } = require('../middleware/errorHandling');

const router = express.Router();

router.get('/', (req, res) => {
    sendSuccess(res, 'Server is running', {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: settings.NODE_ENV,
        version: '1.0.0',
        database: mongoose.connection && mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    }, 200);
});

module.exports = router;
