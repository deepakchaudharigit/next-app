#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates that all required environment variables are properly set for authentication
 */

const fs = require('fs');
const path = require('path');

// Required environment variables for authentication
const REQUIRED_VARS = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

// Optional but recommended variables
const RECOMMENDED_VARS = [
  'JWT_EXPIRES_IN',
  'BCRYPT_SALT_ROUNDS',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_ATTEMPTS'
];

function validateEnvFile(filePath, envName) {
  console.log(`\n🔍 Validating ${envName} (${filePath})...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${envName} file not found!`);
    return false;
  }

  const envContent = fs.readFileSync(filePath, 'utf8');
  const envVars = {};
  
  // Parse environment variables
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
      }
    }
  });

  let isValid = true;

  // Check required variables
  console.log('\n📋 Required Variables:');
  REQUIRED_VARS.forEach(varName => {
    if (envVars[varName]) {
      if (varName === 'NEXTAUTH_SECRET') {
        if (envVars[varName].includes('your-super-secret') || envVars[varName].length < 32) {
          console.log(`❌ ${varName}: Using placeholder or too short (should be 32+ chars)`);
          isValid = false;
        } else {
          console.log(`✅ ${varName}: Set (${envVars[varName].length} chars)`);
        }
      } else if (varName === 'DATABASE_URL') {
        if (envVars[varName].includes('username:password@localhost')) {
          console.log(`❌ ${varName}: Using placeholder values`);
          isValid = false;
        } else {
          console.log(`✅ ${varName}: Set`);
        }
      } else {
        console.log(`✅ ${varName}: Set`);
      }
    } else {
      console.log(`❌ ${varName}: Missing`);
      isValid = false;
    }
  });

  // Check recommended variables
  console.log('\n📝 Recommended Variables:');
  RECOMMENDED_VARS.forEach(varName => {
    if (envVars[varName]) {
      console.log(`✅ ${varName}: Set (${envVars[varName]})`);
    } else {
      console.log(`⚠️  ${varName}: Not set (using default)`);
    }
  });

  // Special checks
  console.log('\n🔐 Security Checks:');
  
  // Check NEXTAUTH_SECRET strength
  if (envVars.NEXTAUTH_SECRET) {
    const secret = envVars.NEXTAUTH_SECRET;
    if (secret.length >= 64) {
      console.log(`✅ NEXTAUTH_SECRET length: Strong (${secret.length} chars)`);
    } else if (secret.length >= 32) {
      console.log(`⚠️  NEXTAUTH_SECRET length: Adequate (${secret.length} chars)`);
    } else {
      console.log(`❌ NEXTAUTH_SECRET length: Too short (${secret.length} chars)`);
      isValid = false;
    }
  }

  // Check database URL format
  if (envVars.DATABASE_URL) {
    const dbUrl = envVars.DATABASE_URL;
    if (dbUrl.startsWith('postgresql://')) {
      console.log(`✅ Database URL format: Valid PostgreSQL`);
    } else {
      console.log(`❌ Database URL format: Invalid (should start with postgresql://)`);
      isValid = false;
    }
  }

  return isValid;
}

function main() {
  console.log('🚀 NPCL Dashboard Environment Validation');
  console.log('=========================================');

  const rootDir = path.join(__dirname, '..');
  const envFiles = [
    { path: path.join(rootDir, '.env'), name: 'Development Environment' },
    { path: path.join(rootDir, '.env.docker'), name: 'Docker Environment' }
  ];

  let allValid = true;

  envFiles.forEach(({ path: filePath, name }) => {
    const isValid = validateEnvFile(filePath, name);
    if (!isValid) {
      allValid = false;
    }
  });

  console.log('\n' + '='.repeat(50));
  
  if (allValid) {
    console.log('🎉 All environment files are properly configured!');
    console.log('✅ Authentication should work correctly.');
  } else {
    console.log('❌ Environment configuration issues found!');
    console.log('🔧 Please fix the issues above before running the application.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateEnvFile };