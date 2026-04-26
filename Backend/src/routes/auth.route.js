const express = require('express');
const { securityLogging, requireAuth } = require('../middleware/security');
const authController = require('../controllers/auth.controller');
const {
    registrationInitLimiter,
    registrationLimiter,
    authLimiter,
    speedLimiter,
} = require('../middleware/rateLimiting');
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

router.post('/check-email', authLimiter, loginValidation, handleValidationErrors, authController.checkEmailRegistered);
router.post('/register/init', registrationInitLimiter, speedLimiter, authController.checkUserExist);
router.post('/register/security', registrationLimiter, speedLimiter, registrationValidation, handleValidationErrors, authController.registerUser);
router.post('/register/submit-pattern', authLimiter, patternSubmissionValidation, handleValidationErrors, authController.submitPattern);
router.post('/login/password', authLimiter, loginValidation, handleValidationErrors, authController.loginWithPassword);
router.post('/login/passkey', authLimiter, loginValidation, handleValidationErrors, authController.loginWithPasskey);
router.post('/login/init', authLimiter, loginValidation, handleValidationErrors, authController.requestLogin);
router.post('/login/verify', authLimiter, patternSubmissionValidation, handleValidationErrors, authController.verifyLogin);
router.get('/login/status', handleValidationErrors, authController.loginStatus);
router.delete('/cleanup-pending', authLimiter, authController.cleanupPendingRegistrations);
router.post('/reset/request', authLimiter, resetRequestValidation, handleValidationErrors, authController.requestReset);
router.post('/reset/verify', authLimiter, handleValidationErrors, authController.resetTokenVerify);
router.post('/reset/security', authLimiter, handleValidationErrors, authController.handleSecurityMethodReset);
router.post('/reset/complete', authLimiter, resetCompletionValidation, handleValidationErrors, authController.handlePatternReset);
router.put('/profile', requireAuth, authController.updateProfile);

module.exports = router;
