/**
 * Live Server Testing Utilities
 * Helper functions for testing against a running Next.js server
 */

// Using fetch instead of axios for better compatibility
type RequestConfig = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

type Response = {
  status: number;
  data: any;
  headers: Record<string, string>;
};

// Configuration
const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3000';
const DEFAULT_TIMEOUT = 10000;

export interface LiveTestConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  auth?: {
    email: string;
    password: string;
  };
}

export class LiveServerClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  private authToken?: string;

  constructor(config: LiveTestConfig = {}) {
    this.baseURL = config.baseURL || SERVER_URL;
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  private async makeRequest(url: string, config: RequestConfig = {}): Promise<Response> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    const headers = {
      ...this.defaultHeaders,
      ...config.headers,
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(fullUrl, {
        method: config.method || 'GET',
        headers,
        body: config.body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        status: response.status,
        data,
        headers: responseHeaders,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Authenticate with the server (similar to login in Postman)
   */
  async authenticate(email: string, password: string): Promise<boolean> {
    try {
      const response = await this.post('/api/auth/signin', {
        email,
        password,
      });

      if (response.status === 200 && response.data.success) {
        this.authToken = response.data.token;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  /**
   * Test API endpoints (like Postman collections)
   */
  async get(url: string, config: RequestConfig = {}): Promise<Response> {
    return this.makeRequest(url, { ...config, method: 'GET' });
  }

  async post(url: string, data?: any, config: RequestConfig = {}): Promise<Response> {
    const body = data ? JSON.stringify(data) : undefined;
    return this.makeRequest(url, { ...config, method: 'POST', body });
  }

  async put(url: string, data?: any, config: RequestConfig = {}): Promise<Response> {
    const body = data ? JSON.stringify(data) : undefined;
    return this.makeRequest(url, { ...config, method: 'PUT', body });
  }

  async delete(url: string, config: RequestConfig = {}): Promise<Response> {
    return this.makeRequest(url, { ...config, method: 'DELETE' });
  }

  /**
   * Health check (like testing server status in Postman)
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/api/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Set auth token manually
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clear auth token
   */
  clearAuth(): void {
    this.authToken = undefined;
  }

  /**
   * Get current auth status
   */
  isAuthenticated(): boolean {
    return !!this.authToken;
  }
}

/**
 * Test helper functions
 */
export const liveTestHelpers = {
  /**
   * Wait for server to be ready
   */
  async waitForServer(maxAttempts = 10, interval = 2000): Promise<boolean> {
    const client = new LiveServerClient();
    
    for (let i = 0; i < maxAttempts; i++) {
      const isReady = await client.healthCheck();
      if (isReady) return true;
      
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    return false;
  },

  /**
   * Create test user for live testing
   */
  async createTestUser(client: LiveServerClient, userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<Response> {
    return client.post('/api/auth/register', userData);
  },

  /**
   * Clean up test data
   */
  async cleanupTestData(client: LiveServerClient, userEmail: string): Promise<void> {
    // Implementation depends on your cleanup API
    try {
      await client.delete(`/api/test/cleanup?email=${userEmail}`);
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  },

  /**
   * Assert response structure (like Postman tests)
   */
  assertResponse: {
    success(response: Response): void {
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    },

    error(response: Response, expectedStatus: number): void {
      expect(response.status).toBe(expectedStatus);
      expect(response.data).toHaveProperty('success', false);
    },

    hasData(response: Response): void {
      expect(response.data).toHaveProperty('data');
      expect(response.data.data).toBeDefined();
    },

    hasMessage(response: Response): void {
      expect(response.data).toHaveProperty('message');
      expect(typeof response.data.message).toBe('string');
    },
  },
};

/**
 * Live test suite builder (like Postman collection)
 */
export class LiveTestSuite {
  private client: LiveServerClient;
  private testResults: Array<{ name: string; passed: boolean; error?: string }> = [];

  constructor(config?: LiveTestConfig) {
    this.client = new LiveServerClient(config);
  }

  async runTest(name: string, testFn: (client: LiveServerClient) => Promise<void>): Promise<void> {
    try {
      await testFn(this.client);
      this.testResults.push({ name, passed: true });
      console.log(`✅ ${name}`);
    } catch (error) {
      this.testResults.push({ 
        name, 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      console.log(`❌ ${name}: ${error}`);
      throw error;
    }
  }

  getResults() {
    return this.testResults;
  }

  getSummary() {
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    return { passed, failed: total - passed, total };
  }
}

export default LiveServerClient;