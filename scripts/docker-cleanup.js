#!/usr/bin/env node

/**
 * Docker Cleanup Script
 * Cleans up Docker containers, images, and volumes to resolve naming conflicts
 */

const { execSync } = require('child_process');

function runCommand(command, description) {
  console.log(`🔧 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    if (output.trim()) {
      console.log(`✅ ${description} completed`);
      console.log(output.trim());
    } else {
      console.log(`✅ ${description} completed (no output)`);
    }
    return true;
  } catch (error) {
    console.log(`⚠️  ${description} - ${error.message.split('\n')[0]}`);
    return false;
  }
}

function main() {
  console.log('🚀 NPCL Dashboard Docker Cleanup');
  console.log('=================================');

  // Stop all running containers for this project
  console.log('\n📦 Stopping containers...');
  runCommand('docker-compose -f docker-compose.yml -f docker-compose.dev.yml down', 'Stopping development containers');
  runCommand('docker-compose down', 'Stopping production containers');

  // Remove containers with old names
  console.log('\n🗑️  Removing old containers...');
  runCommand('docker rm -f npcl-dashboard-dkch 2>/dev/null || true', 'Removing old app container');
  runCommand('docker rm -f npcl-postgres 2>/dev/null || true', 'Removing old postgres container');
  runCommand('docker rm -f npcl-redis 2>/dev/null || true', 'Removing old redis container');

  // Remove images with problematic names
  console.log('\n🖼️  Removing problematic images...');
  runCommand('docker rmi next-app-app 2>/dev/null || true', 'Removing next-app-app image');
  runCommand('docker rmi next-app_app 2>/dev/null || true', 'Removing next-app_app image');
  runCommand('docker rmi npcl-dashboard:dev 2>/dev/null || true', 'Removing old dev image');

  // Clean up dangling images and build cache
  console.log('\n🧹 Cleaning up Docker system...');
  runCommand('docker image prune -f', 'Removing dangling images');
  runCommand('docker builder prune -f', 'Cleaning build cache');

  // List current Docker state
  console.log('\n📋 Current Docker state:');
  runCommand('docker ps -a --filter "name=npcl"', 'Listing NPCL containers');
  runCommand('docker images --filter "reference=*npcl*" --filter "reference=*next-app*"', 'Listing project images');

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Docker cleanup completed!');
  console.log('✅ You can now run: npm run docker:dev');
}

if (require.main === module) {
  main();
}

module.exports = { runCommand };