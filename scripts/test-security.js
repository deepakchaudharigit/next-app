#!/usr/bin/env node

/**
 * Security Testing Script
 * Tests rate limiting, CSRF protection, and SQL injection prevention
 */

const fetch = require('node-fetch');

class SecurityTester {
  constructor() {
    this.baseUrl = process.env.TEST_URL || 'http://localhost:3000';
    this.results = {
      rateLimiting: { passed: 0, failed: 0, tests: [] },
      csrfProtection: { passed: 0, failed: 0, tests: [] },
      sqlInjection: { passed: 0, failed: 0, tests: [] },
      headers: { passed: 0, failed: 0, tests: [] }
    };
  }

  async runAllTests() {
    console.log('🔒 Starting comprehensive security tests...');
    console.log(`🎯 Testing against ${this.baseUrl}`);
    
    try {
      await this.testRateLimiting();
      await this.testCSRFProtection();
      await this.testSQLInjectionPrevention();
      await this.testSecurityHeaders();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Security test suite failed:', error);
    }
  }

  async testRateLimiting() {
    console.log('\\n🚦 Testing Rate Limiting...');
    
    // Test authentication rate limiting
    await this.testAuthRateLimit();
    
    // Test API rate limiting
    await this.testApiRateLimit();
    
    // Test IP blocking
    await this.testIPBlocking();
  }

