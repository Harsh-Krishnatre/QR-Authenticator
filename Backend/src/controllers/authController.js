const User = require('../models/User');
const { 
  hashingUtils, 
  jwtUtils, 
  qrUtils, 
  validationUtils, 
  deviceUtils,
  timeUtils 
} = require('../utils/helpers');
const { 
  asyncHandler, 
  APIError, 
  sendSuccess, 
  sendError,
  logSecurityIncident 
} = require('../middleware/errorHandling');

/**
 * @desc    Register new user with email and authentication method
 * @route   POST /api/auth/register
 * @access  Public
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 */
const registerUser = asyncHandler(async (req, res) => {
  const { email, authMethod, securityQuestions, picturePattern } = req.body;
  
  // Log registration attempt
  console.log(`Registration attempt for email: ${email} with method: ${authMethod}`);

  try {
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      logSecurityIncident(req, 'DUPLICATE_REGISTRATION', { email });
      return sendError(res, 409, 'User already exists with this email address');
    }

    // Generate secure secret code
    const secretCode = hashingUtils.generateSecretCode();
    const hashedSecretCode = await hashingUtils.hashData(secretCode);

    // Prepare user data based on authentication method
    const userData = {
      email: email.toLowerCase().trim(),
      authMethod,
      hashedSecretCode,
      registrationIP: req.clientIP,
      accountStatus: 'pending_verification'
    };

    // Process authentication method specific data
    if (authMethod === 'security_questions') {
      if (!securityQuestions || !Array.isArray(securityQuestions) || securityQuestions.length < 3) {
        return sendError(res, 400, 'At least 3 security questions are required');
      }

      // Hash security answers
      const hashedAnswers = await Promise.all(
        securityQuestions.map(async (qa) => ({
          question: qa.question.trim(),
          hashedAnswer: await hashingUtils.hashData(qa.answer.toLowerCase().trim())
        }))
      );

      userData.securityAnswers = hashedAnswers;

    } else if (authMethod === 'picture_pattern') {
      if (!picturePattern || !picturePattern.selectedImages || !picturePattern.metadata) {
        return sendError(res, 400, 'Complete picture pattern information is required');
      }

      // Validate picture pattern
      const patternValidation = validationUtils.validatePattern(picturePattern.selectedImages);
      if (!patternValidation.isValid) {
        return sendError(res, 400, 'Invalid picture pattern', patternValidation.errors);
      }

      // Hash picture pattern
      const hashedPattern = await hashingUtils.hashPattern(picturePattern.selectedImages);
      
      userData.picturePattern = {
        hashedPattern,
        patternMetadata: picturePattern.metadata
      };
    }

    // Create user document (without number-color pattern yet)
    const user = new User(userData);
    
    // Validate user data
    await user.validate();
    
    // Save user to database
    await user.save();

    console.log(`User registered successfully: ${email}`);

    // Return success response with hashed secret code for pattern selection
    return sendSuccess(res, 201, 'User registration initiated successfully', {
      email: user.email,
      hashedSecretCode,
      authMethod: user.authMethod,
      nextStep: 'pattern_selection',
      message: 'Please select your number-color pattern to complete registration'
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return sendError(res, 400, 'Validation failed', validationErrors);
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return sendError(res, 409, 'User already exists with this email address');
    }
    
    // Generic error
    return sendError(res, 500, 'Registration failed. Please try again later.');
  }
});

