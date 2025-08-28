#!/usr/bin/env node

/**
 * Fix and Test Rate Limiting
 * This script helps diagnose and fix common issues with rate limiting testing
 */

const { spawn, exec } = require('child_process');
const http = require('http');

console.log('🔧 Rate Limiting Fix and Test Tool');
console.log('==================================');
console.log('');

// Check what's running on port 3000
function checkPort3000() {
  return new Promise((resolve) => {
    exec('netstat -ano | findstr :3000', (error, stdout, stderr) => {
      if (error) {
        resolve({ running: false, processes: [] });
        return;
      }
      
      const lines = stdout.split('\n').filter(line => line.trim());
      const processes = lines.map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          protocol: parts[0],
          localAddress: parts[1],
          foreignAddress: parts[2],
          state: parts[3],
          pid: parts[4]
        };
      });
      
      resolve({ running: true, processes });
    });
  });
}

// Test what's actually running
async function testCurrentServer() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/test-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const isHtml = body.includes('<!doctype html>');
        const isJson = body.trim().startsWith('{');
        
        resolve({
          status: res.statusCode,
          isHtml,
          isJson,
          body: body.substring(0, 200),
          serverType: isHtml ? 'Qodo Command' : isJson ? 'Next.js API' : 'Unknown'
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({ error: error.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'Timeout' });
    });
    
    req.write(JSON.stringify({ email: 'test@example.com', password: 'test' }));
    req.end();
  });
}

// Main diagnostic function
async function diagnose() {
  console.log('🔍 Step 1: Checking what\'s running on port 3000...');
  
  const portCheck = await checkPort3000();
  
  if (!portCheck.running) {
    console.log('❌ Nothing is running on port 3000');
    console.log('');
    console.log('🚀 Solution: Start your Next.js server');
    console.log('   npm run dev');
    return false;
  }
  
  console.log('✅ Something is running on port 3000');
  console.log(`   Found ${portCheck.processes.length} process(es)`);
  
  console.log('');
  console.log('🔍 Step 2: Testing what type of server is running...');
  
  const serverTest = await testCurrentServer();
  
  if (serverTest.error) {
    console.log(`❌ Error testing server: ${serverTest.error}`);
    return false;
  }
  
  console.log(`📊 Server Response: ${serverTest.status}`);
  console.log(`🖥️  Server Type: ${serverTest.serverType}`);
  
  if (serverTest.serverType === 'Qodo Command') {
    console.log('');
    console.log('❌ PROBLEM IDENTIFIED: Qodo Command is running instead of your Next.js app');
    console.log('');
    console.log('🔧 SOLUTION:');
    console.log('   1. Stop the current server (Ctrl+C in the terminal running it)');
    console.log('   2. Make sure you\'re in the correct directory:');
    console.log('      cd C:\\Users\\shaik\\OneDrive\\Documents\\GitHub\\next-app');
    console.log('   3. Start your Next.js app:');
    console.log('      npm run dev');
    console.log('   4. Wait for "Ready - started server on 0.0.0.0:3000"');
    console.log('   5. Run this script again to verify');
    return false;
  }
  
  if (serverTest.serverType === 'Next.js API') {
    console.log('✅ Correct server is running!');
    return true;
  }
  
  console.log('❓ Unknown server type detected');
  console.log(`   Response preview: ${serverTest.body}`);
  return false;
}

// Test rate limiting
async function testRateLimiting() {
  console.log('');
  console.log('🔒 Step 3: Testing Rate Limiting...');
  
  return new Promise((resolve) => {
    const child = spawn('node', ['scripts/testing/quick-test.js'], {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      resolve(code === 0);
    });
    
    child.on('error', (error) => {
      console.log(`❌ Error running rate limiting test: ${error.message}`);
      resolve(false);
    });
  });
}

// Run Jest tests
async function runJestTests() {
  console.log('');
  console.log('🧪 Step 4: Running Jest Tests...');
  
  return new Promise((resolve) => {
    const child = spawn('npm', ['test', '--', '__tests__/lib/rate-limiting.test.ts', '--config', 'jest.config.cjs'], {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      resolve(code === 0);
    });
    
    child.on('error', (error) => {
      console.log(`❌ Error running Jest tests: ${error.message}`);
      resolve(false);
    });
  });
}

// Main function
async function main() {
  const serverOk = await diagnose();
  
  if (!serverOk) {
    console.log('');
    console.log('❌ Please fix the server issue first, then run this script again.');
    process.exit(1);
  }
  
  // Test rate limiting
  const rateLimitOk = await testRateLimiting();
  
  if (!rateLimitOk) {
    console.log('');
    console.log('❌ Rate limiting test failed. Check the output above for details.');
  }
  
  // Run Jest tests
  const jestOk = await runJestTests();
  
  console.log('');
  console.log('📊 Final Results');
  console.log('================');
  console.log(`Server: ${serverOk ? '✅ Correct' : '❌ Wrong'}`);
  console.log(`Rate Limiting: ${rateLimitOk ? '✅ Working' : '❌ Not Working'}`);
  console.log(`Jest Tests: ${jestOk ? '✅ Passing' : '❌ Failing'}`);
  
  if (serverOk && rateLimitOk && jestOk) {
    console.log('');
    console.log('🎉 Everything is working correctly!');
    console.log('');
    console.log('Rate limiting is properly implemented and tested.');
    console.log('You can now use it in your application.');
  } else {
    console.log('');
    console.log('⚠️  Some issues remain. Please address them and run this script again.');
  }
}

main().catch(error => {
  console.error('Script failed:', error.message);
  process.exit(1);
});