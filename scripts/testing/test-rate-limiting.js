#!/usr/bin/env node

/**
 * Rate Limiting Test Script for NPCL Dashboard
 * 
 * This script tests the rate limiting functionality by simulating multiple
 * authentication attempts and verifying the rate limiting behavior.
 * 
 * Usage:
 *   node scripts/testing/test-rate-limiting.js [options]
 * 
 * Options:
 *   --url <url>          Base URL of the application (default: http://localhost:3000)
 *   --email <email>      Email to test with (default: test@example.com)
 *   --password <pass>    Password to test with (default: wrongpassword)
 *   --attempts <num>     Number of attempts to make (default: 10)
 *   --delay <ms>         Delay between attempts in milliseconds (default: 1000)
 *   --endpoint <path>    Endpoint to test (default: /api/auth/test-login)
 *   --verbose            Enable verbose output
 *   --help               Show this help message
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Default configuration
const DEFAULT_CONFIG = {
  url: 'http://localhost:3000',
  email: 'test@example.com',
  password: 'wrongpassword',
  attempts: 10,
  delay: 1000,
  endpoint: '/api/auth/test-login',
  verbose: false
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--url':
        config.url = args[++i];
        break;
      case '--email':
        config.email = args[++i];
        break;
      case '--password':
        config.password = args[++i];
        break;
      case '--attempts':
        config.attempts = parseInt(args[++i], 10);
        break;
      case '--delay':
        config.delay = parseInt(args[++i], 10);
        break;
      case '--endpoint':
        config.endpoint = args[++i];
        break;
      case '--verbose':
        config.verbose = true;
        break;
      case '--help':
        showHelp();
        process.exit(0);
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        process.exit(1);
    }
  }
  
  return config;
}

function showHelp() {
  console.log(`
Rate Limiting Test Script for NPCL Dashboard

Usage: node scripts/testing/test-rate-limiting.js [options]

Options:
  --url <url>          Base URL of the application (default: http://localhost:3000)
  --email <email>      Email to test with (default: test@example.com)
  --password <pass>    Password to test with (default: wrongpassword)
  --attempts <num>     Number of attempts to make (default: 10)
  --delay <ms>         Delay between attempts in milliseconds (default: 1000)
  --endpoint <path>    Endpoint to test (default: /api/auth/test-login)
  --verbose            Enable verbose output
  --help               Show this help message

Examples:
  # Basic test with default settings
  node scripts/testing/test-rate-limiting.js

  # Test with specific email and more attempts
  node scripts/testing/test-rate-limiting.js --email user@npcl.com --attempts 15

  # Test with faster attempts (no delay)
  node scripts/testing/test-rate-limiting.js --delay 0

  # Test against production-like environment
  node scripts/testing/test-rate-limiting.js --url https://npcl-dashboard.com
`);
}

// Make HTTP request
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'NPCL-RateLimit-Tester/1.0'
      }
    };
    
    const req = client.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Format time duration
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

// Main test function
async function runRateLimitTest(config) {
  console.log('🔒 NPCL Dashboard Rate Limiting Test');
  console.log('=====================================');
  console.log(`Target URL: ${config.url}${config.endpoint}`);
  console.log(`Test Email: ${config.email}`);
  console.log(`Attempts: ${config.attempts}`);
  console.log(`Delay: ${formatDuration(config.delay)}`);
  console.log('');
  
  const results = [];
  const startTime = Date.now();
  
  for (let i = 1; i <= config.attempts; i++) {
    const attemptStart = Date.now();
    
    try {
      console.log(`Attempt ${i}/${config.attempts}...`);
      
      const response = await makeRequest(`${config.url}${config.endpoint}`, {
        email: config.email,
        password: config.password
      });
      
      const attemptDuration = Date.now() - attemptStart;
      
      const result = {
        attempt: i,
        status: response.status,
        duration: attemptDuration,
        success: response.body.success || false,
        message: response.body.message || '',
        rateLimited: response.status === 429,
        rateLimitInfo: response.body.rateLimitInfo || null
      };
      
      results.push(result);
      
      // Log result
      const statusIcon = result.rateLimited ? '🚫' : 
                        result.success ? '✅' : '❌';
      
      console.log(`  ${statusIcon} Status: ${result.status} | Duration: ${formatDuration(result.duration)} | ${result.message}`);
      
      if (result.rateLimited && result.rateLimitInfo) {
        console.log(`     Rate Limited: ${result.rateLimitInfo.totalAttempts} attempts, retry after ${result.rateLimitInfo.retryAfter}s`);
      }
      
      if (config.verbose && response.body) {
        console.log(`     Response:`, JSON.stringify(response.body, null, 2));
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      results.push({
        attempt: i,
        status: 0,
        duration: Date.now() - attemptStart,
        success: false,
        message: error.message,
        rateLimited: false,
        error: true
      });
    }
    
    // Wait before next attempt (except for last attempt)
    if (i < config.attempts && config.delay > 0) {
      await sleep(config.delay);
    }
  }
  
  const totalDuration = Date.now() - startTime;
  
  // Analyze results
  console.log('');
  console.log('📊 Test Results Summary');
  console.log('=======================');
  
  const successfulAttempts = results.filter(r => r.success).length;
  const failedAttempts = results.filter(r => !r.success && !r.rateLimited && !r.error).length;
  const rateLimitedAttempts = results.filter(r => r.rateLimited).length;
  const errorAttempts = results.filter(r => r.error).length;
  
  console.log(`Total Attempts: ${results.length}`);
  console.log(`Successful: ${successfulAttempts}`);
  console.log(`Failed (Auth): ${failedAttempts}`);
  console.log(`Rate Limited: ${rateLimitedAttempts}`);
  console.log(`Errors: ${errorAttempts}`);
  console.log(`Total Duration: ${formatDuration(totalDuration)}`);
  
  // Find when rate limiting started
  const firstRateLimited = results.find(r => r.rateLimited);
  if (firstRateLimited) {
    console.log(`Rate limiting triggered at attempt: ${firstRateLimited.attempt}`);
  }
  
  // Check if rate limiting is working as expected
  console.log('');
  console.log('🔍 Rate Limiting Analysis');
  console.log('=========================');
  
  if (rateLimitedAttempts === 0) {
    console.log('⚠️  WARNING: No rate limiting detected. This might indicate:');
    console.log('   - Rate limiting is not properly configured');
    console.log('   - The test email/password combination is valid');
    console.log('   - Rate limiting thresholds are higher than test attempts');
  } else {
    console.log('✅ Rate limiting is working correctly');
    
    // Expected behavior: rate limiting should start after 5 failed attempts
    if (firstRateLimited && firstRateLimited.attempt <= 6) {
      console.log('✅ Rate limiting triggered at expected threshold');
    } else {
      console.log('⚠️  Rate limiting triggered later than expected');
    }
  }
  
  // Performance analysis
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  console.log(`Average response time: ${formatDuration(avgDuration)}`);
  
  const rateLimitedDurations = results.filter(r => r.rateLimited).map(r => r.duration);
  if (rateLimitedDurations.length > 0) {
    const avgRateLimitDuration = rateLimitedDurations.reduce((sum, d) => sum + d, 0) / rateLimitedDurations.length;
    console.log(`Average rate-limited response time: ${formatDuration(avgRateLimitDuration)}`);
  }
  
  console.log('');
  console.log('✅ Rate limiting test completed');
  
  return results;
}

// Run the test
async function main() {
  try {
    const config = parseArgs();
    await runRateLimitTest(config);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { runRateLimitTest, parseArgs };