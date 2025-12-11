const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  }
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per window
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again in 15 minutes',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
});

// Very strict rate limiting for registration
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registration attempts per hour
  message: {
    success: false,
    error: 'Too many registration attempts, please try again in 1 hour',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiting for password reset
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 reset requests per hour
  message: {
    success: false,
    error: 'Too many reset attempts, please try again in 1 hour',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Login specific rate limiting with progressive delays
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per window
  message: {
    success: false,
    error: 'Too many login attempts, please try again in 15 minutes',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Progressive delay for repeated requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 5, // Allow 5 requests per window at full speed
  // Use function form for delayMs per express-slow-down v2 behavior
  delayMs: () => 500, // Add 500ms delay after delayAfter requests
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  skipSuccessfulRequests: true
});

// Custom rate limiter factory for specific endpoints
const createCustomLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: {
      success: false,
      error: 'Rate limit exceeded',
      retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false
  };

  return rateLimit({ ...defaultOptions, ...options });
};

// Dynamic rate limiter based on user status
const adaptiveRateLimiter = (req, res, next) => {
  // Get user's IP and check if they have been flagged
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // You can implement logic here to check if IP is flagged
  // For now, we'll use standard rate limiting
  return generalLimiter(req, res, next);
};

// Rate limiter for API endpoints with different tiers
const tieredRateLimiter = {
  // Tier 1: Public endpoints (most restrictive)
  public: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: {
      success: false,
      error: 'Too many requests from this IP for public endpoints',
      retryAfter: 900
    }
  }),

  // Tier 2: Authenticated endpoints (moderate)
  authenticated: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      success: false,
      error: 'Too many requests from authenticated user',
      retryAfter: 900
    }
  }),

  // Tier 3: Admin endpoints (least restrictive but still limited)
  admin: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: {
      success: false,
      error: 'Too many admin requests',
      retryAfter: 900
    }
  })
};

module.exports = {
  generalLimiter,
  authLimiter,
  registrationLimiter,
  resetLimiter,
  loginLimiter,
  speedLimiter,
  adaptiveRateLimiter,
  createCustomLimiter,
  tieredRateLimiter
};