#!/usr/bin/env node

/**
 * Docker Fix Script - Cross Platform
 * Comprehensive script to fix Docker issues and ensure proper setup
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, description, options = {}) {
  console.log(`🔧 ${description}...`);
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      shell: true,
      ...options 
    });
    console.log(`✅ ${description} completed`);
    return { success: true, output };
  } catch (error) {
    console.log(`❌ ${description} failed: ${error.message.split('\n')[0]}`);
    return { success: false, error: error.message };
  }
}

function runCommandSafe(command, description, options = {}) {
  console.log(`🔧 ${description}...`);
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      shell: true,
      ...options 
    });
    console.log(`✅ ${description} completed`);
    return { success: true, output };
  } catch (error) {
    // For cleanup commands, we expect some to fail, so we don't treat it as an error
    if (options.allowFailure) {
      console.log(`⚠️ ${description} completed (some operations may have failed, which is normal)`);
      return { success: true, output: '' };
    }
    console.log(`❌ ${description} failed: ${error.message.split('\n')[0]}`);
    return { success: false, error: error.message };
  }
}

function isWindows() {
  return process.platform === 'win32';
}

function checkDockerStatus() {
  console.log('\n🐳 Checking Docker status...');
  
  // Check if Docker is running
  const dockerCheck = runCommand('docker --version', 'Checking Docker installation', { silent: true });
  if (!dockerCheck.success) {
    console.log('❌ Docker is not installed or not running!');
    console.log('📝 Please install Docker Desktop and make sure it\'s running.');
    return false;
  }

  // Check if Docker Compose is available
  const composeCheck = runCommand('docker-compose --version', 'Checking Docker Compose', { silent: true });
  if (!composeCheck.success) {
    console.log('❌ Docker Compose is not available!');
    return false;
  }

  console.log('✅ Docker and Docker Compose are available');
  return true;
}

function checkEnvironmentFiles() {
  console.log('\n📁 Checking environment files...');
  
  const envFiles = ['.env', '.env.docker'];
  let allExist = true;

  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
      allExist = false;
    }
  });

  return allExist;
}

function forceRemoveContainers() {
  console.log('\n🗑️ Force removing existing containers...');
  
  // Get list of all containers with our names (based on docker-compose.yml)
  const containerNames = [
    'npcl-dashboard-app',
    'npcl-dashboard-dev', 
    'npcl-postgres', 
    'npcl-redis',
    'npcl-adminer',
    'npcl-mailhog'
  ];
  
  containerNames.forEach(name => {
    // First try to stop the container
    runCommandSafe(`docker stop ${name}`, `Stopping container ${name}`, { allowFailure: true, silent: true });
    // Then remove it
    runCommandSafe(`docker rm -f ${name}`, `Removing container ${name}`, { allowFailure: true, silent: true });
  });
}

function cleanupDocker() {
  console.log('\n🧹 Cleaning up Docker...');
  
  // Stop all containers using docker-compose
  runCommand('docker-compose -f docker-compose.yml -f docker-compose.dev.yml down', 'Stopping all containers');
  
  // Force remove any remaining containers
  forceRemoveContainers();
  
  // Remove problematic images - use cross-platform approach
  const imageNames = ['next-app-app', 'next-app_app', 'npcl-dashboard:dev'];
  imageNames.forEach(name => {
    runCommandSafe(`docker rmi ${name}`, `Removing image ${name}`, { allowFailure: true, silent: true });
  });
  
  // Clean up system
  runCommand('docker image prune -f', 'Removing dangling images');
  runCommand('docker builder prune -f', 'Cleaning build cache');
}

function buildAndStart() {
  console.log('\n🚀 Building and starting containers...');
  
  // Build the application
  const buildResult = runCommand(
    'docker-compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache app',
    'Building application container'
  );
  
  if (!buildResult.success) {
    console.log('❌ Build failed! Check the error above.');
    return false;
  }

  // Start the services
  const startResult = runCommand(
    'docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d',
    'Starting services'
  );
  
  if (!startResult.success) {
    console.log('❌ Failed to start services! Check the error above.');
    return false;
  }

  return true;
}

function checkServices() {
  console.log('\n🔍 Checking service status...');
  
  // Wait a moment for services to start
  console.log('⏳ Waiting for services to start...');
  
  return new Promise((resolve) => {
    setTimeout(() => {
      runCommand('docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps', 'Service status');
      
      // Check logs for any immediate errors
      console.log('\n📋 Recent logs:');
      runCommand('docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs --tail=20', 'Recent logs');
      resolve();
    }, 5000);
  });
}

async function main() {
  console.log('🚀 NPCL Dashboard Docker Fix');
  console.log('============================');

  // Step 1: Check Docker status
  if (!checkDockerStatus()) {
    process.exit(1);
  }

  // Step 2: Check environment files
  if (!checkEnvironmentFiles()) {
    console.log('\n❌ Missing environment files!');
    console.log('📝 Please run: npm run fix:auth');
    process.exit(1);
  }

  // Step 3: Cleanup existing Docker resources
  cleanupDocker();

  // Step 4: Build and start services
  if (!buildAndStart()) {
    console.log('\n❌ Failed to start services!');
    console.log('📝 Try running: npm run docker:logs:app');
    process.exit(1);
  }

  // Step 5: Check service status
  await checkServices();

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Docker fix completed!');
  console.log('✅ Services should be starting up.');
  console.log('\n📝 Next steps:');
  console.log('   1. Wait 30-60 seconds for services to fully start');
  console.log('   2. Check status: npm run docker:logs:app');
  console.log('   3. Visit: http://localhost:3000');
  console.log('   4. If issues persist, check logs: npm run docker:logs');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkDockerStatus, cleanupDocker, buildAndStart };