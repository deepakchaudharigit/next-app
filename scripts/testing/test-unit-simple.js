#!/usr/bin/env node

/**
 * Simple Unit Test for Rate Limiting
 * Tests core functionality without Jest dependencies
 */

// Simple test framework
class SimpleTest {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }
  
  test(name, fn) {
    this.tests.push({ name, fn });
  }
  
  async run() {
    console.log('🧪 Simple Rate Limiting Unit Tests');
    console.log('===================================');
    console.log('');
    
    for (const { name, fn } of this.tests) {
      try {
        await fn();
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
        this.failed++;
      }
    }
    
    console.log('');
    console.log('📊 Test Results');
    console.log('===============');
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(`Total: ${this.tests.length}`);
    
    if (this.failed === 0) {
      console.log('');
      console.log('🎉 All tests passed!');
    }
    
    return this.failed === 0;
  }
}

// Simple assertion functions
function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
  }
}

function assertTrue(value, message = '') {
  if (!value) {
    throw new Error(`Expected true, got ${value}. ${message}`);
  }
}

function assertFalse(value, message = '') {
  if (value) {
    throw new Error(`Expected false, got ${value}. ${message}`);
  }
}

// Mock rate limiter implementation for testing
class TestRateLimiter {
  constructor(config = {}) {
    this.windowMs = config.windowMs || 60000; // 1 minute
    this.maxAttempts = config.maxAttempts || 3;
    this.attempts = new Map();
  }
  
  checkLimit(identifier, ip = 'unknown') {
    const key = `${ip}:${identifier}`;
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.windowMs);
    
    let attempt = this.attempts.get(key);
    
    if (!attempt || attempt.firstAttempt < windowStart) {
      attempt = {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now,
        blocked: false
      };
    } else {
      attempt.attempts++;
      attempt.lastAttempt = now;
      
      if (attempt.attempts > this.maxAttempts) {
        attempt.blocked = true;
      }
    }
    
    this.attempts.set(key, attempt);
    
    const resetTime = new Date(attempt.firstAttempt.getTime() + this.windowMs);
    const remaining = Math.max(0, this.maxAttempts - attempt.attempts);
    
    return {
      allowed: !attempt.blocked,
      remaining,
      resetTime,
      totalAttempts: attempt.attempts,
      blocked: attempt.blocked
    };
  }
  
  reset(identifier, ip = 'unknown') {
    const key = `${ip}:${identifier}`;
    this.attempts.delete(key);
  }
  
  resetAll() {
    this.attempts.clear();
  }
  
  isBlocked(identifier, ip = 'unknown') {
    const key = `${ip}:${identifier}`;
    const attempt = this.attempts.get(key);
    
    if (!attempt) return false;
    
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.windowMs);
    
    if (attempt.firstAttempt < windowStart) {
      this.attempts.delete(key);
      return false;
    }
    
    return attempt.blocked;
  }
}

// Create test suite
const test = new SimpleTest();

// Basic rate limiting tests
test.test('should allow requests within limit', () => {
  const limiter = new TestRateLimiter({ maxAttempts: 3 });
  
  const result1 = limiter.checkLimit('test@example.com', '127.0.0.1');
  assertEqual(result1.allowed, true);
  assertEqual(result1.remaining, 2);
  assertEqual(result1.totalAttempts, 1);
  
  const result2 = limiter.checkLimit('test@example.com', '127.0.0.1');
  assertEqual(result2.allowed, true);
  assertEqual(result2.remaining, 1);
  assertEqual(result2.totalAttempts, 2);
  
  const result3 = limiter.checkLimit('test@example.com', '127.0.0.1');
  assertEqual(result3.allowed, true);
  assertEqual(result3.remaining, 0);
  assertEqual(result3.totalAttempts, 3);
});

test.test('should block requests after limit exceeded', () => {
  const limiter = new TestRateLimiter({ maxAttempts: 3 });
  
  // Make 3 allowed attempts
  limiter.checkLimit('test@example.com', '127.0.0.1');
  limiter.checkLimit('test@example.com', '127.0.0.1');
  limiter.checkLimit('test@example.com', '127.0.0.1');
  
  // 4th attempt should be blocked
  const result = limiter.checkLimit('test@example.com', '127.0.0.1');
  assertEqual(result.allowed, false);
  assertEqual(result.blocked, true);
  assertEqual(result.remaining, 0);
  assertEqual(result.totalAttempts, 4);
});

