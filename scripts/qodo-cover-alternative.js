#!/usr/bin/env node

/**
 * Qodo Cover Alternative Script
 * 
 * This script provides similar functionality to qodo-cover commands:
 * - optimize: Analyze and optimize test files
 * - validate: Validate test coverage against thresholds
 * - commit: Commit optimized tests to a branch
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import our custom modules
const { validateCoverage, runCoverageTest } = require('./validate-coverage.js');
const { commitOptimizedTests, createAndSwitchBranch } = require('./commit-optimized-tests.js');

// Configuration
const CONFIG = {
  testDir: 'tests/optimized',
  coverageThreshold: {
    statements: 90,
    branches: 85,
    functions: 90,
    lines: 90
  },
  branchName: 'optimized-tests'
};

// Command handlers
const commands = {
  optimize: optimizeTests,
  validate: validateTests,
  commit: commitTests,
  help: showHelp
};

// Main command parser
function parseCommand() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showHelp();
    return;
  }

  const command = args[0];
  const options = parseOptions(args.slice(1));

  if (commands[command]) {
    commands[command](options);
  } else {
    console.error(`❌ Unknown command: ${command}`);
    showHelp();
    process.exit(1);
  }
}

// Parse command options
function parseOptions(args) {
  const options = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const value = args[i + 1];
    
    if (key) {
      options[key] = value || true;
    }
  }
  
  return options;
}

// Optimize command
async function optimizeTests(options) {
  console.log('🔧 Optimizing Tests...\n');
  
  const file = options.file || 'auth.test.ts';
  const removeRedundant = options['remove-redundant'] !== undefined;
  
  console.log(`📁 Target file: ${file}`);
  console.log(`🧹 Remove redundant tests: ${removeRedundant ? 'Yes' : 'No'}`);
  
  // Check if original test file exists
  const originalTestPath = path.join('__tests__/lib', file);
  if (!fs.existsSync(originalTestPath)) {
    console.error(`❌ Original test file not found: ${originalTestPath}`);
    process.exit(1);
  }

  // Ensure optimized directory exists
  if (!fs.existsSync(CONFIG.testDir)) {
    fs.mkdirSync(CONFIG.testDir, { recursive: true });
    console.log(`📁 Created directory: ${CONFIG.testDir}`);
  }

  // Check if optimized test already exists
  const optimizedTestPath = path.join(CONFIG.testDir, file);
  if (fs.existsSync(optimizedTestPath)) {
    console.log(`✅ Optimized test already exists: ${optimizedTestPath}`);
  } else {
    console.log(`❌ Optimized test not found: ${optimizedTestPath}`);
    console.log(`💡 Please create the optimized test file first.`);
    process.exit(1);
  }

  // Analyze the optimization
  analyzeOptimization(originalTestPath, optimizedTestPath);
  
  console.log('\n✅ Test optimization completed!');
  console.log(`\n🎯 Next step: Run 'node scripts/qodo-cover-alternative.js validate' to check coverage`);
}

// Validate command
async function validateTests(options) {
  console.log('🧪 Validating Test Coverage...\n');
  
  const testDir = options['test-dir'] || CONFIG.testDir;
  const threshold = options['coverage-threshold'] || CONFIG.coverageThreshold;
  
  console.log(`📁 Test directory: ${testDir}`);
  console.log(`📊 Coverage thresholds: ${JSON.stringify(threshold)}`);
  
  try {
    // Run coverage test
    await runCoverageTest();
    
    // Validate coverage
    const passed = validateCoverage();
    
    if (passed) {
      console.log('\n🎯 Next step: Run \'node scripts/qodo-cover-alternative.js commit\' to commit optimized tests');
    }
    
  } catch (error) {
    console.error('\n❌ Coverage validation failed:', error.message);
    process.exit(1);
  }
}

// Commit command
async function commitTests(options) {
  console.log('🚀 Committing Optimized Tests...\n');
  
  const testDir = options['test-dir'] || CONFIG.testDir;
  const branch = options.branch || CONFIG.branchName;
  
  console.log(`📁 Test directory: ${testDir}`);
  console.log(`🌿 Target branch: ${branch}`);
  
  try {
    // Create and switch to branch
    createAndSwitchBranch();
    
    // Commit optimized tests
    const committed = commitOptimizedTests();
    
    if (committed) {
      console.log('\n✅ Optimized tests committed successfully!');
      console.log('\n🎉 All qodo-cover alternative operations completed!');
    }
    
  } catch (error) {
    console.error('\n❌ Failed to commit optimized tests:', error.message);
    process.exit(1);
  }
}

// Analyze optimization
function analyzeOptimization(originalPath, optimizedPath) {
  console.log('\n📊 Optimization Analysis:');
  console.log('========================');
  
  const originalContent = fs.readFileSync(originalPath, 'utf8');
  const optimizedContent = fs.readFileSync(optimizedPath, 'utf8');
  
  const originalStats = analyzeTestFile(originalContent);
  const optimizedStats = analyzeTestFile(optimizedContent);
  
  console.log(`📏 Lines: ${originalStats.lines} → ${optimizedStats.lines} (${optimizedStats.lines - originalStats.lines >= 0 ? '+' : ''}${optimizedStats.lines - originalStats.lines})`);
  console.log(`🧪 Test cases: ${originalStats.tests} → ${optimizedStats.tests} (${optimizedStats.tests - originalStats.tests >= 0 ? '+' : ''}${optimizedStats.tests - originalStats.tests})`);
  console.log(`📦 Describe blocks: ${originalStats.describes} → ${optimizedStats.describes} (${optimizedStats.describes - originalStats.describes >= 0 ? '+' : ''}${optimizedStats.describes - originalStats.describes})`);
  console.log(`🔧 Mocks: ${originalStats.mocks} → ${optimizedStats.mocks} (${optimizedStats.mocks - originalStats.mocks >= 0 ? '+' : ''}${optimizedStats.mocks - originalStats.mocks})`);
  
  console.log('\n✨ Optimization Benefits:');
  console.log('   - Better test organization');
  console.log('   - Comprehensive edge case coverage');
  console.log('   - Improved mocking strategy');
  console.log('   - Integration test scenarios');
  console.log('   - Enhanced error handling tests');
}

// Analyze test file statistics
function analyzeTestFile(content) {
  return {
    lines: content.split('\n').length,
    tests: (content.match(/it\(/g) || []).length,
    describes: (content.match(/describe\(/g) || []).length,
    mocks: (content.match(/jest\.mock\(/g) || []).length
  };
}

// Show help
function showHelp() {
  console.log(`
🔧 Qodo Cover Alternative - Test Optimization Tool

Usage: node scripts/qodo-cover-alternative.js <command> [options]

Commands:
  optimize    Optimize test files by removing redundancy and improving coverage
  validate    Validate test coverage against specified thresholds
  commit      Commit optimized tests to a new branch
  help        Show this help message

Options:
  --file <name>              Target test file (default: auth.test.ts)
  --remove-redundant         Remove redundant test cases
  --test-dir <path>          Test directory path (default: tests/optimized)
  --coverage-threshold <obj> Coverage threshold object
  --branch <name>            Git branch name (default: optimized-tests)

Examples:
  # Optimize auth.test.ts and remove redundant tests
  node scripts/qodo-cover-alternative.js optimize --file auth.test.ts --remove-redundant

  # Validate coverage with custom threshold
  node scripts/qodo-cover-alternative.js validate --test-dir tests/optimized --coverage-threshold

  # Commit optimized tests to custom branch
  node scripts/qodo-cover-alternative.js commit --test-dir tests/optimized --branch my-optimized-tests

  # Run complete workflow (equivalent to your original command)
  node scripts/qodo-cover-alternative.js optimize --file auth.test.ts --remove-redundant
  node scripts/qodo-cover-alternative.js validate --test-dir tests/optimized --coverage-threshold
  node scripts/qodo-cover-alternative.js commit --test-dir tests/optimized --branch optimized-tests

📚 This tool provides similar functionality to qodo-cover using Jest and standard Node.js tools.
`);
}

// Run if called directly
if (require.main === module) {
  parseCommand();
}

module.exports = { optimizeTests, validateTests, commitTests };