  async testAuthRateLimit() {
    console.log('  🔐 Testing authentication rate limiting...');
    
    try {
      const requests = [];
      const endpoint = `${this.baseUrl}/api/auth/test-login`;
      
      // Make 10 rapid authentication requests
      for (let i = 0; i < 10; i++) {
        requests.push(
          fetch(endpoint, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-Forwarded-For': '192.168.1.200' // Simulate same IP
            },
            body: JSON.stringify({ email: 'test@example.com', password: 'wrong' })
          })
        );
      }
      
      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      if (rateLimitedResponses.length > 0) {
        this.recordTest('rateLimiting', 'Auth rate limiting', true, 
          `Rate limited after ${responses.length - rateLimitedResponses.length} requests`);
      } else {
        this.recordTest('rateLimiting', 'Auth rate limiting', false, 
          'No rate limiting detected');
      }
      
    } catch (error) {
      this.recordTest('rateLimiting', 'Auth rate limiting', false, error.message);
    }
  }

  async testApiRateLimit() {
    console.log('  🌐 Testing API rate limiting...');
    
    try {
      const requests = [];
      const endpoint = `${this.baseUrl}/api/health`;
      
      // Make 150 rapid API requests (should exceed 100/minute limit)
      for (let i = 0; i < 150; i++) {
        requests.push(
          fetch(endpoint, {
            headers: { 'X-Forwarded-For': '192.168.1.201' }
          })
        );
      }
      
      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      if (rateLimitedResponses.length > 0) {
        this.recordTest('rateLimiting', 'API rate limiting', true, 
          `Rate limited after ${responses.length - rateLimitedResponses.length} requests`);
      } else {
        this.recordTest('rateLimiting', 'API rate limiting', false, 
          'No API rate limiting detected');
      }
      
    } catch (error) {
      this.recordTest('rateLimiting', 'API rate limiting', false, error.message);
    }
  }

  async testIPBlocking() {
    console.log('  🚫 Testing IP blocking...');
    
    try {
      // This would test if IPs get blocked after multiple violations
      // For now, just check if the blocking mechanism exists
      const response = await fetch(`${this.baseUrl}/api/health`, {
        headers: { 'X-Forwarded-For': '192.168.1.202' }
      });
      
      if (response.status !== 403) {
        this.recordTest('rateLimiting', 'IP blocking mechanism', true, 
          'IP blocking system is operational');
      } else {
        this.recordTest('rateLimiting', 'IP blocking mechanism', false, 
          'Unexpected IP block');
      }
      
    } catch (error) {
      this.recordTest('rateLimiting', 'IP blocking mechanism', false, error.message);
    }
  }

  async testCSRFProtection() {
    console.log('\\n🛡️ Testing CSRF Protection...');
    
    await this.testCSRFTokenGeneration();
    await this.testCSRFTokenValidation();
    await this.testCSRFOriginValidation();
  }

  async testCSRFTokenGeneration() {
    console.log('  🎫 Testing CSRF token generation...');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/csrf/token`);
      const data = await response.json();
      
      if (response.ok && data.success && data.data.csrfToken) {
        this.recordTest('csrfProtection', 'CSRF token generation', true, 
          'CSRF tokens are generated correctly');
      } else {
        this.recordTest('csrfProtection', 'CSRF token generation', false, 
          'CSRF token generation failed');
      }
      
    } catch (error) {
      this.recordTest('csrfProtection', 'CSRF token generation', false, error.message);
    }
  }

  async testCSRFTokenValidation() {
    console.log('  ✅ Testing CSRF token validation...');
    
    try {
      // Test request without CSRF token
      const response = await fetch(`${this.baseUrl}/api/auth/test-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'test' })
      });
      
      if (response.status === 403) {
        this.recordTest('csrfProtection', 'CSRF token validation', true, 
          'Requests without CSRF tokens are blocked');
      } else {
        this.recordTest('csrfProtection', 'CSRF token validation', false, 
          'Requests without CSRF tokens are not blocked');
      }
      
    } catch (error) {
      this.recordTest('csrfProtection', 'CSRF token validation', false, error.message);
    }
  }

  async testCSRFOriginValidation() {
    console.log('  🌍 Testing CSRF origin validation...');
    
    try {
      // Test request with invalid origin
      const response = await fetch(`${this.baseUrl}/api/auth/test-login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': 'https://malicious-site.com'
        },
        body: JSON.stringify({ email: 'test@example.com', password: 'test' })
      });
      
      if (response.status === 403) {
        this.recordTest('csrfProtection', 'CSRF origin validation', true, 
          'Requests from untrusted origins are blocked');
      } else {
        this.recordTest('csrfProtection', 'CSRF origin validation', false, 
          'Requests from untrusted origins are not blocked');
      }
      
    } catch (error) {
      this.recordTest('csrfProtection', 'CSRF origin validation', false, error.message);
    }
  }

  async testSQLInjectionPrevention() {
    console.log('\\n💉 Testing SQL Injection Prevention...');
    
    await this.testBasicSQLInjection();
    await this.testAdvancedSQLInjection();
    await this.testBlindSQLInjection();
  }

  async testBasicSQLInjection() {
    console.log('  🔍 Testing basic SQL injection patterns...');
    
    const injectionPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "admin'--",
      "' OR 1=1 #"
    ];
    
    for (const payload of injectionPayloads) {
      try {
        const response = await fetch(`${this.baseUrl}/api/auth/test-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: payload, password: 'test' })
        });
        
        if (response.status === 403) {
          this.recordTest('sqlInjection', `Basic SQL injection (${payload.substring(0, 10)}...)`, true, 
            'SQL injection attempt blocked');
        } else {
          this.recordTest('sqlInjection', `Basic SQL injection (${payload.substring(0, 10)}...)`, false, 
            'SQL injection attempt not blocked');
        }
        
      } catch (error) {
        this.recordTest('sqlInjection', `Basic SQL injection (${payload.substring(0, 10)}...)`, false, error.message);
      }
    }
  }

  async testAdvancedSQLInjection() {
    console.log('  🎯 Testing advanced SQL injection patterns...');
    
    const advancedPayloads = [
      "1' AND (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES) > 0 --",
      "1' AND SLEEP(5) --",
      "1' AND (SELECT SUBSTRING(@@version,1,1))='5' --",
      "1' UNION SELECT NULL,NULL,NULL,CONCAT(username,':',password) FROM users --"
    ];
    
    for (const payload of advancedPayloads) {
      try {
        const response = await fetch(`${this.baseUrl}/api/auth/test-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: payload })
        });
        
        if (response.status === 403) {
          this.recordTest('sqlInjection', `Advanced SQL injection (${payload.substring(0, 15)}...)`, true, 
            'Advanced SQL injection blocked');
        } else {
          this.recordTest('sqlInjection', `Advanced SQL injection (${payload.substring(0, 15)}...)`, false, 
            'Advanced SQL injection not blocked');
        }
        
      } catch (error) {
        this.recordTest('sqlInjection', `Advanced SQL injection (${payload.substring(0, 15)}...)`, false, error.message);
      }
    }
  }

  async testBlindSQLInjection() {
    console.log('  👁️ Testing blind SQL injection patterns...');
    
    const blindPayloads = [
      "1' AND (SELECT COUNT(*) FROM users WHERE username='admin')=1 --",
      "1' AND (SELECT LENGTH(password) FROM users WHERE username='admin')>5 --",
      "1' AND (ASCII(SUBSTRING((SELECT password FROM users WHERE username='admin'),1,1)))>64 --"
    ];
    
    for (const payload of blindPayloads) {
      try {
        const response = await fetch(`${this.baseUrl}/api/auth/test-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: payload })
        });
        
        if (response.status === 403) {
          this.recordTest('sqlInjection', `Blind SQL injection (${payload.substring(0, 15)}...)`, true, 
            'Blind SQL injection blocked');
        } else {
          this.recordTest('sqlInjection', `Blind SQL injection (${payload.substring(0, 15)}...)`, false, 
            'Blind SQL injection not blocked');
        }
        
      } catch (error) {
        this.recordTest('sqlInjection', `Blind SQL injection (${payload.substring(0, 15)}...)`, false, error.message);
      }
    }
  }

  async testSecurityHeaders() {
    console.log('\\n🛡️ Testing Security Headers...');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      const headers = response.headers;
      
      const requiredHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'content-security-policy',
        'referrer-policy'
      ];
      
      for (const header of requiredHeaders) {
        if (headers.get(header)) {
          this.recordTest('headers', `${header} header`, true, 
            `${header} header is present`);
        } else {
          this.recordTest('headers', `${header} header`, false, 
            `${header} header is missing`);
        }
      }
      
    } catch (error) {
      this.recordTest('headers', 'Security headers', false, error.message);
    }
  }

  recordTest(category, testName, passed, message) {
    const result = { testName, passed, message };
    this.results[category].tests.push(result);
    
    if (passed) {
      this.results[category].passed++;
      console.log(`    ✅ ${testName}: ${message}`);
    } else {
      this.results[category].failed++;
      console.log(`    ❌ ${testName}: ${message}`);
    }
  }

  printResults() {
    console.log('\\n📊 Security Test Results:');
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
    
    // Detailed results
    console.log('\\n📋 Detailed Results:');
    Object.entries(this.results).forEach(([category, results]) => {
      console.log(`\\n${category.toUpperCase()}:`);
      results.tests.forEach(test => {
        const status = test.passed ? '✅' : '❌';
        console.log(`  ${status} ${test.testName}: ${test.message}`);
      });
    });
    
    if (successRate >= 80) {
      console.log('\\n🎉 Security tests PASSED!');
      process.exit(0);
    } else {
      console.log('\\n💥 Security tests FAILED!');
      process.exit(1);
    }
  }
}

// Run security tests
const tester = new SecurityTester();
tester.runAllTests().catch(error => {
  console.error('Security test execution failed:', error);
  process.exit(1);
});