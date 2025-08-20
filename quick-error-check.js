#!/usr/bin/env node

/**
 * Quick Error Check for NPCL Dashboard
 * Fast check for the most common errors
 */

const { execSync } = require('child_process');

// Colors
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

function quickCheck(command, description) {
  try {
    log(`🔍 ${description}...`, 'blue');
    execSync(command, { stdio: 'pipe' });
    log(`✅ ${description} - OK`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} - ERRORS FOUND`, 'red');
    console.log(error.stdout?.toString() || error.message);
    return false;
  }
}

function main() {
  log('⚡ Quick Error Check for NPCL Dashboard', 'bright');
  console.log('='.repeat(50));

  const checks = [
    ['npx tsc --noEmit', 'TypeScript compilation'],
    ['npx eslint . --ext .ts,.tsx --quiet', 'ESLint errors'],
    ['npx prisma validate', 'Prisma schema'],
    ['npm run build', 'Next.js build']
  ];

  let passed = 0;
  let total = checks.length;

  checks.forEach(([command, description]) => {
    if (quickCheck(command, description)) {
      passed++;
    }
  });

  console.log('\n' + '='.repeat(50));
  
  if (passed === total) {
    log(`🎉 All ${total} checks passed!`, 'green');
  } else {
    log(`❌ ${total - passed} of ${total} checks failed`, 'red');
    log('\n💡 Run comprehensive fix:', 'yellow');
    console.log('   node fix-all-errors.js');
  }
}

main();