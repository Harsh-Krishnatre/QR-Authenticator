# Backend API Guide

This guide documents the currently implemented backend API for the Authentication System.

## Base Information

- Base URL (local): `http://localhost:5000`
- API version prefix: `/api/v1`
- Content type for write endpoints: `application/json`
- Request body limit: `1mb`

## Global Middleware and Behavior

All routes are protected by global middleware in this order:

1. Compression (`compression`)
2. Security headers (`helmet`)
3. IP filtering
4. CORS origin validation
5. JSON and URL-encoded parser limits
6. Content-Type validation for `POST`, `PUT`, `PATCH`
7. Request sanitization and XSS cleanup
8. NoSQL injection sanitization

Auth routes (`/api/v1/auth/*`) additionally apply:

1. Client IP validation (`ipValidation`)
2. Request size validation (`requestSizeValidation`)
3. Security logging (`securityLogging`)

## Standard Response Format

### Success

```json
{
  "success": true,
  "message": "Human-readable success message",
  "timestamp": "2026-04-13T08:00:00.000Z",
  "data": {}
}
```

### Error (General)

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2026-04-13T08:00:00.000Z"
}
```

### Error (Validation Middleware)

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "fieldName": ["Validation message"]
  },
  "timestamp": "2026-04-13T08:00:00.000Z"
}
```

### Error (Unhandled/central error handler)

```json
{
  "success": false,
  "error": "Internal Server Error",
  "timestamp": "2026-04-13T08:00:00.000Z",
  "path": "/api/v1/auth/login/init",
  "method": "POST"
}
```

## Health and Meta Endpoints

## 1) Home

- Method: `GET`
- Path: `/api/v1`
- Description: API welcome payload and basic endpoint map.

Example response:

```json
{
  "success": true,
  "message": "Welcome to Authentication API",
  "timestamp": "2026-04-13T08:00:00.000Z",
  "data": {
    "message": "Secure authentication system",
    "version": "1.0.0",
    "documentation": "/api/v1/docs",
    "endpoints": {
      "health": "/api/v1/health",
      "auth": "/api/v1/auth"
    }
  }
}
```

## 2) Health Check

- Method: `GET`
- Path: `/api/v1/health`
- Description: Server health state and runtime details.

