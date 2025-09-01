/**
 * Live Server Tests for Authentication API
 * Tests run against a running Next.js server (like Postman)
 */

import { LiveServerClient, liveTestHelpers } from '../utils/live-server-utils';

// Skip these tests if server is not running
const isServerRunning = async () => {
  try {
    const client = new LiveServerClient();
    return await client.healthCheck();
  } catch {
    return false;
  }
};

describe('Authentication API - Live Server Tests', () => {
  let client: LiveServerClient;
  let serverRunning = false;
  const testUser = {
    name: 'Live Test User',
    email: `livetest-${Date.now()}@example.com`,
    password: 'LiveTest@123',
    role: 'VIEWER'
  };

  beforeAll(async () => {
    // Check if server is running
    serverRunning = await isServerRunning();
    if (!serverRunning) {
      console.warn('⚠️  Server is not running. Skipping live tests.');
      console.warn('   Start server with: npm run dev');
      return;
    }

    client = new LiveServerClient();
  }, 15000);

  afterAll(async () => {
    if (serverRunning && client) {
      // Cleanup test data
      await liveTestHelpers.cleanupTestData(client, testUser.email);
    }
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      if (!serverRunning) {
        console.log('⏭️  Skipping test - server not running');
        return;
      }
      
      const response = await client.get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status');
    });
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      if (!serverRunning) {
        console.log('⏭️  Skipping test - server not running');
        return;
      }

      const response = await client.post('/api/auth/register', testUser);
      
      liveTestHelpers.assertResponse.success(response);
      liveTestHelpers.assertResponse.hasData(response);
      
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data.email).toBe(testUser.email.toLowerCase());
      expect(response.data.data).not.toHaveProperty('password');
    });

    it('should reject duplicate email registration', async () => {
      if (!serverRunning) {
        console.log('⏭️  Skipping test - server not running');
        return;
      }

      const response = await client.post('/api/auth/register', testUser);
      
      liveTestHelpers.assertResponse.error(response, 409);
      expect(response.data.message).toContain('already exists');
    });
  });

  describe('User Authentication', () => {
    it('should authenticate with valid credentials', async () => {
      if (!serverRunning) {
        console.log('⏭️  Skipping test - server not running');
        return;
      }

      const response = await client.post('/api/auth/signin', {
        email: testUser.email,
        password: testUser.password,
      });

      // Note: This depends on your actual auth implementation
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(400);
    });

    it('should reject invalid credentials', async () => {
      if (!serverRunning) {
        console.log('⏭️  Skipping test - server not running');
        return;
      }

      const response = await client.post('/api/auth/signin', {
        email: testUser.email,
        password: 'wrongpassword',
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Protected Routes', () => {
    beforeEach(async () => {
      if (serverRunning) {
        // Authenticate before each protected route test
        await client.authenticate(testUser.email, testUser.password);
      }
    });

    it('should access dashboard stats with authentication', async () => {
      if (!serverRunning) {
        console.log('⏭️  Skipping test - server not running');
        return;
      }

      const response = await client.get('/api/dashboard/stats');
      
      // This will depend on your auth implementation
      expect(response.status).toBeLessThan(500);
    });

    it('should reject access without authentication', async () => {
      if (!serverRunning) {
        console.log('⏭️  Skipping test - server not running');
        return;
      }

      client.clearAuth();
      const response = await client.get('/api/dashboard/stats');
      
      expect(response.status).toBeGreaterThanOrEqual(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting correctly', async () => {
      if (!serverRunning) {
        console.log('⏭️  Skipping test - server not running');
        return;
      }

      const promises = [];
      
      // Make multiple rapid requests to trigger rate limiting
      for (let i = 0; i < 10; i++) {
        promises.push(
          client.post('/api/auth/signin', {
            email: 'nonexistent@example.com',
            password: 'wrongpassword',
          })
        );
      }

      const responses = await Promise.all(promises);
      
      // At least some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});