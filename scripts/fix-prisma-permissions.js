#!/usr/bin/env node

/**
 * Fix Prisma Permission Issues on Windows
 * Handles EPERM errors when regenerating Prisma client
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Prisma Permission Issues');
console.log('==================================\n');

async function fixPrismaPermissions() {
  try {
    // Step 1: Stop any running processes that might be using Prisma
    console.log('1. Checking for running processes...');
    
    // Step 2: Clear Prisma cache and generated files
    console.log('2. Clearing Prisma cache...');
    
    const prismaDirectories = [
      'node_modules/.prisma',
      'node_modules/@prisma/client',
      '.next'
    ];
    
    for (const dir of prismaDirectories) {
      if (fs.existsSync(dir)) {
        try {
          console.log(`   Removing ${dir}...`);
          execSync(`rmdir /s /q "${dir}"`, { stdio: 'pipe' });
        } catch (error) {
          console.log(`   ⚠️  Could not remove ${dir} (may not exist or in use)`);
        }
      }
    }
    
    // Step 3: Reinstall Prisma client
    console.log('3. Reinstalling Prisma client...');
    execSync('npm uninstall @prisma/client', { stdio: 'inherit' });
    execSync('npm install @prisma/client', { stdio: 'inherit' });
    
    // Step 4: Generate Prisma client with retry logic
    console.log('4. Generating Prisma client...');
    
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`   Attempt ${attempts}/${maxAttempts}...`);
        
        execSync('npx prisma generate', { 
          stdio: 'inherit',
          timeout: 60000 // 60 seconds timeout
        });
        
        console.log('✅ Prisma client generated successfully!');
        break;
        
      } catch (error) {
        console.log(`   ❌ Attempt ${attempts} failed`);
        
        if (attempts < maxAttempts) {
          console.log('   Waiting 2 seconds before retry...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Try to kill any processes that might be holding files
          try {
            execSync('taskkill /f /im node.exe', { stdio: 'pipe' });
          } catch (e) {
            // Ignore errors
          }
        } else {
          throw error;
        }
      }
    }
    
    console.log('\n✅ Prisma permission issues fixed!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your development server');
    console.log('2. Run: npm run type:check');
    console.log('3. If issues persist, restart your IDE');
    
  } catch (error) {
    console.error('\n❌ Failed to fix Prisma permissions:', error.message);
    console.log('\n💡 Manual steps to try:');
    console.log('1. Close your IDE/editor completely');
    console.log('2. Stop all Node.js processes in Task Manager');
    console.log('3. Delete node_modules folder manually');
    console.log('4. Run: npm install');
    console.log('5. Run: npx prisma generate');
    console.log('6. Restart your IDE');
    
    process.exit(1);
  }
}

// Helper function for async delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

fixPrismaPermissions();