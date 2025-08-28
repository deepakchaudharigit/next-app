#!/usr/bin/env node

/**
 * Comprehensive Rate Limiting Test Runner
 * 
 * This script runs all available rate limiting tests including:
 * - Unit tests
 * - Integration tests  
 * - Manual API tests
 * - Performance tests
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  baseUrl: process.env.TEST_URL || 'http://localhost:3000',
  testEmail: process.env.TEST_EMAIL || 'test@example.com',
  verbose: process.argv.includes('--verbose'),
  skipUnit: process.argv.includes('--skip-unit'),
  skipIntegration: process.argv.includes('--skip-integration'),
  skipManual: process.argv.includes('--skip-manual'),
  onlyManual: process.argv.includes('--only-manual')
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${title}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSubsection(title) {
  log(`\n${'-'.repeat(40)}`, 'blue');
  log(`${title}`, 'blue');
  log(`${'-'.repeat(40)}`, 'blue');
}

// Run command and return promise
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: config.verbose ? 'inherit' : 'pipe',
      shell: true,
      ...options
    });

    let stdout = '';
    let stderr = '';

    if (!config.verbose) {
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
    }

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ code, stdout, stderr });
      } else {
        reject({ code, stdout, stderr, command: `${command} ${args.join(' ')}` });
      }
    });

    child.on('error', (error) => {
      reject({ error, command: `${command} ${args.join(' ')}` });
    });
  });
}

// Check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

// Run unit tests
async function runUnitTests() {
  logSubsection('Running Unit Tests');
  
  try {
    const testFile = '__tests__/lib/rate-limiting.test.ts';
    if (!fileExists(testFile)) {
      log(`❌ Unit test file not found: ${testFile}`, 'red');
      return false;
    }

    await runCommand('npm', ['test', testFile]);
    log('✅ Unit tests passed', 'green');
    return true;
  } catch (error) {
    log(`❌ Unit tests failed: ${error.command}`, 'red');
    if (config.verbose && error.stderr) {
      log(error.stderr, 'red');
    }
    return false;
  }
}

// Run integration tests
async function runIntegrationTests() {
  logSubsection('Running Integration Tests');
  
  try {
    const testFile = '__tests__/api/auth/rate-limiting.test.ts';
    if (!fileExists(testFile)) {
      log(`❌ Integration test file not found: ${testFile}`, 'red');
      return false;
    }

    await runCommand('npm', ['test', testFile]);
    log('✅ Integration tests passed', 'green');
    return true;
  } catch (error) {
    log(`❌ Integration tests failed: ${error.command}`, 'red');
    if (config.verbose && error.stderr) {
      log(error.stderr, 'red');
    }
    return false;
  }
}

// Run manual API tests
async function runManualTests() {
  logSubsection('Running Manual API Tests');
  
  try {
    const scriptPath = path.join(__dirname, 'test-rate-limiting.js');
    if (!fileExists(scriptPath)) {
      log(`❌ Manual test script not found: ${scriptPath}`, 'red');
      return false;
    }

    log(`Testing against: ${config.baseUrl}`);
    log(`Test email: ${config.testEmail}`);
    
    await runCommand('node', [
      scriptPath,
      '--url', config.baseUrl,
      '--email', config.testEmail,
      '--attempts', '8',
      '--delay', '500'
    ]);
    
    log('✅ Manual API tests completed', 'green');
    return true;
  } catch (error) {
    log(`❌ Manual API tests failed: ${error.command}`, 'red');
    if (config.verbose && error.stderr) {
      log(error.stderr, 'red');
    }
    return false;
  }
}

// Check server availability using built-in modules
async function checkServerAvailability() {
  logSubsection('Checking Server Availability');
  
  return new Promise((resolve) => {
    const url = new URL(config.baseUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? require('https') : require('http');
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: '/api/health',
      method: 'GET',
      timeout: 5000
    };
    
    const req = client.request(options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        log(`✅ Server is available at ${config.baseUrl}`, 'green');
        resolve(true);
      } else {
        log(`❌ Server returned status ${res.statusCode}`, 'red');
        resolve(false);
      }
    });
    
    req.on('error', (error) => {
      log(`❌ Server is not available at ${config.baseUrl}`, 'red');
      log(`   Error: ${error.message}`, 'red');
      resolve(false);
    });
    
    req.on('timeout', () => {
      log(`❌ Server request timed out at ${config.baseUrl}`, 'red');
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// Run performance test
async function runPerformanceTest() {
  logSubsection('Running Performance Test');
  
  try {
    const scriptPath = path.join(__dirname, 'test-rate-limiting.js');
    
    log('Running high-volume test...');
    await runCommand('node', [
      scriptPath,
      '--url', config.baseUrl,
      '--email', 'perf-test@example.com',
      '--attempts', '50',
      '--delay', '100'
    ]);
    
    log('✅ Performance test completed', 'green');
    return true;
  } catch (error) {
    log(`❌ Performance test failed: ${error.command}`, 'red');
    return false;
  }
}

// Main test runner
async function runAllTests() {
  log('🔒 NPCL Dashboard - Comprehensive Rate Limiting Test Suite', 'bright');
  log(`Started at: ${new Date().toISOString()}`, 'cyan');
  
  const results = {
    unit: null,
    integration: null,
    manual: null,
    performance: null,
    serverCheck: null
  };

  // Check server availability for manual tests
  if (!config.skipManual || config.onlyManual) {
    logSection('Server Availability Check');
    results.serverCheck = await checkServerAvailability();
    
    if (!results.serverCheck) {
      log('\n❌ Server is not available. Skipping manual tests.', 'red');
      log('   Make sure the application is running:', 'yellow');
      log('   npm run dev', 'yellow');
      
      if (config.onlyManual) {
        process.exit(1);
      }
    }
  }

  // Run unit tests
  if (!config.skipUnit && !config.onlyManual) {
    logSection('Unit Tests');
    results.unit = await runUnitTests();
  }

  // Run integration tests
  if (!config.skipIntegration && !config.onlyManual) {
    logSection('Integration Tests');
    results.integration = await runIntegrationTests();
  }

  // Run manual tests
  if (!config.skipManual && results.serverCheck) {
    logSection('Manual API Tests');
    results.manual = await runManualTests();
    
    // Run performance test
    logSection('Performance Tests');
    results.performance = await runPerformanceTest();
  }

  // Summary
  logSection('Test Results Summary');
  
  const testResults = [
    { name: 'Unit Tests', result: results.unit },
    { name: 'Integration Tests', result: results.integration },
    { name: 'Manual API Tests', result: results.manual },
    { name: 'Performance Tests', result: results.performance }
  ];

  let passedTests = 0;
  let totalTests = 0;

  testResults.forEach(({ name, result }) => {
    if (result !== null) {
      totalTests++;
      const status = result ? '✅ PASSED' : '❌ FAILED';
      const color = result ? 'green' : 'red';
      log(`${name}: ${status}`, color);
      if (result) passedTests++;
    }
  });

  log(`\nOverall: ${passedTests}/${totalTests} test suites passed`, 
       passedTests === totalTests ? 'green' : 'red');

  // Recommendations
  if (passedTests < totalTests) {
    log('\n📋 Recommendations:', 'yellow');
    
    if (results.unit === false) {
      log('• Fix unit test failures before proceeding', 'yellow');
    }
    
    if (results.integration === false) {
      log('• Check integration test setup and dependencies', 'yellow');
    }
    
    if (results.manual === false) {
      log('• Verify server is running and rate limiting is configured', 'yellow');
    }
    
    if (results.performance === false) {
      log('• Check system resources and rate limiting performance', 'yellow');
    }
  } else {
    log('\n🎉 All tests passed! Rate limiting is working correctly.', 'green');
  }

  log(`\nCompleted at: ${new Date().toISOString()}`, 'cyan');
  
  // Exit with appropriate code
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Show help
function showHelp() {
  log('Comprehensive Rate Limiting Test Runner', 'bright');
  log('\nUsage: node run-all-rate-limit-tests.js [options]', 'cyan');
  log('\nOptions:', 'cyan');
  log('  --verbose         Enable verbose output');
  log('  --skip-unit       Skip unit tests');
  log('  --skip-integration Skip integration tests');
  log('  --skip-manual     Skip manual API tests');
  log('  --only-manual     Run only manual tests');
  log('  --help            Show this help');
  log('\nEnvironment Variables:', 'cyan');
  log('  TEST_URL          Base URL for testing (default: http://localhost:3000)');
  log('  TEST_EMAIL        Email for testing (default: test@example.com)');
  log('\nExamples:', 'cyan');
  log('  # Run all tests');
  log('  node run-all-rate-limit-tests.js');
  log('');
  log('  # Run only manual tests with verbose output');
  log('  node run-all-rate-limit-tests.js --only-manual --verbose');
  log('');
  log('  # Test against different environment');
  log('  TEST_URL=https://staging.npcl.com node run-all-rate-limit-tests.js');
}

// Handle command line arguments
if (process.argv.includes('--help')) {
  showHelp();
  process.exit(0);
}

// Run tests
runAllTests().catch((error) => {
  log(`\n❌ Test runner failed: ${error.message}`, 'red');
  process.exit(1);
});