#!/usr/bin/env node

/**
 * Authentication Fix Script
 * Automatically fixes common authentication configuration issues
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateSecureSecret() {
  return crypto.randomBytes(64).toString('hex');
}

function fixEnvFile(filePath, envName) {
  console.log(`🔧 Fixing ${envName} (${filePath})...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${envName} file not found!`);
    return false;
  }

  let envContent = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix placeholder NEXTAUTH_SECRET
  if (envContent.includes('your-super-secret-jwt-key-here-make-it-long-and-random')) {
    const newSecret = generateSecureSecret();
    envContent = envContent.replace(
      /NEXTAUTH_SECRET="your-super-secret-jwt-key-here-make-it-long-and-random"/g,
      `NEXTAUTH_SECRET="${newSecret}"`
    );
    modified = true;
    console.log(`✅ Generated new NEXTAUTH_SECRET (${newSecret.length} chars)`);
  }

  // Fix placeholder database URL
  if (envContent.includes('username:password@localhost')) {
    envContent = envContent.replace(
      /DATABASE_URL="postgresql:\/\/username:password@localhost:5432\/npcl_dashboard"/g,
      'DATABASE_URL="postgresql://postgres:password@localhost:5432/npcl-auth-db?schema=public"'
    );
    modified = true;
    console.log(`✅ Fixed DATABASE_URL placeholder`);
  }

  // Ensure NEXTAUTH_URL is set correctly
  if (!envContent.includes('NEXTAUTH_URL=') || envContent.includes('NEXTAUTH_URL=""')) {
    if (envContent.includes('NEXTAUTH_URL=""')) {
      envContent = envContent.replace(
        /NEXTAUTH_URL=""/g,
        'NEXTAUTH_URL="http://localhost:3000"'
      );
    } else {
      envContent += '\nNEXTAUTH_URL="http://localhost:3000"\n';
    }
    modified = true;
    console.log(`✅ Set NEXTAUTH_URL to http://localhost:3000`);
  }

  if (modified) {
    fs.writeFileSync(filePath, envContent);
    console.log(`✅ ${envName} updated successfully`);
  } else {
    console.log(`✅ ${envName} is already properly configured`);
  }

  return true;
}

function syncSecrets() {
  console.log('\n🔄 Syncing NEXTAUTH_SECRET between environment files...');
  
  const envPath = path.join(__dirname, '..', '.env');
  const envDockerPath = path.join(__dirname, '..', '.env.docker');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found!');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const secretMatch = envContent.match(/NEXTAUTH_SECRET="([^"]+)"/);
  
  if (!secretMatch) {
    console.log('❌ NEXTAUTH_SECRET not found in .env file!');
    return false;
  }

  const secret = secretMatch[1];
  
  if (fs.existsSync(envDockerPath)) {
    let dockerContent = fs.readFileSync(envDockerPath, 'utf8');
    
    if (dockerContent.includes('NEXTAUTH_SECRET=')) {
      dockerContent = dockerContent.replace(
        /NEXTAUTH_SECRET="[^"]*"/g,
        `NEXTAUTH_SECRET="${secret}"`
      );
    } else {
      dockerContent += `\nNEXTAUTH_SECRET="${secret}"\n`;
    }
    
    fs.writeFileSync(envDockerPath, dockerContent);
    console.log('✅ Synced NEXTAUTH_SECRET to .env.docker');
  }

  return true;
}

function main() {
  console.log('🚀 NPCL Dashboard Authentication Fix');
  console.log('====================================');

  const rootDir = path.join(__dirname, '..');
  const envFiles = [
    { path: path.join(rootDir, '.env'), name: 'Development Environment' },
    { path: path.join(rootDir, '.env.docker'), name: 'Docker Environment' }
  ];

  let allFixed = true;

  // Fix individual files
  envFiles.forEach(({ path: filePath, name }) => {
    const isFixed = fixEnvFile(filePath, name);
    if (!isFixed) {
      allFixed = false;
    }
  });

  // Sync secrets between files
  if (allFixed) {
    syncSecrets();
  }

  console.log('\n' + '='.repeat(50));
  
  if (allFixed) {
    console.log('🎉 Authentication configuration fixed!');
    console.log('✅ You can now run the application with proper authentication.');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm run validate:env');
    console.log('   2. Start development: npm run dev');
    console.log('   3. Or start with Docker: npm run docker:dev');
  } else {
    console.log('❌ Some issues could not be automatically fixed!');
    console.log('🔧 Please check the errors above and fix them manually.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixEnvFile, syncSecrets };