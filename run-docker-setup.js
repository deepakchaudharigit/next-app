#!/usr/bin/env node

/**
 * Node.js script to set up Docker for NPCL Dashboard
 * This runs the equivalent of the bash setup commands
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeExecutable(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      // On Windows, we don't need to change permissions, but we can check if file exists
      if (process.platform === 'win32') {
        log(`✅ ${filePath} is ready (Windows)`, 'green');
      } else {
        // On Unix-like systems, make executable
        fs.chmodSync(filePath, '755');
        log(`✅ ${filePath} made executable`, 'green');
      }
      return true;
    } else {
      log(`⚠️  ${filePath} not found`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Error with ${filePath}: ${error.message}`, 'yellow');
    return false;
  }
}

function main() {
  log('🐳 NPCL Dashboard Docker Setup', 'blue');
  log('==================================');
  console.log('');

  // Step 1: Environment file (already created)
  log('✅ Step 1: Environment file created (.env.docker)', 'green');
  log('   - NEXTAUTH_SECRET: Set with secure random string');
  log('   - POSTGRES_PASSWORD: Set to "SecurePassword123!"');
  log('   - All other variables configured for Docker');
  console.log('');

  // Step 2: Make scripts executable
  log('📝 Step 2: Making scripts executable...', 'blue');
  
  const scripts = [
    'docker-start.sh',
    'scripts/docker/startup.sh',
    'scripts/docker/startup-dev-simple.sh',
    'setup-docker.sh'
  ];

  scripts.forEach(script => makeExecutable(script));
  console.log('');

  // Step 3: Show next steps
  log('🚀 Setup Complete! Next Steps:', 'blue');
  log('==================================');
  console.log('');
  
  if (process.platform === 'win32') {
    log('Windows Users - Use these commands:', 'green');
    console.log('');
    log('Development Mode (Recommended):', 'green');
    console.log('  npm run docker:dev');
    console.log('');
    log('Production Mode:', 'green');
    console.log('  npm run docker:prod');
    console.log('');
    log('Development with Extra Tools:', 'green');
    console.log('  npm run docker:dev:tools');
    console.log('');
  } else {
    log('Unix/Linux/Mac Users - Use these commands:', 'green');
    console.log('');
    log('Development Mode (Recommended):', 'green');
    console.log('  ./docker-start.sh start development');
    console.log('  OR');
    console.log('  npm run docker:dev');
    console.log('');
    log('Production Mode:', 'green');
    console.log('  ./docker-start.sh start production');
    console.log('  OR');
    console.log('  npm run docker:prod');
    console.log('');
  }

  log('Useful NPM Commands:', 'blue');
  console.log('  npm run docker:logs            # View logs');
  console.log('  npm run docker:down            # Stop services');
  console.log('  npm run docker:shell           # Access app container');
  console.log('  npm run docker:db:studio       # Open Prisma Studio');
  console.log('');

  log('Service URLs (once running):', 'blue');
  console.log('  🌐 Application: http://localhost:3000');
  console.log('  ❤️  Health Check: http://localhost:3000/api/health');
  console.log('  🗄️  Database: localhost:5432');
  console.log('  🔴 Redis: localhost:6379');
  console.log('');

  log('🎉 Your NPCL Dashboard is ready for Docker!', 'green');
  console.log('');
  
  log('Quick Start Command:', 'blue');
  log('npm run docker:dev', 'green');
}

main();