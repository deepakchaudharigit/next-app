#!/usr/bin/env node

/**
 * Rate Limiting Test - Start Here
 * Simple entry point to test rate limiting functionality
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🔒 NPCL Dashboard Rate Limiting Test');
console.log('====================================');
console.log('');

function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`Running: node ${scriptPath} ${args.join(' ')}`);
    console.log('');
    
    const child = spawn('node', [scriptPath, ...args], {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  console.log('Choose a test to run:');
  console.log('');
  console.log('1. Simple Unit Tests (no dependencies)');
  console.log('2. Quick API Test (requires server running)');
  console.log('3. Both tests');
  console.log('');
  
  // Get user input
  const choice = process.argv[2] || '3';
  
  try {
    switch (choice) {
      case '1':
        console.log('Running simple unit tests...');
        console.log('');
        await runScript(path.join(__dirname, 'test-unit-simple.js'));
        break;
        
      case '2':
        console.log('Running quick API test...');
        console.log('Make sure your server is running: npm run dev');
        console.log('');
        await runScript(path.join(__dirname, 'quick-test.js'));
        break;
        
      case '3':
      default:
        console.log('Running all tests...');
        console.log('');
        
        console.log('Step 1: Unit Tests');
        console.log('==================');
        await runScript(path.join(__dirname, 'test-unit-simple.js'));
        
        console.log('');
        console.log('Step 2: API Tests');
        console.log('=================');
        console.log('Make sure your server is running: npm run dev');
        console.log('');
        await runScript(path.join(__dirname, 'quick-test.js'));
        break;
    }
    
    console.log('');
    console.log('🎉 All tests completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('- Start your server: npm run dev');
    console.log('- Run API tests: node scripts/testing/quick-test.js');
    console.log('- Check rate limiting in browser at /auth/login');
    
  } catch (error) {
    console.error('');
    console.error('❌ Test failed:', error.message);
    console.error('');
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Tip: Make sure your server is running:');
      console.error('   npm run dev');
    }
    
    process.exit(1);
  }
}

// Show usage if help requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: node start-here.js [option]');
  console.log('');
  console.log('Options:');
  console.log('  1    Run only unit tests');
  console.log('  2    Run only API tests');
  console.log('  3    Run all tests (default)');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/testing/start-here.js');
  console.log('  node scripts/testing/start-here.js 1');
  console.log('  node scripts/testing/start-here.js 2');
  process.exit(0);
}

main();