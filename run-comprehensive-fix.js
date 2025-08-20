#!/usr/bin/env node

/**
 * Comprehensive fix for all TypeScript errors
 */

const { execSync } = require('child_process');

function runCommand(command, description) {
  try {
    console.log(`🔧 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} failed`);
    return false;
  }
}

function main() {
  console.log('🚀 Running comprehensive TypeScript fixes\n');

  // 1. Install dependencies
  runCommand('npm install', 'Installing dependencies');

  // 2. Generate Prisma client
  runCommand('npx prisma generate', 'Generating Prisma client');

  // 3. Run the comprehensive fix
  runCommand('node fix-all-errors.js', 'Running comprehensive fixes');

  // 4. Check TypeScript
  console.log('\n🔍 Final TypeScript check...');
  const tsCheck = runCommand('npx tsc --noEmit', 'TypeScript compilation');

  // 5. Test build
  console.log('\n🏗️ Testing build...');
  const buildCheck = runCommand('npm run build', 'Build test');

  console.log('\n📊 Final Results:');
  console.log(`TypeScript: ${tsCheck ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Build: ${buildCheck ? '✅ PASSED' : '❌ FAILED'}`);

  if (tsCheck && buildCheck) {
    console.log('\n🎉 All fixes successful! Ready for Docker.');
    console.log('Run: npm run docker:dev');
  } else {
    console.log('\n⚠️ Some issues remain. Manual fixes may be needed.');
  }
}

main();