Example response:

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-04-13T08:00:00.000Z",
  "data": {
    "timestamp": "2026-04-13T08:00:00.000Z",
    "uptime": 155.813,
    "environment": "development",
    "version": "1.0.0",
    "database": "Connected"
  }
}
```

## 3) Security Questions Configuration

- Method: `GET`
- Path: `/api/v1/config/security-questions`
- Description: Returns allowed security questions from environment configuration.

Example response:

```json
{
  "success": true,
  "message": "Security questions fetched successfully!",
  "timestamp": "2026-04-13T08:00:00.000Z",
  "data": {
    "securityQuestions": [
      "What was your first school?",
      "What is your favorite movie?",
      "What is your mother's maiden name?"
    ],
    "length": 3
  }
}
```

## Authentication Endpoints

Base path: `/api/v1/auth`

## 1) Check Email Availability

- Method: `POST`
- Path: `/api/v1/auth/register/init`
- Description: Verifies if a user already exists before registration starts.
- Rate limit: Registration init limiter + speed limiter.

Request body:

```json
{
  "email": "user@example.com"
}
```

Success response (`200`):

```json
{
  "success": true,
  "message": "User not found",
  "timestamp": "2026-04-13T08:00:00.000Z",
  "data": {
    "exists": false,
    "email": "user@example.com"
  }
}
```

Common errors:

- `400`: Invalid email format
- `409`: User already exists with this email

## 2) Register Security Method

- Method: `POST`
- Path: `/api/v1/auth/register/security`
- Description: Creates user in `pending_verification` state and returns a temporary secret code.
- Rate limit: Registration limiter + speed limiter.

Request body (security questions method):

```json
{
  "email": "user@example.com",
  "authMethod": "security_questions",
  "securityQuestions": [
    {
      "question": "What was your first school?",
      "answer": "Green Valley"
    },
    {
      "question": "What is your favorite movie?",
      "answer": "Inception"
    },
    {
      "question": "What is your mother's maiden name?",
      "answer": "Sharma"
    }
  ]
}
```

Request body (picture pattern method):

```json
{
  "email": "user@example.com",
  "authMethod": "picture_pattern",
  "picturePattern": {
    "selectedImages": [1, 3, 5, 7],
    "metadata": {
      "gridSize": "3x3",
      "complexity": "medium"
    }
  }
}
```

Success response (`201`):

```json
{
  "success": true,
  "message": "User registration initiated successfully",
  "timestamp": "2026-04-13T08:00:00.000Z",
  "data": {
    "email": "user@example.com",
    "hashedSecretCode": "$2b$12$...",
    "authMethod": "security_questions",
    "nextStep": "pattern_selection",
    "message": "Please select your number-color pattern to complete registration"
  }
}
```

Common errors:

- `400`: Validation failed or invalid method/payload structure
- `409`: User already exists with this email address

## 3) Submit Number-Color Pattern (Complete Registration)

- Method: `POST`
- Path: `/api/v1/auth/register/submit-pattern`
- Description: Finalizes registration by saving number-color pattern and activating account.
- Rate limit: Auth limiter.

Request body:

```json
{
  "email": "user@example.com",
  "hashedSecretCode": "$2b$12$...",
  "numberColorPattern": [
    { "number": 1, "color": "red" },
    { "number": 5, "color": "blue" },
    { "number": 3, "color": "green" },
    { "number": 8, "color": "yellow" }
  ]
}
```

Success response (`200`):

```json
{
  "success": true,
  "message": "Registration completed successfully",
  "timestamp": "2026-04-13T08:00:00.000Z",
  "data": {
    "email": "user@example.com",
    "authMethod": "security_questions",
    "accountStatus": "active",
    "registeredAt": "2026-04-13T08:00:00.000Z",
    "message": "Your account has been created and activated. You can now log in."
  }
}
```

Common errors:

- `401`: Invalid secret code
- `404`: User not found
- `400`: Invalid number-color pattern or registration already completed

## 4) Initiate Login

- Method: `POST`
- Path: `/api/v1/auth/login/init`
- Description: Starts login session and returns one-time secret required for verification.
- Rate limit: Auth limiter.

Request body:

```json
{
  "email": "user@example.com"
}
```

Success response (`200`):

```json
{
  "success": true,
  "message": "Login initiated. Present QR to authenticator",
  "timestamp": "2026-04-13T08:00:00.000Z",
  "data": {
    "email": "user@example.com",
    "sessionId": "4dfc...",
    "hashedSecretCode": "237195",
    "expiresIn": 120
  }
}
```

Common errors:

- `404`: User not found, please signup first.
- `400`: Ongoing login attempt already exists

## 5) Verify Login

- Method: `POST`
- Path: `/api/v1/auth/login/verify`
- Description: Verifies one-time secret and number-color pattern. Creates active session token.
- Rate limit: Auth limiter.

Request body:

```json
{
  "email": "user@example.com",
  "hashedSecretCode": "237195",
  "numberColorPattern": [
    { "number": 1, "color": "red" },
    { "number": 5, "color": "blue" },
    { "number": 3, "color": "green" },
    { "number": 8, "color": "yellow" }
  ],
  "deviceType": "browser"
}
```

Success response (`200`):

```json
{
  "success": true,
  "message": "Login successful",
  "timestamp": "2026-04-13T08:00:00.000Z",
  "data": {
    "token": "session_token_id",
    "expiresAt": "2026-04-20T08:00:00.000Z"
  }
}
```

Common errors:

- `404`: User not found
- `401`: No active login attempt, invalid secret code, or pattern mismatch
- `400`: Invalid pattern payload or user has no registered number-color pattern

## 6) Poll Login Status

- Method: `GET`
- Path: `/api/v1/auth/login/status?sessionId=<sessionId>`
- Description: Poll endpoint for asynchronous login verification flow.

Success response (`200`):

```json
{
  "success": true,
  "message": "Login status retrieved",
  "timestamp": "2026-04-13T08:00:00.000Z",
  "data": {
    "status": "pending"
  }
}
```

When verified:

```json
{
  "success": true,
  "message": "Login status retrieved",
  "timestamp": "2026-04-13T08:00:00.000Z",
  "data": {
    "status": "verified"
  }
}
```

When expired:

```json
{
  "success": true,
  "message": "Login session expired",
  "timestamp": "2026-04-13T08:00:00.000Z",
  "data": {
    "status": "expired"
  }
}
```

Common errors:

- `400`: SessionId is required
- `404`: Login session not found

## 7) Cleanup Pending Registrations

- Method: `DELETE`
- Path: `/api/v1/auth/cleanup-pending`
- Description: Removes incomplete registrations older than 24 hours.
- Rate limit: Auth limiter.

Success response (`200`):

```json
{
  "success": true,
  "message": "Cleanup completed",
  "timestamp": "2026-04-13T08:00:00.000Z",
  "data": {
    "removedCount": 2,
    "message": "Removed 2 incomplete registrations older than 24 hours"
  }
}
```

## 8) Request Reset Token

- Method: `POST`
- Path: `/api/v1/auth/reset/request`
- Description: Creates reset token and triggers reset email.
- Rate limit: Auth limiter.

Request body:

```json
{
  "email": "user@example.com"
}
```

Success response (`200`):

```json
{
  "success": true,
  "message": "Reset email sent! Please check your inbox for instructions.",
  "timestamp": "2026-04-13T08:00:00.000Z",
  "data": {
    "email": "user@example.com"
  }
}
```

Test environment response includes reset token in `data.resetToken`.

Common errors:

- `404`: User not found with the given email
- `500`: Failed to create reset token

## 9) Verify Reset Token

- Method: `POST`
- Path: `/api/v1/auth/reset/verify`
- Description: Validates reset token before security method/pattern reset.
- Rate limit: Auth limiter.

Request body:

```json
{
  "resetToken": "plain_reset_token"
}
```

Success response (`200`):

```json
{
  "success": true,
  "message": "Reset token verified.",
  "timestamp": "2026-04-13T08:00:00.000Z"
}
```

Common errors:

- `404`: Invalid or expired reset token
- `400`: Reset token expired

## 10) Reset Security Method

- Method: `POST`
- Path: `/api/v1/auth/reset/security`
- Description: Replaces either security questions or picture pattern for user linked to reset token.
- Rate limit: Auth limiter.

Request body (security questions):

```json
{
  "resetToken": "plain_reset_token",
  "authMethod": "security_questions",
  "securityQuestions": [
    { "question": "What was your first school?", "answer": "Green Valley" },
    { "question": "What is your favorite movie?", "answer": "Inception" },
    { "question": "What is your mother's maiden name?", "answer": "Sharma" }
  ]
}
```

Request body (picture pattern):

```json
{
  "resetToken": "plain_reset_token",
  "authMethod": "picture_pattern",
  "picturePattern": {
    "selectedImages": [1, 4, 7, 8],
    "metadata": {
      "gridSize": "3x3",
      "complexity": "simple"
    }
  }
}
```

Success response (`200`):

```json
{
  "success": true,
  "message": "Reset security method successfully",
  "timestamp": "2026-04-13T08:00:00.000Z",
  "data": {
    "email": "user@example.com"
  }
}
```

Common errors:

- `404`: Invalid or expired reset token
- `400`: Token expired or invalid security payload

## 11) Reset Number-Color Pattern (Complete Reset)

- Method: `POST`
- Path: `/api/v1/auth/reset/complete`
- Description: Sets new number-color pattern and consumes reset token.
- Rate limit: Auth limiter.

Request body:

```json
{
  "resetToken": "plain_reset_token",
  "numberColorPattern": [
    { "number": 1, "color": "red" },
    { "number": 5, "color": "blue" },
    { "number": 3, "color": "green" },
    { "number": 8, "color": "yellow" }
  ]
}
```

Success response (`200`):

```json
{
  "success": true,
  "message": "Reset number color pattern completed successfully",
  "timestamp": "2026-04-13T08:00:00.000Z",
  "data": {
    "email": "user@example.com"
  }
}
```

Common errors:

- `404`: Invalid or expired reset token
- `400`: Reset token already used, token expired, or invalid pattern

## Validation Rules Summary

### Email

- Must match email regex validation
- Trimmed and normalized to lowercase
- Length constraints apply in registration flow

### Authentication Method

- Allowed values: `security_questions`, `picture_pattern`

### Security Questions

- Minimum 3 entries
- Each entry requires `question` and `answer`
- Questions must exist in configured allowed list
- Duplicate questions are rejected
- Answer length: 2 to 100 characters

### Picture Pattern

- Requires `selectedImages` and `metadata`
- `selectedImages` length: 4 to 9
- Allowed `metadata.gridSize`: `3x3`, `4x4`, `5x5`
- Allowed `metadata.complexity`: `simple`, `medium`, `complex`

### Number-Color Pattern

- Must be an array of objects
- Allowed length: 4 to 8
- Each element must contain `number` and `color`

## Rate Limiting Summary

The auth routes use endpoint-level limiters:

- Registration init: 30 requests / 5 minutes
- Registration submit security: 3 requests / 10 minutes
- Auth general limiter for most auth endpoints: 20 requests / 5 minutes
- Speed limiter (progressive delay): starts after 5 requests in 15 minutes

A rate-limited response contains an error payload with retry guidance.

## CORS and Client Requirements

- Origin must match configured frontend URL (`FRONTEND_URL`) unless request has no origin
- Credentials are enabled
- Allowed methods: `GET, POST, PUT, DELETE, OPTIONS`
- Allowed headers include `Content-Type` and `Authorization`

## Non-Existing Routes

Any unknown path returns `404` with:

- `error: Route not found`
- Requested method/path details
- List of available endpoint groups

## Suggested Postman Collection Structure

- Health
- Config
- Auth Register
- Auth Login
- Auth Reset
- Maintenance

Use environment variable `baseUrl` set to `http://localhost:5000/api/v1`.
