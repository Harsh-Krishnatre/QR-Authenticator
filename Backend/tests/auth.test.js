const request = require('supertest');
const app = require('../server');
const User = require('../src/models/User');

// Mock MongoDB connection for testing
jest.mock('../src/config/database', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(true)
}));

describe('Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return server health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Server is running');
      expect(response.body.data).toHaveProperty('timestamp');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a user with security questions', async () => {
      // Mock User.findByEmail to return null (user doesn't exist)
      User.findByEmail = jest.fn().mockResolvedValue(null);

      const userData = {
        email: 'test@example.com',
        authMethod: 'security_questions',
        securityQuestions: [
          {
            question: 'What is the name of your first pet?',
            answer: 'Buddy'
          },
          {
            question: 'What was the name of your elementary school?',
            answer: 'Lincoln Elementary'
          },
          {
            question: 'In which city were you born?',
            answer: 'New York'
          }
        ]
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('hashedSecretCode');
    });

    it('should return error for duplicate email', async () => {
      // Mock User.findByEmail to return existing user
      User.findByEmail = jest.fn().mockResolvedValue({ email: 'test@example.com' });

      const userData = {
        email: 'test@example.com',
        authMethod: 'security_questions',
        securityQuestions: []
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          authMethod: 'security_questions',
          securityQuestions: []
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should require minimum security questions', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          authMethod: 'security_questions',
          securityQuestions: [
            {
              question: 'What is the name of your first pet?',
              answer: 'Buddy'
            }
          ]
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

// Basic test setup
describe('Server Setup', () => {
  it('should start without errors', () => {
    expect(app).toBeDefined();
  });
});