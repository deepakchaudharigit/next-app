#!/usr/bin/env node

/**
 * Server Diagnostic Script
 * Checks what's actually running and diagnoses API issues
 */

const http = require('http');
const https = require('https');

console.log('🔍 Server Diagnostic Tool');
console.log('=========================');
console.log('');

// Configuration
const baseUrl = process.env.TEST_URL || 'http://localhost:3000';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NPCL-Diagnostic/1.0',
        ...options.headers
      },
      timeout: 10000
    };
    
    const req = client.request(requestOptions, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function checkEndpoint(path, method = 'GET', body = null) {
  try {
    console.log(`Checking ${method} ${path}...`);
    
    const options = { method };
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await makeRequest(`${baseUrl}${path}`, options);
    
    const isJson = response.headers['content-type']?.includes('application/json');
    const isHtml = response.headers['content-type']?.includes('text/html');
    
    console.log(`  Status: ${response.status}`);
    console.log(`  Content-Type: ${response.headers['content-type']}`);
    
    if (isJson) {
      try {
        const jsonBody = JSON.parse(response.body);
        console.log(`  ✅ JSON Response:`, JSON.stringify(jsonBody, null, 2).substring(0, 200) + '...');
      } catch {
        console.log(`  ❌ Invalid JSON:`, response.body.substring(0, 100) + '...');
      }
    } else if (isHtml) {
      console.log(`  ❌ HTML Response (not API):`, response.body.substring(0, 100) + '...');
    } else {
      console.log(`  ❓ Other Response:`, response.body.substring(0, 100) + '...');
    }
    
    return { success: isJson, status: response.status, contentType: response.headers['content-type'] };
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log(`Base URL: ${baseUrl}`);
  console.log('');
  
  // Test various endpoints
  const tests = [
    { path: '/', description: 'Root page' },
    { path: '/api', description: 'API root' },
    { path: '/api/health', description: 'Health check' },
    { path: '/api/auth', description: 'Auth API root' },
    { path: '/api/auth/test-login', method: 'GET', description: 'Test login GET' },
    { 
      path: '/api/auth/test-login', 
      method: 'POST', 
      body: { email: 'test@example.com', password: 'wrongpassword' },
      description: 'Test login POST' 
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n📍 ${test.description}`);
    console.log('─'.repeat(40));
    
    const result = await checkEndpoint(test.path, test.method, test.body);
    results.push({ ...test, ...result });
  }
  
  // Summary
  console.log('\n📊 Diagnostic Summary');
  console.log('====================');
  
  const apiEndpoints = results.filter(r => r.path.startsWith('/api/'));
  const workingApis = apiEndpoints.filter(r => r.success);
  const failedApis = apiEndpoints.filter(r => !r.success);
  
  console.log(`API endpoints tested: ${apiEndpoints.length}`);
  console.log(`Working APIs: ${workingApis.length}`);
  console.log(`Failed APIs: ${failedApis.length}`);
  
  if (failedApis.length > 0) {
    console.log('\n❌ Failed API endpoints:');
    failedApis.forEach(api => {
      console.log(`  - ${api.method || 'GET'} ${api.path}: ${api.error || 'HTML response instead of JSON'}`);
    });
  }
  
  if (workingApis.length > 0) {
    console.log('\n✅ Working API endpoints:');
    workingApis.forEach(api => {
      console.log(`  - ${api.method || 'GET'} ${api.path}: Status ${api.status}`);
    });
  }
  
  // Recommendations
  console.log('\n💡 Recommendations');
  console.log('==================');
  
  if (failedApis.length === apiEndpoints.length) {
    console.log('❌ No API endpoints are working. This suggests:');
    console.log('   1. The server is not running Next.js properly');
    console.log('   2. API routes are not being served');
    console.log('   3. Wrong server is running (maybe a different app)');
    console.log('');
    console.log('🔧 Try these fixes:');
    console.log('   1. Stop the current server');
    console.log('   2. Run: npm run dev');
    console.log('   3. Check that you\'re in the correct directory');
    console.log('   4. Verify package.json has the correct scripts');
  } else if (failedApis.some(api => api.path === '/api/auth/test-login')) {
    console.log('❌ Rate limiting test endpoint is not working. This suggests:');
    console.log('   1. The API route file might have compilation errors');
    console.log('   2. Dependencies are missing');
    console.log('   3. Database connection issues');
    console.log('');
    console.log('🔧 Try these fixes:');
    console.log('   1. Check server console for errors');
    console.log('   2. Verify database is running');
    console.log('   3. Check environment variables');
  } else {
    console.log('✅ Some APIs are working. Rate limiting should be testable.');
  }
  
  console.log('\n🚀 Next Steps');
  console.log('=============');
  console.log('1. Fix any server issues identified above');
  console.log('2. Re-run this diagnostic: node scripts/testing/diagnose-server.js');
  console.log('3. Test rate limiting: node scripts/testing/quick-test.js');
}

main().catch(error => {
  console.error('Diagnostic failed:', error.message);
  process.exit(1);
});