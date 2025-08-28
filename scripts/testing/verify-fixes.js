#!/usr/bin/env node

/**
 * Verify Rate Limiting Test Fixes
 * Quick verification that the test fixes work
 */

const { spawn } = require('child_process');

console.log('🔧 Verifying Rate Limiting Test Fixes');
console.log('=====================================');
console.log('');

function runTest(testPath) {
  return new Promise((resolve, reject) => {
    console.log(`Running: npm test ${testPath}`);
    
    const child = spawn('npm', ['test', testPath], {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${testPath} - PASSED`);
        resolve();
      } else {
        console.log(`❌ ${testPath} - FAILED (exit code: ${code})`);
        reject(new Error(`Test failed with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.log(`❌ ${testPath} - ERROR: ${error.message}`);
      reject(error);
    });
  });
}

async function main() {
  const tests = [
    '__tests__/lib/rate-limiting.test.ts',
    '__tests__/api/auth/rate-limiting.test.ts',
    '__tests__/api/auth/nextauth.test.ts'
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await runTest(test);
      passed++;
    } catch (error) {
      failed++;
    }
    console.log('');
  }
  
  console.log('📊 Test Results Summary');
  console.log('=======================');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${tests.length}`);
  
  if (failed === 0) {
    console.log('');
    console.log('🎉 All rate limiting tests are now fixed!');
    console.log('');
    console.log('You can now run:');
    console.log('  npm test                    # Run all tests');
    console.log('  npm test rate-limiting      # Run only rate limiting tests');
  } else {
    console.log('');
    console.log('⚠️  Some tests are still failing. Check the output above for details.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Verification failed:', error.message);
  process.exit(1);
});