test.test('should track different identifiers separately', () => {
  const limiter = new TestRateLimiter({ maxAttempts: 3 });
  
  // Make attempts for first email
  limiter.checkLimit('test1@example.com', '127.0.0.1');
  limiter.checkLimit('test1@example.com', '127.0.0.1');
  limiter.checkLimit('test1@example.com', '127.0.0.1');
  
  // First email should be at limit
  const result1 = limiter.checkLimit('test1@example.com', '127.0.0.1');
  assertEqual(result1.allowed, false);
  
  // Second email should still be allowed
  const result2 = limiter.checkLimit('test2@example.com', '127.0.0.1');
  assertEqual(result2.allowed, true);
  assertEqual(result2.totalAttempts, 1);
});

test.test('should track different IPs separately', () => {
  const limiter = new TestRateLimiter({ maxAttempts: 3 });
  const email = 'test@example.com';
  
  // Make attempts from first IP
  limiter.checkLimit(email, '127.0.0.1');
  limiter.checkLimit(email, '127.0.0.1');
  limiter.checkLimit(email, '127.0.0.1');
  
  // First IP should be at limit
  const result1 = limiter.checkLimit(email, '127.0.0.1');
  assertEqual(result1.allowed, false);
  
  // Second IP should still be allowed
  const result2 = limiter.checkLimit(email, '192.168.1.1');
  assertEqual(result2.allowed, true);
  assertEqual(result2.totalAttempts, 1);
});

test.test('should reset specific identifier', () => {
  const limiter = new TestRateLimiter({ maxAttempts: 3 });
  
  // Make attempts to reach limit
  limiter.checkLimit('test@example.com', '127.0.0.1');
  limiter.checkLimit('test@example.com', '127.0.0.1');
  limiter.checkLimit('test@example.com', '127.0.0.1');
  
  // Should be at limit
  const blockedResult = limiter.checkLimit('test@example.com', '127.0.0.1');
  assertEqual(blockedResult.allowed, false);
  
  // Reset the identifier
  limiter.reset('test@example.com', '127.0.0.1');
  
  // Should be allowed again
  const allowedResult = limiter.checkLimit('test@example.com', '127.0.0.1');
  assertEqual(allowedResult.allowed, true);
  assertEqual(allowedResult.totalAttempts, 1);
});

test.test('should reset all identifiers', () => {
  const limiter = new TestRateLimiter({ maxAttempts: 3 });
  
  // Make attempts for multiple identifiers
  limiter.checkLimit('test1@example.com', '127.0.0.1');
  limiter.checkLimit('test2@example.com', '127.0.0.1');
  
  // Reset all
  limiter.resetAll();
  
  // Both should start fresh
  const result1 = limiter.checkLimit('test1@example.com', '127.0.0.1');
  const result2 = limiter.checkLimit('test2@example.com', '127.0.0.1');
  
  assertEqual(result1.totalAttempts, 1);
  assertEqual(result2.totalAttempts, 1);
});

test.test('should correctly identify blocked identifiers', () => {
  const limiter = new TestRateLimiter({ maxAttempts: 3 });
  
  // Make attempts to reach limit
  limiter.checkLimit('test@example.com', '127.0.0.1');
  limiter.checkLimit('test@example.com', '127.0.0.1');
  limiter.checkLimit('test@example.com', '127.0.0.1');
  limiter.checkLimit('test@example.com', '127.0.0.1'); // This should block
  
  assertTrue(limiter.isBlocked('test@example.com', '127.0.0.1'));
  assertFalse(limiter.isBlocked('other@example.com', '127.0.0.1'));
});

test.test('should handle window expiration', async () => {
  const limiter = new TestRateLimiter({ 
    windowMs: 100, // 100ms for testing
    maxAttempts: 2 
  });
  
  // Make attempts to reach limit
  limiter.checkLimit('test@example.com', '127.0.0.1');
  limiter.checkLimit('test@example.com', '127.0.0.1');
  
  // Should be at limit
  const blockedResult = limiter.checkLimit('test@example.com', '127.0.0.1');
  assertEqual(blockedResult.allowed, false);
  
  // Wait for window to expire
  await new Promise(resolve => setTimeout(resolve, 150));
  
  // Should be allowed again
  const allowedResult = limiter.checkLimit('test@example.com', '127.0.0.1');
  assertEqual(allowedResult.allowed, true);
  assertEqual(allowedResult.totalAttempts, 1);
});

// Run the tests
async function main() {
  const success = await test.run();
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});