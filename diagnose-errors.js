#!/usr/bin/env node

/**
 * NPCL Dashboard - Error Diagnosis Script
 * Quick diagnostic to identify specific terminal errors
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 NPCL Dashboard - Error Diagnosis');
console.log('===================================\n');

// Helper function to safely run commands and capture output
function safeExec(command, description) {
  console.log(`🔍 Checking: ${description}`);
  try {
    const result = execSync(command, { 
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 30000 // 30 second timeout
    });
    console.log(`✅ ${description}: OK`);
    return { success: true, output: result };
  } catch (error) {
    console.log(`❌ ${description}: FAILED`);
    console.log(`   Error: ${error.message}`);
    if (error.stdout) console.log(`   Stdout: ${error.stdout}`);
    if (error.stderr) console.log(`   Stderr: ${error.stderr}`);
    return { success: false, error: error.message, stdout: error.stdout, stderr: error.stderr };
  }
}

// Check system requirements
console.log('1️⃣ System Requirements Check');
console.log('─────────────────────────────');
safeExec('node --version', 'Node.js version');
safeExec('npm --version', 'npm version');

// Check project structure
console.log('\n2️⃣ Project Structure Check');
console.log('──────────────────────────');
const criticalFiles = [
  'package.json',
  'next.config.js',
  'tsconfig.json',
  '.env',
  'prisma/schema.prisma'
];

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}: EXISTS`);
  } else {
    console.log(`❌ ${file}: MISSING`);
  }
});

// Check dependencies
console.log('\n3️⃣ Dependencies Check');
console.log('─────────────────────');
if (fs.existsSync('node_modules')) {
  console.log('✅ node_modules: EXISTS');
  
  // Check critical dependencies
  const criticalDeps = [
    'next',
    'react',
    'react-dom',
    '@prisma/client',
    'prisma',
    'next-auth',
    'typescript'
  ];
  
  criticalDeps.forEach(dep => {
    if (fs.existsSync(`node_modules/${dep}`)) {
      console.log(`✅ ${dep}: INSTALLED`);
    } else {
      console.log(`❌ ${dep}: MISSING`);
    }
  });
} else {
  console.log('❌ node_modules: MISSING - Run npm install');
}

// Check environment variables
console.log('\n4️⃣ Environment Variables Check');
console.log('──────────────────────────────');
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`✅ ${varName}: SET`);
    } else {
      console.log(`❌ ${varName}: MISSING`);
    }
  });
  
  // Check for NEXT_PUBLIC_ variables
  const clientVars = [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_ENABLE_REGISTRATION'
  ];
  
  clientVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`✅ ${varName}: SET`);
    } else {
      console.log(`⚠️  ${varName}: MISSING (client-side variable)`);
    }
  });
} else {
  console.log('❌ .env file: MISSING');
}

// Check Prisma
console.log('\n5️⃣ Prisma Check');
console.log('───────────────');
safeExec('npx prisma --version', 'Prisma CLI');

if (fs.existsSync('node_modules/.prisma/client')) {
  console.log('✅ Prisma client: GENERATED');
} else {
  console.log('❌ Prisma client: NOT GENERATED - Run npx prisma generate');
}

// Check TypeScript
console.log('\n6️⃣ TypeScript Check');
console.log('──────────────────');
safeExec('npx tsc --version', 'TypeScript version');
const tsCheck = safeExec('npx tsc --noEmit --skipLibCheck', 'TypeScript compilation');

// Check Next.js
console.log('\n7️⃣ Next.js Check');
console.log('────────────────');
if (fs.existsSync('.next')) {
  console.log('✅ .next directory: EXISTS (previous build found)');
} else {
  console.log('⚠️  .next directory: MISSING (no previous build)');
}

// Check for common error patterns
console.log('\n8️⃣ Common Error Patterns');
console.log('────────────────────────');

// Check for Prisma import issues
const prismaImportCheck = safeExec('node -e "require(\'@prisma/client\')"', 'Prisma import test');

// Check for Next.js config issues
const nextConfigCheck = safeExec('node -e "require(\'./next.config.js\')"', 'Next.js config test');

// Check for environment loading
const envLoadCheck = safeExec('node -e "require(\'dotenv\').config(); console.log(process.env.DATABASE_URL ? \'ENV_OK\' : \'ENV_MISSING\')"', 'Environment loading test');

// Summary and recommendations
console.log('\n🎯 Diagnosis Summary');
console.log('═══════════════════');

const issues = [];

if (!fs.existsSync('node_modules')) {
  issues.push('Missing dependencies - Run: npm install');
}

if (!fs.existsSync('.env')) {
  issues.push('Missing .env file - Copy from .env.example');
}

if (!fs.existsSync('node_modules/.prisma/client')) {
  issues.push('Prisma client not generated - Run: npx prisma generate');
}

if (!tsCheck.success) {
  issues.push('TypeScript compilation errors - Check your TypeScript code');
}

if (!prismaImportCheck.success) {
  issues.push('Prisma import issues - Regenerate Prisma client');
}

if (issues.length === 0) {
  console.log('✅ No major issues detected!');
  console.log('\n🚀 Try running:');
  console.log('   npm run dev');
} else {
  console.log('❌ Issues detected:');
  issues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue}`);
  });
  
  console.log('\n🔧 Quick fix command:');
  console.log('   node fix-terminal-errors.js');
}

console.log('\n📋 Manual steps if issues persist:');
console.log('1. Delete node_modules and package-lock.json');
console.log('2. Run: npm install');
console.log('3. Run: npx prisma generate');
console.log('4. Run: npm run build');
console.log('5. Run: npm run dev');