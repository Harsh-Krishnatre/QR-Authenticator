require('dotenv').config();
require('./src/config/colors');
console.log('server.js loaded - starting initialization');
const express = require('express');
const cors = require('cors');
const compression = require('compression');

// Import configuration and middleware
const db = require('./src/config/database');
const mongoose = require('mongoose');
const { corsOptions } = require('./src/middleware/security');
const { 
  securityHeaders, 
  noSQLInjectionPrevention, 
  xssProtection,
  requestSanitization,
  ipFiltering,
  contentTypeValidation
} = require('./src/middleware/security');
const { generalLimiter } = require('./src/middleware/rateLimiting');
const { 
  errorHandler, 
  notFoundHandler,
  sendSuccess 
} = require('./src/middleware/errorHandling');

// Import routes
const authRoutes = require('./src/routes/auth');

// Initialize Express app
const app = express();

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// Apply compression for better performance
app.use(compression());

// Security middleware (should be applied early)
app.use(securityHeaders);
app.use(ipFiltering);

// CORS configuration
app.use(cors(corsOptions));

// Request parsing middleware
app.use(express.json({ 
  limit: '1mb',
  strict: true
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '1mb' 
}));

// Content type validation
app.use(contentTypeValidation);

// Request sanitization and security
app.use(requestSanitization);
app.use(xssProtection);
app.use(noSQLInjectionPrevention);

// Rate limiting (apply after security middleware)
app.use(generalLimiter);

// Health check endpoint (before auth routes)
app.get('/api/health', (req, res) => {
  sendSuccess(res, 200, 'Server is running', {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    database: mongoose.connection && mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Welcome endpoint
app.get('/', (req, res) => {
  sendSuccess(res, 200, 'Welcome to Authentication API', {
    message: 'Secure MERN stack authentication system',
    version: '1.0.0',
    documentation: '/api/docs', // Future API documentation
    endpoints: {
      health: '/api/health',
      auth: '/api/auth'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last middleware)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB (do not hard-exit if DB is down; start in degraded mode)
    const dbConnected = await db();
    if (!dbConnected) {
      console.warn('Warning: Could not connect to MongoDB - starting server in degraded mode'.yellow);
    }

    // Start listening
    const server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Auth API: http://localhost:${PORT}/api/auth`);
    });

    // Graceful shutdown handling
    // const gracefulShutdown = (signal) => {
    //   console.log(`\n${signal} received. Shutting down gracefully...`.yellow);
      
    //   server.close((err) => {
    //     if (err) {
    //       console.error('Error during server shutdown:', err);
    //       process.exit(1);
    //     }
        
    //     console.log('HTTP server closed.'.cyan);
    //     process.exit(0);
    //   });

    //   // Force close after 30 seconds
    //   setTimeout(() => {
    //     console.error('Could not close connections in time, forcefully shutting down'.red);
    //     process.exit(1);
    //   }, 30000);
    // };

    // Handle different termination signals
    // process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    // process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    // process.on('uncaughtException', (err) => {
    //   console.error('Uncaught Exception:', err);
    //   gracefulShutdown('UNCAUGHT_EXCEPTION');
    // });

    // Handle unhandled promise rejections
    // process.on('unhandledRejection', (reason, promise) => {
    //   console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    //   gracefulShutdown('UNHANDLED_REJECTION');
    // });

    return server;

  } catch (error) {
    console.error('Failed to start server:', error);
    // Do not exit the process here to allow debugging and development workflows.
    // If you prefer to fail fast in production, you can re-enable process.exit(1)
    // when `process.env.NODE_ENV === 'production'`.
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;