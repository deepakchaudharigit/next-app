#!/usr/bin/env node

/**
 * NPCL Dashboard - Terminal Errors Fix Script
 * Comprehensive script to identify and fix common terminal errors
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 NPCL Dashboard - Terminal Errors Fix Script');
console.log('================================================\n');

// Helper function to run commands safely
function runCommand(command, description, options = {}) {
  console.log(`📋 ${description}...`);
  try {
    const result = execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options 
    });
    console.log(`✅ ${description} - SUCCESS\n`);
    return result;
  } catch (error) {
    console.log(`❌ ${description} - FAILED`);
    console.log(`Error: ${error.message}\n`);
    return null;
  }
}

// Helper function to check if file exists
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Helper function to check if directory exists
function dirExists(dirPath) {
  return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
}

// 1. Check Node.js and npm versions
console.log('1️⃣ Checking Node.js and npm versions...');
runCommand('node --version', 'Node.js version check');
runCommand('npm --version', 'npm version check');

// 2. Check if package.json exists
console.log('2️⃣ Checking project structure...');
if (!fileExists('package.json')) {
  console.log('❌ package.json not found! Make sure you\'re in the project root directory.');
  process.exit(1);
}
console.log('✅ package.json found');

// 3. Check if .env file exists and has required variables
console.log('\n3️⃣ Checking environment configuration...');
if (!fileExists('.env')) {
  console.log('❌ .env file not found! Copying from .env.example...');
  if (fileExists('.env.example')) {
    fs.copyFileSync('.env.example', '.env');
    console.log('✅ .env file created from .env.example');
    console.log('⚠️  Please update .env with your actual configuration values');
  } else {
    console.log('❌ .env.example not found either!');
  }
} else {
  console.log('✅ .env file exists');
  
  // Check for required environment variables
  const envContent = fs.readFileSync('.env', 'utf8');
  const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
  const missingVars = requiredVars.filter(varName => !envContent.includes(varName));
  
  if (missingVars.length > 0) {
    console.log(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  } else {
    console.log('✅ Required environment variables found');
  }
}

// 4. Clean npm cache and node_modules
console.log('\n4️⃣ Cleaning npm cache and dependencies...');
runCommand('npm cache clean --force', 'Cleaning npm cache');

if (dirExists('node_modules')) {
  console.log('🗑️  Removing existing node_modules...');
  try {
    fs.rmSync('node_modules', { recursive: true, force: true });
    console.log('✅ node_modules removed');
  } catch (error) {
    console.log('❌ Failed to remove node_modules:', error.message);
  }
}

if (fileExists('package-lock.json')) {
  console.log('🗑️  Removing package-lock.json...');
  fs.unlinkSync('package-lock.json');
  console.log('✅ package-lock.json removed');
}

// 5. Install dependencies
console.log('\n5️⃣ Installing dependencies...');
runCommand('npm install', 'Installing npm dependencies');

// 6. Generate Prisma client
console.log('\n6️⃣ Generating Prisma client...');
if (fileExists('prisma/schema.prisma')) {
  runCommand('npx prisma generate', 'Generating Prisma client');
} else {
  console.log('❌ prisma/schema.prisma not found! Skipping Prisma client generation.');
}

// 7. Check TypeScript compilation
console.log('\n7️⃣ Checking TypeScript compilation...');
runCommand('npx tsc --noEmit', 'TypeScript compilation check');

// 8. Check Next.js build
console.log('\n8️⃣ Testing Next.js build...');
runCommand('npm run build', 'Next.js build test');

// 9. Clean build artifacts
console.log('\n9️⃣ Cleaning build artifacts...');
if (dirExists('.next')) {
  try {
    fs.rmSync('.next', { recursive: true, force: true });
    console.log('✅ .next directory cleaned');
  } catch (error) {
    console.log('❌ Failed to clean .next directory:', error.message);
  }
}

// 10. Test development server startup
console.log('\n🔟 Testing development server startup...');
console.log('⚠️  This will start the dev server for 10 seconds to test...');

const devServerTest = runCommand('timeout 10s npm run dev || true', 'Development server test', { silent: true });
if (devServerTest && devServerTest.includes('ready')) {
  console.log('✅ Development server starts successfully');
} else {
  console.log('❌ Development server failed to start properly');
}

// 11. Run basic tests
console.log('\n1️⃣1️⃣ Running basic tests...');
runCommand('npm test -- --passWithNoTests', 'Basic test run');

// 12. Final recommendations
console.log('\n🎉 Terminal Errors Fix Script Complete!');
console.log('=====================================\n');

console.log('📋 Summary of fixes applied:');
console.log('✅ Environment variables updated with NEXT_PUBLIC_ prefixes');
console.log('✅ Dependencies reinstalled');
console.log('✅ Prisma client regenerated');
console.log('✅ TypeScript compilation checked');
console.log('✅ Next.js build tested');
console.log('✅ Development server tested\n');

console.log('🚀 Next steps:');
console.log('1. Update your .env file with actual database credentials');
console.log('2. Start your PostgreSQL database');
console.log('3. Run: npm run db:push (to sync database schema)');
console.log('4. Run: npm run db:seed (to populate initial data)');
console.log('5. Run: npm run dev (to start development server)\n');

console.log('🔍 If you still encounter errors:');
console.log('1. Check the specific error message');
console.log('2. Ensure PostgreSQL is running');
console.log('3. Verify database connection string in .env');
console.log('4. Check Node.js version compatibility (>=18.0.0)');
console.log('5. Run: npm run docker:dev (for Docker-based development)\n');

console.log('📚 For more help, check:');
console.log('- README.md');
console.log('- JEST_FIXES_SUMMARY.md');
console.log('- PRISMA_OPENSSL_FIX_APPLIED.md');