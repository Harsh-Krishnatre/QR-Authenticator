# Authentication Backend

A secure MERN stack backend for authentication with registration, login, and reset flows featuring advanced security patterns.

## Features

### 🔐 Security Features
- **Comprehensive Input Validation** with express-validator
- **Rate Limiting** with tiered protection
- **SQL/NoSQL Injection Prevention**
- **XSS Protection** with content sanitization
- **CSRF Protection** via secure headers
- **Helmet Security Headers**
- **IP Filtering** and monitoring
- **Secure Password Hashing** with bcrypt (salt rounds: 12)
- **JWT Authentication** with secure token generation
- **Request Size Validation**
- **Content Type Validation**

### 🚀 Registration Flow
1. **User Registration**: Email + Authentication method selection
2. **Secret Code Generation**: Cryptographically secure codes
3. **Authentication Methods**:
   - Security Questions (minimum 3)
   - Picture Pattern Selection
4. **Pattern Selection**: Number-color pattern (4-8 elements)
5. **Account Activation**: Complete registration process

### 📊 Database Features
- **MongoDB** with Mongoose ODM
- **Comprehensive User Schema** with validation
- **Indexed Fields** for performance
- **Account Locking** mechanism
- **Session Management** with device tracking
- **Audit Trail** with IP logging
- **Automatic Cleanup** of expired data

## Prerequisites

- Node.js (>= 18.0.0)
- MongoDB (>= 4.4)
- npm or yarn

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd authentication-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Copy `.env` file and update with your settings:
   ```env
   # Environment Variables
   NODE_ENV=development
   PORT=5000

   # Database
   MONGODB_URI=mongodb://localhost:27017/authentication-app

   # Security
   JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
   JWT_EXPIRE=7d
   BCRYPT_SALT_ROUNDS=12

   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=noreply@yourdomain.com

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # Token Expiry
   RESET_TOKEN_EXPIRE=600000
   OTP_TOKEN_EXPIRE=600000

   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   # ... (see .env file for all variables)
   ```

4. **Start MongoDB**:
   Make sure MongoDB is running on your system

5. **Run the application**:
   ```bash
   # Development mode with nodemon
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/register`
Register a new user with email and authentication method.

**Request Body**:
```json
{
  "email": "user@example.com",
  "authMethod": "security_questions", // or "picture_pattern"
  "securityQuestions": [ // Required if authMethod is "security_questions"
    {
      "question": "What is the name of your first pet?",
      "answer": "Buddy"
    }
    // ... minimum 3 questions
  ],
  "picturePattern": { // Required if authMethod is "picture_pattern"
    "selectedImages": [1, 2, 3, 4],
    "metadata": {
      "gridSize": "3x3",
      "complexity": "medium"
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "User registration initiated successfully",
  "data": {
    "email": "user@example.com",
    "hashedSecretCode": "hashed_secret_code",
    "authMethod": "security_questions",
    "nextStep": "pattern_selection"
  }
}
```

#### POST `/api/auth/submit-pattern`
Submit number-color pattern to complete registration.

**Request Body**:
```json
{
  "email": "user@example.com",
  "hashedSecretCode": "hashed_secret_code_from_registration",
  "numberColorPattern": [
    { "number": 1, "color": "red" },
    { "number": 2, "color": "blue" },
    { "number": 3, "color": "green" },
    { "number": 4, "color": "yellow" }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Registration completed successfully",
  "data": {
    "email": "user@example.com",
    "authMethod": "security_questions",
    "accountStatus": "active"
  }
}
```

#### GET `/api/auth/registration-status/:email`
Check registration status for an email.

**Response**:
```json
{
  "success": true,
  "message": "Registration status retrieved",
  "data": {
    "exists": true,
    "status": "active",
    "authMethod": "security_questions"
  }
}
```

### Health Check Routes

#### GET `/health`
Server health check endpoint.

#### GET `/`
Welcome message and API information.

## Security Configuration

### Rate Limiting
- **General API**: 100 requests per 15 minutes
- **Authentication**: 20 requests per 15 minutes
- **Registration**: 3 requests per hour
- **Reset**: 5 requests per hour

### Validation Rules
- **Email**: RFC 5322 compliant validation
- **Security Questions**: Minimum 3, predefined list
- **Picture Pattern**: 4-9 images, valid grid sizes
- **Number-Color Pattern**: 4-8 elements, valid colors/numbers

### Security Headers
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy

## Project Structure

```
src/
├── config/
│   ├── database.js          # MongoDB connection
│   └── colors.js            # Console colors utility
├── controllers/
│   └── authController.js    # Authentication logic
├── middleware/
│   ├── validation.js        # Input validation
│   ├── rateLimiting.js      # Rate limiting
│   ├── security.js          # Security middleware
│   └── errorHandling.js     # Error handling
├── models/
│   └── User.js              # User schema
├── routes/
│   └── auth.js              # Authentication routes
└── utils/
    └── helpers.js           # Utility functions
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/authentication-app` |
| `JWT_SECRET` | JWT signing secret | **REQUIRED** |
| `JWT_EXPIRE` | JWT expiration time | `7d` |
| `BCRYPT_SALT_ROUNDS` | Bcrypt salt rounds | `12` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## Error Handling

The API provides comprehensive error handling with:
- **Validation Errors**: Field-specific validation messages
- **Authentication Errors**: Token and credential issues
- **Rate Limit Errors**: Request limiting responses
- **Database Errors**: Connection and operation failures
- **Security Errors**: Suspicious activity detection

## Logging and Monitoring

- **Security Incident Logging**: Suspicious activities
- **Request Logging**: Security-sensitive endpoints
- **Error Logging**: Comprehensive error tracking
- **Performance Monitoring**: Request timing and metrics

## Development

### Available Scripts
- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon
- `npm test`: Run tests (Jest)
- `npm run lint`: Run ESLint
- `npm run lint:fix`: Fix ESLint issues

### Code Quality
- **ESLint**: Airbnb configuration
- **Input Sanitization**: XSS and injection prevention
- **Data Validation**: Comprehensive input validation
- **Error Boundaries**: Graceful error handling

## Production Deployment

### Security Checklist
- [ ] Change all default secrets and keys
- [ ] Configure MongoDB with authentication
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Review and restrict CORS origins
- [ ] Configure rate limiting based on traffic
- [ ] Set up log rotation and monitoring
- [ ] Enable database backups
- [ ] Configure environment-specific settings

### Performance Optimization
- [ ] Enable gzip compression
- [ ] Set up database indexing
- [ ] Configure connection pooling
- [ ] Implement caching strategies
- [ ] Monitor memory usage
- [ ] Set up load balancing
- [ ] Configure CDN for static assets

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments for implementation details