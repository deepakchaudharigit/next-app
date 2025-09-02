#!/usr/bin/env node

/**
 * Quick Build Test Script
 * Tests if the TypeScript compilation passes
 */

const { execSync } = require('child_process');

console.log('🔧 Testing TypeScript compilation...');

try {
  // Run TypeScript check
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation successful!');
  
  console.log('\n🚀 Ready to run full build with:');
  console.log('npm run build');
  
} catch (error) {
  console.error('❌ TypeScript compilation failed');
  console.error('Please fix the errors above before proceeding');
  process.exit(1);
}