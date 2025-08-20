#!/usr/bin/env node

/**
 * Fix Docker port conflict by finding and stopping processes using port 3000
 */

const { execSync } = require('child_process');

function log(message, color = 'reset') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bright: '\x1b[1m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description, options = {}) {
  try {
    log(`🔧 ${description}...`, 'blue');
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe', ...options });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, output: error.message };
  }
}

function main() {
  log('🔍 Fixing Docker port conflict (Port 3000 already in use)', 'bright');

  // 1. Check what's using port 3000
  log('\n1. Checking what\'s using port 3000...', 'yellow');
  
  const portCheck = runCommand('netstat -ano | findstr :3000', 'Checking port 3000 usage');
  
  if (portCheck.success && portCheck.output.trim()) {
    log('📋 Processes using port 3000:', 'blue');
    console.log(portCheck.output);
    
    // Extract PIDs
    const lines = portCheck.output.split('\n').filter(line => line.trim());
    const pids = new Set();
    
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0' && !isNaN(pid)) {
        pids.add(pid);
      }
    });
    
    if (pids.size > 0) {
      log(`\n2. Found ${pids.size} process(es) using port 3000`, 'yellow');
      
      // Try to kill processes
      pids.forEach(pid => {
        log(`🔪 Attempting to stop process ${pid}...`, 'blue');
        const killResult = runCommand(`taskkill /PID ${pid} /F`, `Killing process ${pid}`);
        
        if (killResult.success) {
          log(`✅ Successfully stopped process ${pid}`, 'green');
        } else {
          log(`❌ Failed to stop process ${pid}`, 'red');
        }
      });
    }
  } else {
    log('ℹ️ No processes found using port 3000', 'blue');
  }

  // 2. Stop any running Docker containers
  log('\n3. Stopping any running Docker containers...', 'yellow');
  
  const dockerStop = runCommand('docker-compose down', 'Stopping Docker containers');
  if (dockerStop.success) {
    log('✅ Docker containers stopped', 'green');
  }

  // 3. Clean up Docker
  log('\n4. Cleaning up Docker resources...', 'yellow');
  
  runCommand('docker-compose -f docker-compose.yml -f docker-compose.dev.yml down', 'Stopping dev containers');
  runCommand('docker system prune -f', 'Cleaning Docker system');

  // 4. Wait a moment and check port again
  log('\n5. Waiting and rechecking port 3000...', 'yellow');
  
  setTimeout(() => {
    const finalCheck = runCommand('netstat -ano | findstr :3000', 'Final port check');
    
    if (finalCheck.success && finalCheck.output.trim()) {
      log('⚠️ Port 3000 is still in use:', 'yellow');
      console.log(finalCheck.output);
      log('\n💡 Manual steps to try:', 'blue');
      console.log('1. Restart your computer');
      console.log('2. Or change Docker port in docker-compose.dev.yml');
      console.log('3. Or use: npm run docker:dev:detached');
    } else {
      log('✅ Port 3000 is now free!', 'green');
      log('\n🚀 You can now run Docker:', 'blue');
      console.log('npm run docker:dev');
    }
  }, 2000);
}

main();