/**
 * @desc    Submit number-color pattern to complete registration
 * @route   POST /api/auth/submit-pattern
 * @access  Public
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 */
const submitPattern = asyncHandler(async (req, res) => {
  const { email, hashedSecretCode, numberColorPattern } = req.body;
  
  console.log(`Pattern submission for email: ${email}`);

  try {
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      logSecurityIncident(req, 'PATTERN_SUBMISSION_USER_NOT_FOUND', { email });
      return sendError(res, 404, 'User not found');
    }

    // Verify the hashed secret code
    const isValidSecret = await hashingUtils.compareData(
      user.hashedSecretCode.replace(hashedSecretCode, ''), 
      hashedSecretCode
    );

    // For security, we'll verify the secret code differently
    if (user.hashedSecretCode !== hashedSecretCode) {
      logSecurityIncident(req, 'INVALID_SECRET_CODE', { email });
      return sendError(res, 401, 'Invalid secret code');
    }

    // Check if user is in pending verification state
    if (user.accountStatus !== 'pending_verification') {
      return sendError(res, 400, 'User registration already completed');
    }

    // Validate number-color pattern
    const patternValidation = validationUtils.validatePattern(numberColorPattern);
    if (!patternValidation.isValid) {
      return sendError(res, 400, 'Invalid number-color pattern', patternValidation.errors);
    }

    // Hash the number-color pattern
    const hashedPattern = await hashingUtils.hashPattern(numberColorPattern);

    // Update user with pattern and activate account
    user.numberColorPattern = {
      hashedPattern,
      patternLength: numberColorPattern.length
    };
    user.accountStatus = 'active';
    
    // Generate new secret code for future logins
    const newSecretCode = hashingUtils.generateSecretCode();
    user.hashedSecretCode = await hashingUtils.hashData(newSecretCode);

    await user.save();

    console.log(`Registration completed successfully for user: ${email}`);

    // Return success response
    return sendSuccess(res, 200, 'Registration completed successfully', {
      email: user.email,
      authMethod: user.authMethod,
      accountStatus: user.accountStatus,
      registeredAt: user.registeredAt,
      message: 'Your account has been created and activated. You can now log in.'
    });

  } catch (error) {
    console.error('Pattern submission error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return sendError(res, 400, 'Validation failed', validationErrors);
    }
    
    return sendError(res, 500, 'Failed to complete registration. Please try again.');
  }
});

/**
 * @desc    Get user registration status
 * @route   GET /api/auth/registration-status/:email
 * @access  Public
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 */
const getRegistrationStatus = asyncHandler(async (req, res) => {
  const { email } = req.params;

  try {
    // Validate email format
    if (!validationUtils.isValidEmail(email)) {
      return sendError(res, 400, 'Invalid email format');
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return sendSuccess(res, 200, 'Registration status retrieved', {
        exists: false,
        status: 'not_registered',
        message: 'No account found with this email address'
      });
    }

    // Return status without sensitive information
    return sendSuccess(res, 200, 'Registration status retrieved', {
      exists: true,
      status: user.accountStatus,
      authMethod: user.authMethod,
      registeredAt: user.registeredAt,
      message: user.accountStatus === 'pending_verification' 
        ? 'Registration pending pattern selection'
        : 'Account fully registered'
    });

  } catch (error) {
    console.error('Registration status error:', error);
    return sendError(res, 500, 'Failed to retrieve registration status');
  }
});

/**
 * @desc    Resend registration verification (for pending accounts)
 * @route   POST /api/auth/resend-verification
 * @access  Public
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 */
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {
    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // Check if account is pending verification
    if (user.accountStatus !== 'pending_verification') {
      return sendError(res, 400, 'Account verification not required');
    }

    // Generate new secret code
    const newSecretCode = hashingUtils.generateSecretCode();
    user.hashedSecretCode = await hashingUtils.hashData(newSecretCode);
    
    await user.save();

    console.log(`Verification resent for user: ${email}`);

    return sendSuccess(res, 200, 'Verification information resent', {
      email: user.email,
      hashedSecretCode: user.hashedSecretCode,
      message: 'Please complete your pattern selection to activate your account'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return sendError(res, 500, 'Failed to resend verification');
  }
});

/**
 * @desc    Cleanup incomplete registrations (admin function)
 * @route   DELETE /api/auth/cleanup-pending
 * @access  Private (Admin)
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 */
const cleanupPendingRegistrations = asyncHandler(async (req, res) => {
  try {
    // Delete users with pending verification older than 24 hours
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    const result = await User.deleteMany({
      accountStatus: 'pending_verification',
      createdAt: { $lt: cutoffTime }
    });

    console.log(`Cleanup completed: ${result.deletedCount} pending registrations removed`);

    return sendSuccess(res, 200, 'Cleanup completed', {
      removedCount: result.deletedCount,
      message: `Removed ${result.deletedCount} incomplete registrations older than 24 hours`
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return sendError(res, 500, 'Failed to cleanup pending registrations');
  }
});

module.exports = {
  registerUser,
  submitPattern,
  getRegistrationStatus,
  resendVerification,
  cleanupPendingRegistrations
};