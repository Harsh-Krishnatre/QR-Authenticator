const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

// Security headers configuration
const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },

  // Referrer Policy
  referrerPolicy: {
    policy: ["no-referrer", "strict-origin-when-cross-origin"]
  },

  // Feature Policy / Permissions Policy
  permissionsPolicy: {
    features: {
      geolocation: ["'none'"],
      microphone: ["'none'"],
      camera: ["'none'"],
      payment: ["'none'"],
      usb: ["'none'"],
      magnetometer: ["'none'"],
      gyroscope: ["'none'"],
      accelerometer: ["'none'"]
    }
  }
});

// NoSQL injection prevention
const noSQLInjectionPrevention = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Potential NoSQL injection attempt detected from IP: ${req.ip}, Key: ${key}`);
  }
});

// XSS Protection middleware
const xssProtection = (req, res, next) => {
  // Set X-XSS-Protection header
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Validate and sanitize common XSS vectors
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Remove or escape potentially dangerous characters
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    }
    return value;
  };

  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
          } else {
            obj[key] = sanitizeValue(obj[key]);
          }
        }
      }
    };
    sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (req.query.hasOwnProperty(key)) {
        req.query[key] = sanitizeValue(req.query[key]);
      }
    }
  }

  next();
};

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001',
      'https://yourdomain.com' // Add your production domain
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS violation attempt from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-HTTP-Method-Override',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
};

// Request sanitization middleware
const requestSanitization = (req, res, next) => {
  // Remove null bytes
  const sanitizeString = (str) => {
    if (typeof str === 'string') {
      return str.replace(/\0/g, '');
    }
    return str;
  };

  // Recursively sanitize object
  const sanitizeObject = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'object') {
            sanitizeObject(obj[key]);
          } else {
            obj[key] = sanitizeString(obj[key]);
          }
        }
      }
    }
  };

  // Sanitize request body and query
  sanitizeObject(req.body);
  sanitizeObject(req.query);
  sanitizeObject(req.params);

  next();
};

// IP whitelisting/blacklisting middleware
const ipFiltering = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // List of blocked IPs (you can store this in database or environment variables)
  const blockedIPs = (process.env.BLOCKED_IPS || '').split(',').filter(ip => ip.trim());
  
  if (blockedIPs.includes(clientIP)) {
    console.warn(`Blocked IP attempt: ${clientIP}`);
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }
  
  next();
};

// Request logging for security monitoring
const securityLogging = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const method = req.method;
  const url = req.originalUrl;
  
  // Log security-sensitive requests
  if (method !== 'GET' || url.includes('auth') || url.includes('admin')) {
    console.log(`[SECURITY] ${timestamp} - ${clientIP} - ${method} ${url} - UA: ${userAgent}`);
  }
  
  next();
};

// Content type validation
const contentTypeValidation = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.get('Content-Type');
    
    if (!contentType) {
      return res.status(400).json({
        success: false,
        error: 'Content-Type header is required'
      });
    }
    
    // Only allow JSON content type for API endpoints
    if (!contentType.includes('application/json')) {
      return res.status(415).json({
        success: false,
        error: 'Unsupported Media Type. Only application/json is allowed'
      });
    }
  }
  
  next();
};

module.exports = {
  securityHeaders,
  noSQLInjectionPrevention,
  xssProtection,
  corsOptions,
  requestSanitization,
  ipFiltering,
  securityLogging,
  contentTypeValidation
};