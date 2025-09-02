#!/usr/bin/env node

/**
 * Test Build Fix Script
 * Quickly tests if the TypeScript compilation passes
 */

const { execSync } = require('child_process');

console.log('🔧 Testing TypeScript compilation after syntax fix...');

try {
  // Run TypeScript check only
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation successful!');
  
  console.log('\n🎉 All syntax errors fixed!');
  console.log('\n🚀 Ready to run full build:');
  console.log('npm run build');
  
} catch (error) {
  console.error('❌ TypeScript compilation still has errors');
  console.error('Please check the output above');
  process.exit(1);
}