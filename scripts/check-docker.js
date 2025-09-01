#!/usr/bin/env node

/**
 * Docker Status Checker
 * Checks Docker Desktop status and provides troubleshooting steps
 */

const { execSync } = require('child_process');
const os = require('os');

function runCommand(command, description) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description}: OK`);
    return { success: true, output: output.trim() };
  } catch (error) {
    console.log(`❌ ${description}: FAILED`);
    console.log(`   Error: ${error.message.split('\n')[0]}`);
    return { success: false, error: error.message };
  }
}

function checkDockerDesktop() {
  console.log('🐳 Checking Docker Desktop Status');
  console.log('=================================');
  
  const platform = os.platform();
  console.log(`Platform: ${platform}`);
  
  // Check if Docker command is available
  const dockerCheck = runCommand('docker --version', 'Docker CLI');
  if (!dockerCheck.success) {
    console.log('\n❌ Docker CLI not found!');
    console.log('📝 Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/');
    return false;
  }
  
  console.log(`   Version: ${dockerCheck.output}`);
  
  // Check if Docker daemon is running
  const daemonCheck = runCommand('docker info', 'Docker Daemon');
  if (!daemonCheck.success) {
    console.log('\n❌ Docker daemon is not running!');
    
    if (platform === 'win32') {
      console.log('📝 Windows troubleshooting steps:');
      console.log('   1. Open Docker Desktop application');
      console.log('   2. Wait for Docker to start (whale icon in system tray)');
      console.log('   3. If Docker Desktop is not installed:');
      console.log('      - Download from: https://www.docker.com/products/docker-desktop/');
      console.log('      - Install and restart your computer');
      console.log('   4. If Docker Desktop is installed but not starting:');
      console.log('      - Right-click Docker Desktop icon → "Restart Docker Desktop"');
      console.log('      - Check Windows features: "Hyper-V" and "WSL 2" should be enabled');
      console.log('      - Run as Administrator if needed');
    }
    return false;
  }
  
  // Check Docker Compose
  const composeCheck = runCommand('docker-compose --version', 'Docker Compose');
  if (!composeCheck.success) {
    console.log('\n❌ Docker Compose not available!');
    console.log('📝 Docker Compose should be included with Docker Desktop');
    return false;
  }
  
  console.log(`   Version: ${composeCheck.output}`);
  
  // Test Docker functionality
  console.log('\n🧪 Testing Docker functionality...');
  const testCheck = runCommand('docker run --rm hello-world', 'Docker Test Run');
  if (!testCheck.success) {
    console.log('\n❌ Docker test failed!');
    console.log('📝 Docker is running but cannot execute containers');
    return false;
  }
  
  console.log('\n✅ Docker Desktop is working correctly!');
  return true;
}

function checkDockerResources() {
  console.log('\n💾 Checking Docker Resources');
  console.log('============================');
  
  try {
    const systemInfo = execSync('docker system df', { encoding: 'utf8' });
    console.log('Docker disk usage:');
    console.log(systemInfo);
    
    const images = execSync('docker images --format "table {{.Repository}}\\t{{.Tag}}\\t{{.Size}}"', { encoding: 'utf8' });
    console.log('\nDocker images:');
    console.log(images);
    
  } catch (error) {
    console.log('❌ Could not check Docker resources');
  }
}

function provideSolutions() {
  console.log('\n🔧 Common Solutions');
  console.log('==================');
  
  const platform = os.platform();
  
  if (platform === 'win32') {
    console.log('Windows-specific solutions:');
    console.log('1. Start Docker Desktop:');
    console.log('   - Search "Docker Desktop" in Start menu');
    console.log('   - Click to open Docker Desktop');
    console.log('   - Wait for the whale icon to appear in system tray');
    console.log('');
    console.log('2. Restart Docker Desktop:');
    console.log('   - Right-click Docker Desktop system tray icon');
    console.log('   - Select "Restart Docker Desktop"');
    console.log('');
    console.log('3. Check Windows Features:');
    console.log('   - Open "Turn Windows features on or off"');
    console.log('   - Enable "Hyper-V" (if available)');
    console.log('   - Enable "Windows Subsystem for Linux"');
    console.log('   - Enable "Virtual Machine Platform"');
    console.log('   - Restart computer after enabling');
    console.log('');
    console.log('4. Run as Administrator:');
    console.log('   - Right-click Command Prompt/PowerShell');
    console.log('   - Select "Run as administrator"');
    console.log('   - Try the docker command again');
    console.log('');
    console.log('5. Reset Docker Desktop:');
    console.log('   - Docker Desktop → Settings → Troubleshoot → Reset to factory defaults');
  }
  
  console.log('\nGeneral solutions:');
  console.log('1. Update Docker Desktop to the latest version');
  console.log('2. Increase Docker memory allocation (Settings → Resources)');
  console.log('3. Clear Docker cache: docker system prune -a');
  console.log('4. Restart your computer');
}

function main() {
  console.log('🚀 NPCL Dashboard Docker Diagnostics');
  console.log('====================================');
  
  const isWorking = checkDockerDesktop();
  
  if (isWorking) {
    checkDockerResources();
    console.log('\n🎉 Docker is ready!');
    console.log('✅ You can now run: npm run docker:dev');
  } else {
    provideSolutions();
    console.log('\n❌ Please fix Docker Desktop issues before continuing');
    console.log('📝 After fixing, run this script again to verify');
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkDockerDesktop, checkDockerResources };