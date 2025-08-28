#!/usr/bin/env node

/**
 * Test Only Rate Limiting
 * Runs only the rate limiting tests to verify fixes
 */

const { spawn } = require('child_process');

console.log('🔧 Testing Rate Limiting Implementation');
console.log('======================================');
console.log('');

function runTest(testPattern, description) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${description}`);
    console.log(`Pattern: ${testPattern}`);
    console.log('');
    
    const child = spawn('npm', ['test', '--', testPattern, '--verbose'], {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} - PASSED`);
        resolve();
      } else {
        console.log(`❌ ${description} - FAILED (exit code: ${code})`);
        reject(new Error(`Test failed with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.log(`❌ ${description} - ERROR: ${error.message}`);
      reject(error);
    });
  });
}

async function main() {
  const tests = [
    {
      pattern: '__tests__/lib/rate-limiting.test.ts',
      description: 'Rate Limiting Unit Tests'
    },
    {
      pattern: '__tests__/api/auth/rate-limiting.test.ts',
      description: 'Rate Limiting Integration Tests'
    },
    {
      pattern: '__tests__/api/auth/nextauth.test.ts',
      description: 'NextAuth Configuration Tests'
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await runTest(test.pattern, test.description);
      passed++;
    } catch (error) {
      failed++;
    }
    console.log('');
  }
  
  console.log('📊 Rate Limiting Test Results');
  console.log('=============================');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${tests.length}`);
  
  if (failed === 0) {
    console.log('');
    console.log('🎉 All rate limiting tests are working!');
    console.log('');
    console.log('✅ Rate limiting is properly implemented and tested');
    console.log('✅ Configuration is working correctly');
    console.log('✅ Integration with NextAuth is functional');
    console.log('');
    console.log('You can now:');
    console.log('  1. Run the full test suite: npm test');
    console.log('  2. Test manually: node scripts/testing/quick-test.js');
    console.log('  3. Start your app: npm run dev');
  } else {
    console.log('');
    console.log('⚠️  Some rate limiting tests are still failing.');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Check the error messages above');
    console.log('  2. Verify environment configuration');
    console.log('  3. Run individual tests for debugging');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Test runner failed:', error.message);
  process.exit(1);
});