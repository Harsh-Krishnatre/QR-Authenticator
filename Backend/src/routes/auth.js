const express = require('express');

const router = express.Router();

const authController = require('../controllers/authController');

const {
  registrationValidation,
  patternSubmissionValidation,
  handleValidationErrors,
  ipValidation,
  requestSizeValidation,
} = require('../middleware/validation');

const {
  registrationLimiter,
  authLimiter,
  speedLimiter,
} = require('../middleware/rateLimiting');

const {
  securityLogging,
} = require('../middleware/security');

router.use(ipValidation);
router.use(requestSizeValidation);
router.use(securityLogging);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user with email and authentication method
 * @access  Public
 * @body    { email, authMethod, securityQuestions?, picturePattern? }
 */
router.post(
  '/register',
  registrationLimiter,
  speedLimiter,
  registrationValidation,
  handleValidationErrors,
  authController.registerUser,
);

/**
 * @route   POST /api/auth/submit-pattern
 * @desc    Submit number-color pattern to complete registration
 * @access  Public
 * @body    { email, hashedSecretCode, numberColorPattern }
 */
router.post(
  '/submit-pattern',
  authLimiter,
  patternSubmissionValidation,
  handleValidationErrors,
  authController.submitPattern,
);

/**
 * @route   GET /api/auth/registration-status/:email
 * @desc    Get registration status for an email
 * @access  Public
 * @param   {string} email - Email address to check
 */
router.get(
  '/registration-status/:email',
  authLimiter,
  authController.getRegistrationStatus,
);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification information for pending registrations
 * @access  Public
 * @body    { email }
 */
router.post(
  '/resend-verification',
  authLimiter,
  authController.resendVerification,
);

/**
 * @route   DELETE /api/auth/cleanup-pending
 * @desc    Clean up incomplete registrations (admin function)
 * @access  Private (Admin)
 * @note    This endpoint should be protected with admin authentication in production
 */
router.delete(
  '/cleanup-pending',
  authLimiter,
  authController.cleanupPendingRegistrations,
);

// Health check endpoint for auth routes
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authentication service is healthy',
    timestamp: new Date().toISOString(),
    service: 'auth',
    version: '1.0.0',
  });
});

module.exports = router;
