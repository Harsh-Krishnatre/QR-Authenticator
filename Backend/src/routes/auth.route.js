const express = require('express');
const { securityLogging } = require('../middleware/security');
const authController = require('../controllers/auth.controller');
const { registrationLimiter, authLimiter, speedLimiter } = require('../middleware/rateLimiting');
const {
    registrationValidation,
    patternSubmissionValidation,
    handleValidationErrors,
    ipValidation,
    requestSizeValidation,
    loginValidation,
    resetRequestValidation,
    resetCompletionValidation,
} = require('../middleware/validation');

const router = express.Router();

router.use(ipValidation);
router.use(requestSizeValidation);
router.use(securityLogging);

router.post('/register', registrationLimiter, speedLimiter, registrationValidation, handleValidationErrors, authController.registerUser);
router.post('/submit-pattern', authLimiter, patternSubmissionValidation, handleValidationErrors, authController.submitPattern);
router.get('/registration-status/:email', authLimiter, authController.getRegistrationStatus);
router.post('/resend-verification', authLimiter, authController.resendVerification);
router.post('/login', authLimiter, loginValidation, handleValidationErrors, authController.requestLogin);
router.post('/login/verify', authLimiter, patternSubmissionValidation, handleValidationErrors, authController.verifyLogin);
router.delete('/cleanup-pending', authLimiter, authController.cleanupPendingRegistrations);
router.post('/reset-request', authLimiter, resetRequestValidation, handleValidationErrors, authController.requestReset);
router.post('/reset-complete', authLimiter, resetCompletionValidation, handleValidationErrors, authController.completeReset);

module.exports = router;
