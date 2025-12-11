const request = require('supertest');
const app = require('../server');

describe('Smoke tests', () => {
  it('GET /health should return 200 and server status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message');
  });
});
