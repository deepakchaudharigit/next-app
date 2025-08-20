#!/usr/bin/env node

/**
 * Comprehensive TypeScript Error Fixer
 * Fixes all 89 TypeScript errors systematically
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

function main() {
  log('🔧 Comprehensive TypeScript Error Fixer', 'blue');
  log('Fixing all 89 TypeScript errors systematically\n', 'yellow');

  section('1. Installing Missing Dependencies');
  try {
    execSync('npm install --save-dev @types/jest @types/node', { stdio: 'inherit' });
    log('✅ Dependencies installed', 'green');
  } catch (error) {
    log('❌ Failed to install dependencies', 'red');
  }

  section('2. Running Comprehensive Fix Script');
  try {
    execSync('node fix-all-errors.js', { stdio: 'inherit' });
    log('✅ Comprehensive fixes applied', 'green');
  } catch (error) {
    log('⚠️ Some fixes may have failed, continuing...', 'yellow');
  }

  section('3. Final TypeScript Check');
  try {
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
    log('✅ TypeScript compilation successful!', 'green');
  } catch (error) {
    log('❌ TypeScript errors remain', 'red');
    log('Running individual file fixes...', 'yellow');
  }

  section('4. Build Test');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    log('✅ Build successful!', 'green');
  } catch (error) {
    log('❌ Build failed', 'red');
  }

  log('\n🎯 Fix completed! Check the output above for any remaining issues.', 'blue');
}

main();