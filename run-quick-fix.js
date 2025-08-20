#!/usr/bin/env node

/**
 * Quick fix script to resolve immediate issues
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
  console.log('🚀 Running quick fixes for NPCL Dashboard\n');

  // 1. Install dependencies
  runCommand('npm install', 'Installing dependencies');

  // 2. Generate Prisma client
  runCommand('npx prisma generate', 'Generating Prisma client');

  // 3. Check TypeScript
  console.log('\n🔍 Checking TypeScript compilation...');
  const tsCheck = runCommand('npx tsc --noEmit', 'TypeScript check');

  // 4. Try build
  console.log('\n🏗️ Testing build...');
  const buildCheck = runCommand('npm run build', 'Build check');

  console.log('\n📊 Summary:');
  console.log(`TypeScript: ${tsCheck ? '✅' : '❌'}`);
  console.log(`Build: ${buildCheck ? '✅' : '❌'}`);

  if (tsCheck && buildCheck) {
    console.log('\n🎉 All checks passed! Ready for Docker.');
    console.log('Run: npm run docker:dev');
  } else {
    console.log('\n⚠️ Some issues remain. Check the output above.');
  }
}

main();