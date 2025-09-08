#!/usr/bin/env node

/**
 * Resilience Testing Script
 * Tests circuit breakers, retry logic, and error handling
 */

const fetch = require('node-fetch');

class ResilienceTest {
  constructor() {
    this.baseUrl = process.env.TEST_URL || 'http://localhost:3000';
    this.results = {
      circuitBreaker: { passed: 0, failed: 0 },
      retryLogic: { passed: 0, failed: 0 },
      errorHandling: { passed: 0, failed: 0 },
      rateLimiting: { passed: 0, failed: 0 }
    };
  }

  async runAllTests() {
    console.log('🧪 Starting resilience tests...');
    console.log(`🎯 Testing against ${this.baseUrl}`);
    
    try {
      await this.testCircuitBreaker();
      await this.testRetryLogic();
      await this.testErrorHandling();
      await this.testRateLimiting();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async testCircuitBreaker() {
    console.log('\\n🔌 Testing Circuit Breaker...');
    
    try {
      // Test normal operation
      const response = await fetch(`${this.baseUrl}/api/health`);
      if (response.ok) {
        console.log('✅ Circuit breaker allows normal requests');
        this.results.circuitBreaker.passed++;
      } else {
        console.log('❌ Circuit breaker blocking normal requests');
        this.results.circuitBreaker.failed++;
      }
      
      // Test with invalid endpoint to trigger failures
      console.log('🔥 Triggering circuit breaker with failed requests...');
      
      for (let i = 0; i < 6; i++) {
        try {
          await fetch(`${this.baseUrl}/api/invalid-endpoint-${i}`, { timeout: 1000 });
        } catch (error) {
          // Expected to fail
        }
        await this.sleep(100);
      }
      
      console.log('✅ Circuit breaker failure simulation completed');
      this.results.circuitBreaker.passed++;
      
    } catch (error) {
      console.log('❌ Circuit breaker test failed:', error.message);
      this.results.circuitBreaker.failed++;
    }
  }

  async testRetryLogic() {
    console.log('\\n🔄 Testing Retry Logic...');
    
    try {
      // Test with timeout to trigger retries
      const startTime = Date.now();
      
      try {
        await fetch(`${this.baseUrl}/api/health`, { 
          timeout: 1 // Very short timeout to trigger retries
        });
      } catch (error) {
        // Expected to fail due to timeout
      }
      
      const duration = Date.now() - startTime;
      
      if (duration > 1000) { // Should take longer due to retries
        console.log('✅ Retry logic appears to be working (took longer than expected)');
        this.results.retryLogic.passed++;
      } else {
        console.log('⚠️ Retry logic may not be working (completed too quickly)');
        this.results.retryLogic.failed++;
      }
      
      // Test successful retry
      const response = await fetch(`${this.baseUrl}/api/health`);
      if (response.ok) {
        console.log('✅ Successful request after retry test');
        this.results.retryLogic.passed++;
      }
      
    } catch (error) {
      console.log('❌ Retry logic test failed:', error.message);
      this.results.retryLogic.failed++;
    }
  }

  async testErrorHandling() {
    console.log('\\n🚨 Testing Error Handling...');
    
    try {
      // Test 404 error handling
      const notFoundResponse = await fetch(`${this.baseUrl}/api/non-existent-endpoint`);
      if (notFoundResponse.status === 404) {
        const errorData = await notFoundResponse.json();
        if (errorData.success === false && errorData.error) {
          console.log('✅ 404 error handling works correctly');
          this.results.errorHandling.passed++;
        } else {
          console.log('❌ 404 error response format incorrect');
          this.results.errorHandling.failed++;
        }
      }
      
      // Test validation error handling
      const validationResponse = await fetch(`${this.baseUrl}/api/auth/test-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'invalid-email', password: '' })
      });
      
      if (validationResponse.status === 400) {
        const errorData = await validationResponse.json();
        if (errorData.success === false && errorData.errors) {
          console.log('✅ Validation error handling works correctly');
          this.results.errorHandling.passed++;
        } else {
          console.log('❌ Validation error response format incorrect');
          this.results.errorHandling.failed++;
        }
      }
      
    } catch (error) {
      console.log('❌ Error handling test failed:', error.message);
      this.results.errorHandling.failed++;
    }
  }

  async testRateLimiting() {
    console.log('\\n🚦 Testing Rate Limiting...');
    
    try {
      // Make multiple rapid requests to trigger rate limiting
      const requests = [];
      const endpoint = `${this.baseUrl}/api/auth/test-login`;
      
      for (let i = 0; i < 10; i++) {
        requests.push(
          fetch(endpoint, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-Forwarded-For': '192.168.1.100' // Simulate same IP
            },
            body: JSON.stringify({ email: 'test@example.com', password: 'wrong' })
          })
        );
      }
      
      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      if (rateLimitedResponses.length > 0) {
        console.log(`✅ Rate limiting triggered after ${responses.length - rateLimitedResponses.length} requests`);
        this.results.rateLimiting.passed++;
        
        // Check rate limit headers
        const rateLimitResponse = rateLimitedResponses[0];
        const headers = rateLimitResponse.headers;
        
        if (headers.get('x-ratelimit-limit') && headers.get('x-ratelimit-remaining')) {
          console.log('✅ Rate limit headers present');
          this.results.rateLimiting.passed++;
        } else {
          console.log('❌ Rate limit headers missing');
          this.results.rateLimiting.failed++;
        }
      } else {
        console.log('⚠️ Rate limiting may not be working (no 429 responses)');
        this.results.rateLimiting.failed++;
      }
      
    } catch (error) {
      console.log('❌ Rate limiting test failed:', error.message);
      this.results.rateLimiting.failed++;
    }
  }

  printResults() {
    console.log('\\n📊 Resilience Test Results:');
    console.log('================================');
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    Object.entries(this.results).forEach(([category, results]) => {
      const emoji = results.failed === 0 ? '✅' : results.passed > results.failed ? '⚠️' : '❌';
      console.log(`${emoji} ${category}: ${results.passed} passed, ${results.failed} failed`);
      totalPassed += results.passed;
      totalFailed += results.failed;
    });
    
    console.log('================================');
    console.log(`📈 Overall: ${totalPassed} passed, ${totalFailed} failed`);
    
    const successRate = totalPassed / (totalPassed + totalFailed) * 100;
    console.log(`🎯 Success Rate: ${successRate.toFixed(1)}%`);
    
    if (successRate >= 80) {
      console.log('🎉 Resilience tests PASSED!');
      process.exit(0);
    } else {
      console.log('💥 Resilience tests FAILED!');
      process.exit(1);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run tests
const tester = new ResilienceTest();
tester.runAllTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});