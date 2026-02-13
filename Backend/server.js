const express = require('express');
const cors = require('cors');
const compression = require('compression');
const logger = require('./src/utils/logger');
const connectDB = require('./src/config/database');
const { corsOptions } = require('./src/middleware/security');
const {
    securityHeaders,
    noSQLInjectionPrevention,
    xssProtection,
    requestSanitization,
    ipFiltering,
    contentTypeValidation,
} = require('./src/middleware/security');
const { generalLimiter } = require('./src/middleware/rateLimiting');
const {
    errorHandler,
    notFoundHandler,
} = require('./src/middleware/errorHandling');
const homeRoutes = require('./src/routes/home');
const healthRoutes = require('./src/routes/health');
const authRoutes = require('./src/routes/auth');
const settings = require('./src/config/settings');

const app = express();

app.set('trust proxy', 1);

app.use(compression());

app.use(securityHeaders);
app.use(ipFiltering);

app.use(cors(corsOptions));

app.use(express.json({
    limit: '1mb',
    strict: true,
}));

app.use(express.urlencoded({
    extended: true,
    limit: '1mb',
}));

app.use(contentTypeValidation);
app.use(requestSanitization);
app.use(xssProtection);
app.use(noSQLInjectionPrevention);

app.use(generalLimiter);

app.use('/api/v1', homeRoutes);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

const startServer = async () => {
    try {
        const dbConnected = await connectDB();
        if (!dbConnected) {
            logger.warn('Warning: Could not connect to MongoDB - starting server in degraded mode');
        }

        const server = app.listen(settings.PORT, () => {
            logger.info(`Server running in ${settings.NODE_ENV} mode on port ${settings.PORT}`);
            logger.info(`Health check: http://localhost:${settings.PORT}/api/v1/health`);
            logger.info(`Auth API: http://localhost:${settings.PORT}/api/v1/auth`);
        });

        return server;
    } catch (error) {
        logger.error('Failed to start server:', error);
        if (settings.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};

if (require.main === module) {
    startServer();
}

module.exports = app;
