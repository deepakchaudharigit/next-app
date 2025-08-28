#!/usr/bin/env node

/**
 * Quick Rate Limiting Test
 * Simple test without complex dependencies
 */

const http = require('http');
const https = require('https');

// Configuration
const config = {
  baseUrl: process.env.TEST_URL || 'http://localhost:3000',
  email: process.env.TEST_EMAIL || 'test@example.com',
  password: 'wrongpassword',
  attempts: 8,
  delay: 1000
};

console.log('🔒 Quick Rate Limiting Test');
console.log('============================');
console.log(`Target: ${config.baseUrl}/api/auth/test-login`);
console.log(`Email: ${config.email}`);
console.log(`Attempts: ${config.attempts}`);
console.log('');

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
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
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
            body: jsonBody
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            body: { message: body }
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(postData);
    req.end();
  });
}

// Sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main test function
async function runTest() {
  const results = [];
  
  for (let i = 1; i <= config.attempts; i++) {
    try {
      console.log(`Attempt ${i}/${config.attempts}...`);
      
      const response = await makeRequest(`${config.baseUrl}/api/auth/test-login`, {
        email: config.email,
        password: config.password
      });
      
      const result = {
        attempt: i,
        status: response.status,
        success: response.body.success || false,
        message: response.body.message || '',
        rateLimited: response.status === 429,
        rateLimitInfo: response.body.rateLimitInfo || null
      };
      
      results.push(result);
      
      // Log result
      const statusIcon = result.rateLimited ? '🚫' : 
                        result.success ? '✅' : '❌';
      
      console.log(`  ${statusIcon} Status: ${result.status} | ${result.message}`);
      
      if (result.rateLimited && result.rateLimitInfo) {
        console.log(`     Rate Limited: ${result.rateLimitInfo.totalAttempts} attempts, retry after ${result.rateLimitInfo.retryAfter}s`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      results.push({
        attempt: i,
        status: 0,
        success: false,
        message: error.message,
        rateLimited: false,
        error: true
      });
    }
    
    // Wait before next attempt
    if (i < config.attempts) {
      await sleep(config.delay);
    }
  }
  
  // Summary
  console.log('');
  console.log('📊 Results Summary');
  console.log('==================');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success && !r.rateLimited && !r.error).length;
  const rateLimited = results.filter(r => r.rateLimited).length;
  const errors = results.filter(r => r.error).length;
  
  console.log(`Successful: ${successful}`);
  console.log(`Failed (Auth): ${failed}`);
  console.log(`Rate Limited: ${rateLimited}`);
  console.log(`Errors: ${errors}`);
  
  const firstRateLimited = results.find(r => r.rateLimited);
  if (firstRateLimited) {
    console.log(`Rate limiting triggered at attempt: ${firstRateLimited.attempt}`);
    
    if (firstRateLimited.attempt <= 6) {
      console.log('✅ Rate limiting working correctly');
    } else {
      console.log('⚠️  Rate limiting triggered later than expected');
    }
  } else {
    console.log('⚠️  No rate limiting detected');
  }
  
  console.log('');
  console.log('✅ Test completed');
}

// Check if server is running first
async function checkServer() {
  try {
    console.log('Checking server availability...');
    
    // First try health endpoint
    let response;
    try {
      response = await makeRequest(`${config.baseUrl}/api/health`, {});
    } catch (healthError) {
      // If health endpoint fails, try the test endpoint directly
      console.log('Health endpoint not available, testing API directly...');
      response = await makeRequest(`${config.baseUrl}/api/auth/test-login`, {
        email: 'test@example.com',
        password: 'test'
      });
    }
    
    // Check if we got a JSON response (API working) or HTML (wrong server)
    const isJsonResponse = response.body && (typeof response.body === 'object' || 
      (typeof response.body === 'string' && response.body.trim().startsWith('{')));
    
    if (response.status >= 200 && response.status < 500 && isJsonResponse) {
      console.log('✅ Server is running');
      return true;
    } else if (typeof response.body === 'string' && response.body.includes('<!doctype html>')) {
      console.log('❌ Server is running but serving HTML instead of API');
      console.log('   This suggests the wrong application is running.');
      console.log('');
      console.log('Please check:');
      console.log('  1. Are you in the correct directory?');
      console.log('  2. Is the Next.js app running? (npm run dev)');
      console.log('  3. Is another app running on port 3000?');
      console.log('');
      return false;
    } else {
      console.log(`❌ Server returned unexpected response (status ${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Server is not available: ${error.message}`);
    console.log('');
    console.log('Please start the server first:');
    console.log('  npm run dev');
    console.log('');
    return false;
  }
}

// Run the test
async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    process.exit(1);
  }
  
  console.log('');
  await runTest();
}

main().catch(error => {
  console.error('Test failed:', error.message);
  process.exit(1);
});