const { body, validationResult } = require('express-validator');
const User = require('../models/User');

class Validation {
  constructor() {
    this.customValidators = this._buildCustomValidators();

    this.registrationValidation = [
      body('email').trim().isLength({ min: 5, max: 254 }).withMessage('Email must be between 5 and 254 characters')
        .custom(this.customValidators.emailValidator)
        .normalizeEmail()
        .custom(async (email) => { const existingUser = await User.findByEmail(email); if (existingUser) throw new Error('An account with this email already exists'); return true; }),
      body('authMethod').isIn(['security_questions', 'picture_pattern']).withMessage('Authentication method must be either security_questions or picture_pattern'),
      body('securityQuestions').if((value, { req }) => req.body.authMethod === 'security_questions').custom(this.customValidators.securityQuestionValidator),
      body('picturePattern').if((value, { req }) => req.body.authMethod === 'picture_pattern').custom(this.customValidators.picturePatternValidator),
      body('numberColorPattern').optional().custom(this.customValidators.numberColorPatternValidator),
    ];

    this.patternSubmissionValidation = [
      body('email').trim().custom(this.customValidators.emailValidator).normalizeEmail(),
      body('hashedSecretCode').isLength({ min: 60 }).withMessage('Invalid secret code format'),
      body('numberColorPattern').exists().withMessage('Number-color pattern is required').custom(this.customValidators.numberColorPatternValidator),
    ];

    this.loginValidation = [body('email').trim().custom(this.customValidators.emailValidator).normalizeEmail()];
    this.resetRequestValidation = [body('email').trim().custom(this.customValidators.emailValidator).normalizeEmail()];

    this.resetCompletionValidation = [
      body('resetToken').isLength({ min: 32, max: 64 }).withMessage('Invalid reset token format'),
      body('authMethod').isIn(['security_questions', 'picture_pattern']).withMessage('Authentication method must be either security_questions or picture_pattern'),
      body('securityQuestions').if((value, { req }) => req.body.authMethod === 'security_questions').custom(this.customValidators.securityQuestionValidator),
      body('picturePattern').if((value, { req }) => req.body.authMethod === 'picture_pattern').custom(this.customValidators.picturePatternValidator),
      body('numberColorPattern').exists().withMessage('Number-color pattern is required').custom(this.customValidators.numberColorPatternValidator),
    ];
  }

  _buildCustomValidators() {
    return {
      emailValidator: (email) => {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!emailRegex.test(email)) throw new Error('Please provide a valid email address');
        return true;
      },

      securityQuestionValidator: (questions) => {
        if (!Array.isArray(questions) || questions.length < 3) throw new Error('At least 3 security questions are required');
        const validQuestions = ['What is the name of your first pet?', 'What was the name of your elementary school?', 'In which city were you born?', "What is your mother's maiden name?", 'What was the make of your first car?', 'What is the name of your best friend from childhood?', 'What street did you grow up on?', 'What is your favorite book?', 'What was your first job?', 'What is the name of your favorite teacher?'];
        for (const qa of questions) {
          if (!qa.question || !qa.answer) throw new Error('Each security question must have both question and answer');
          if (!validQuestions.includes(qa.question)) throw new Error('Invalid security question selected');
          if (qa.answer.length < 2 || qa.answer.length > 100) throw new Error('Security answers must be between 2 and 100 characters');
        }
        const questionSet = new Set(questions.map((qa) => qa.question));
        if (questionSet.size !== questions.length) throw new Error('Duplicate security questions are not allowed');
        return true;
      },

      picturePatternValidator: (pattern) => {
        if (!pattern || !pattern.selectedImages || !pattern.metadata) throw new Error('Complete picture pattern information is required');
        const { selectedImages, metadata } = pattern;
        if (!Array.isArray(selectedImages) || selectedImages.length < 4 || selectedImages.length > 9) throw new Error('Picture pattern must have between 4 and 9 images');
        if (!metadata.gridSize || !['3x3', '4x4', '5x5'].includes(metadata.gridSize)) throw new Error('Invalid grid size for picture pattern');
        if (!metadata.complexity || !['simple', 'medium', 'complex'].includes(metadata.complexity)) throw new Error('Invalid complexity level for picture pattern');
        return true;
      },

      numberColorPatternValidator: (pattern) => {
        if (!pattern || !Array.isArray(pattern) || pattern.length < 4 || pattern.length > 8) throw new Error('Number-color pattern must have between 4 and 8 elements');
        const validColors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'cyan'];
        const validNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (const element of pattern) {
          if (!element.number || !element.color) throw new Error('Each pattern element must have both number and color');
          if (!validNumbers.includes(element.number)) throw new Error('Pattern numbers must be between 1 and 9');
          if (!validColors.includes(element.color)) throw new Error('Invalid color in pattern');
        }
        return true;
      },
    };
  }

  handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedErrors = {};
      errors.array().forEach((err) => { const field = err.param || err.path || 'general'; if (!extractedErrors[field]) extractedErrors[field] = []; extractedErrors[field].push(err.msg); });
      return res.status(400).json({
        success: false, error: 'Validation failed', details: extractedErrors, timestamp: new Date().toISOString(),
      });
    }
    next();
  }

  ipValidation(req, res, next) {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    if (!clientIP) return res.status(400).json({ success: false, error: 'Unable to determine client IP address' });
    req.clientIP = clientIP;
    next();
  }

  requestSizeValidation(req, res, next) {
    const contentLength = parseInt(req.get('Content-Length') || 0, 10);
    const maxSize = 1024 * 1024;
    if (contentLength > maxSize) return res.status(413).json({ success: false, error: 'Request payload too large' });
    next();
  }
}

const validation = new Validation();

module.exports = {
  registrationValidation: validation.registrationValidation,
  patternSubmissionValidation: validation.patternSubmissionValidation,
  loginValidation: validation.loginValidation,
  resetRequestValidation: validation.resetRequestValidation,
  resetCompletionValidation: validation.resetCompletionValidation,
  handleValidationErrors: validation.handleValidationErrors.bind(validation),
  ipValidation: validation.ipValidation.bind(validation),
  requestSizeValidation: validation.requestSizeValidation.bind(validation),
  customValidators: validation.customValidators,
};
