#!/usr/bin/env node

/**
 * Comprehensive Error Checker for NPCL Dashboard
 * Checks TypeScript, ESLint, Build, and other errors
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(`${title}`, 'bright');
  console.log('='.repeat(60));
}

function runCommand(command, description, options = {}) {
  try {
    log(`\n🔍 ${description}...`, 'blue');
    
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      ...options
    });
    
    if (result.trim()) {
      console.log(result);
    } else {
      log(`✅ No issues found`, 'green');
    }
    
    return { success: true, output: result };
  } catch (error) {
    log(`❌ ${description} failed:`, 'red');
    console.log(error.stdout || error.message);
    if (error.stderr) {
      log('STDERR:', 'yellow');
      console.log(error.stderr);
    }
    return { success: false, output: error.stdout || error.message };
  }
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function main() {
  log('🔍 NPCL Dashboard - Comprehensive Error Check', 'cyan');
  log('This will check for TypeScript, ESLint, Build, and other errors\n', 'white');

  const results = {
    typescript: null,
    eslint: null,
    build: null,
    tests: null,
    prisma: null,
    dependencies: null
  };

  // 1. TypeScript Errors
  section('1. TypeScript Type Checking');
  if (checkFileExists('tsconfig.json')) {
    results.typescript = runCommand(
      'npx tsc --noEmit --pretty',
      'Checking TypeScript types and declarations'
    );
  } else {
    log('❌ tsconfig.json not found', 'red');
  }

  // 2. ESLint Errors
  section('2. ESLint Code Quality Check');
  if (checkFileExists('.eslintrc.json') || checkFileExists('.eslintrc.js')) {
    results.eslint = runCommand(
      'npx eslint . --ext .ts,.tsx,.js,.jsx --format=stylish',
      'Checking ESLint rules and code quality'
    );
  } else {
    log('❌ ESLint configuration not found', 'red');
  }

  // 3. Next.js Build Check
  section('3. Next.js Build Check');
  results.build = runCommand(
    'npm run build',
    'Checking if project builds successfully'
  );

  // 4. Prisma Schema Check
  section('4. Prisma Schema Validation');
  if (checkFileExists('prisma/schema.prisma')) {
    results.prisma = runCommand(
      'npx prisma validate',
      'Validating Prisma schema'
    );
    
    runCommand(
      'npx prisma generate --dry-run',
      'Checking Prisma client generation'
    );
  } else {
    log('❌ Prisma schema not found', 'red');
  }

  // 5. Package Dependencies Check
  section('5. Package Dependencies Check');
  results.dependencies = runCommand(
    'npm audit --audit-level=moderate',
    'Checking for dependency vulnerabilities'
  );

  // 6. Test Compilation Check
  section('6. Test Files Check');
  if (checkFileExists('jest.config.ts') || checkFileExists('jest.config.js')) {
    results.tests = runCommand(
      'npx jest --listTests --passWithNoTests',
      'Checking test file compilation'
    );
  } else {
    log('❌ Jest configuration not found', 'red');
  }

  // 7. Import/Export Analysis
  section('7. Import/Export Analysis');
  runCommand(
    'npx tsc --listFiles --noEmit | head -20',
    'Checking module resolution (first 20 files)',
    { stdio: 'pipe' }
  );

  // Summary
  section('SUMMARY');
  
  let hasErrors = false;
  
  Object.entries(results).forEach(([check, result]) => {
    if (result === null) {
      log(`⚠️  ${check}: Skipped`, 'yellow');
    } else if (result.success) {
      log(`✅ ${check}: Passed`, 'green');
    } else {
      log(`❌ ${check}: Failed`, 'red');
      hasErrors = true;
    }
  });

  console.log('\n' + '='.repeat(60));
  
  if (hasErrors) {
    log('❌ ERRORS FOUND - See details above', 'red');
    log('\n💡 Quick Fix Commands:', 'yellow');
    console.log('   npm run lint:fix     # Fix ESLint issues');
    console.log('   npx tsc --noEmit     # Show TypeScript errors');
    console.log('   npm install          # Fix dependency issues');
    console.log('   npx prisma generate  # Regenerate Prisma client');
  } else {
    log('✅ ALL CHECKS PASSED!', 'green');
  }
  
  console.log('\n📚 For detailed error fixing:');
  console.log('   node fix-all-errors.js');
}

main();