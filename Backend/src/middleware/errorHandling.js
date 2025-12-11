// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error Stack:', err.stack);
  
  // Default error response
  let error = { ...err };
  error.message = err.message;

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      name: 'ValidationError',
      message,
      statusCode: 400
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = {
      name: 'DuplicateError',
      message,
      statusCode: 400
    };
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID format';
    error = {
      name: 'CastError',
      message,
      statusCode: 400
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid authentication token';
    error = {
      name: 'AuthenticationError',
      message,
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Authentication token has expired';
    error = {
      name: 'AuthenticationError',
      message,
      statusCode: 401
    };
  }

  // Rate limit errors
  if (err.status === 429) {
    error = {
      name: 'RateLimitError',
      message: 'Too many requests, please try again later',
      statusCode: 429,
      retryAfter: err.retryAfter || 900
    };
  }

  // MongoDB connection errors
  if (err.name === 'MongooseError' || err.name === 'MongoError') {
    error = {
      name: 'DatabaseError',
      message: 'Database operation failed',
      statusCode: 500
    };
  }

  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    error = {
      name: 'CORSError',
      message: 'Cross-origin request blocked',
      statusCode: 403
    };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      name: 'FileSizeError',
      message: 'File size too large',
      statusCode: 413
    };
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Don't expose sensitive error details in production
  const responseError = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add error details for development
  if (process.env.NODE_ENV === 'development') {
    responseError.stack = err.stack;
    responseError.details = error;
  }

  // Add retry information for rate limit errors
  if (statusCode === 429) {
    responseError.retryAfter = error.retryAfter;
  }

  // Log critical errors
  if (statusCode >= 500) {
    console.error(`[CRITICAL ERROR] ${new Date().toISOString()} - ${req.ip} - ${req.method} ${req.originalUrl}`, {
      error: err.message,
      stack: err.stack,
      user: req.user?.email || 'Anonymous'
    });
  }

  res.status(statusCode).json(responseError);
};

// 404 handler for undefined routes
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    timestamp: new Date().toISOString(),
    availableEndpoints: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/submit-pattern',
        'POST /api/auth/login',
        'POST /api/auth/logout',
        'POST /api/auth/reset-request',
        'POST /api/auth/reset-complete'
      ],
      general: [
        'GET /api/health',
        'GET /'
      ]
    }
  });
};

// Async error wrapper to catch errors in async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error class for API errors
class APIError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Helper function to send error responses
const sendError = (res, statusCode, message, details = null) => {
  const response = {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  };

  if (details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

// Helper function to send success responses
const sendSuccess = (res, statusCode = 200, message, data = null) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

// Validation error formatter
const formatValidationErrors = (errors) => {
  const formattedErrors = {};
  
  errors.forEach(error => {
    const field = error.param || error.path || 'general';
    if (!formattedErrors[field]) {
      formattedErrors[field] = [];
    }
    formattedErrors[field].push(error.msg || error.message);
  });
  
  return formattedErrors;
};

// Database error handler
const handleDatabaseError = (error) => {
  console.error('Database Error:', error);
  
  // Check if it's a connection error
  if (error.name === 'MongooseError' || error.message.includes('connection')) {
    return new APIError('Database connection failed. Please try again later.', 503);
  }
  
  // Check if it's a validation error
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(err => err.message);
    return new APIError(`Validation failed: ${messages.join(', ')}`, 400);
  }
  
  // Generic database error
  return new APIError('Database operation failed', 500);
};

// Security error logger
const logSecurityIncident = (req, type, details) => {
  const timestamp = new Date().toISOString();
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  console.warn(`[SECURITY INCIDENT] ${timestamp} - Type: ${type} - IP: ${clientIP} - UA: ${userAgent} - Details: ${JSON.stringify(details)}`);
  
  // In production, you might want to send this to a security monitoring service
  // or store it in a dedicated security log database
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  APIError,
  sendError,
  sendSuccess,
  formatValidationErrors,
  handleDatabaseError,
  logSecurityIncident
};