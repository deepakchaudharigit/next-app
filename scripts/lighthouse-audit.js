#!/usr/bin/env node

/**
 * Lighthouse Audit Script
 * Runs Lighthouse audits with proper server management
 */

const { spawn } = require('child_process')
const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || 'localhost'
const URL = `http://${HOST}:${PORT}`

console.log('🚀 Starting Lighthouse Audit for NPCL Dashboard...\n')

// Check if server is already running
function checkServerRunning() {
  return new Promise((resolve) => {
    const req = http.get(URL, { timeout: 3000 }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400)
    })
    
    req.on('error', () => {
      resolve(false)
    })
    
    req.on('timeout', () => {
      req.destroy()
      resolve(false)
    })
  })
}

// Wait for server to be ready
function waitForServer(maxAttempts = 15) {
  return new Promise((resolve, reject) => {
    let attempts = 0
    
    const check = async () => {
      attempts++
      console.log(`⏳ Checking server availability (attempt ${attempts}/${maxAttempts})...`)
      
      const isRunning = await checkServerRunning()
      
      if (isRunning) {
        console.log('✅ Server is ready!')
        resolve(true)
      } else if (attempts >= maxAttempts) {
        reject(new Error('❌ Server failed to start within timeout'))
      } else {
        setTimeout(check, 3000)
      }
    }
    
    check()
  })
}

// Start development server
function startDevServer() {
  return new Promise((resolve, reject) => {
    console.log('🔧 Starting development server...')
    
    const server = spawn('npm', ['run', 'dev'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    })
    
    let serverReady = false
    
    server.stdout.on('data', (data) => {
      const output = data.toString()
      console.log(`📝 Server: ${output.trim()}`)
      
      if (output.includes('Ready') || output.includes('started server') || output.includes('Local:')) {
        if (!serverReady) {
          serverReady = true
          // Give server a moment to fully initialize
          setTimeout(() => {
            resolve(server)
          }, 2000)
        }
      }
    })
    
    server.stderr.on('data', (data) => {
      const error = data.toString()
      console.error(`❌ Server Error: ${error.trim()}`)
    })
    
    server.on('error', (error) => {
      reject(error)
    })
    
    // Timeout after 60 seconds
    setTimeout(() => {
      if (!serverReady) {
        reject(new Error('Server startup timeout'))
      }
    }, 60000)
  })
}

// Run Lighthouse audit
function runLighthouseAudit() {
  return new Promise((resolve, reject) => {
    console.log('🔍 Running Lighthouse audit...')
    
    const lighthouseArgs = [
      URL,
      '--output=html,json',
      '--output-path=./lighthouse-report',
      '--chrome-flags="--headless --no-sandbox --disable-dev-shm-usage"',
      '--view',
      '--preset=desktop'
    ]
    
    const lighthouse = spawn('npx', ['lighthouse', ...lighthouseArgs], {
      stdio: 'inherit',
      shell: true
    })
    
    lighthouse.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Lighthouse audit completed successfully!')
        resolve()
      } else {
        reject(new Error(`Lighthouse audit failed with code ${code}`))
      }
    })
    
    lighthouse.on('error', (error) => {
      reject(error)
    })
  })
}

// Run PWA-specific audit
function runPWAAudit() {
  return new Promise((resolve, reject) => {
    console.log('📱 Running PWA-specific audit...')
    
    const pwaArgs = [
      URL,
      '--only-categories=pwa',
      '--output=html,json',
      '--output-path=./lighthouse-pwa-report',
      '--chrome-flags="--headless --no-sandbox --disable-dev-shm-usage"',
      '--view'
    ]
    
    const lighthouse = spawn('npx', ['lighthouse', ...pwaArgs], {
      stdio: 'inherit',
      shell: true
    })
    
    lighthouse.on('close', (code) => {
      if (code === 0) {
        console.log('✅ PWA audit completed successfully!')
        resolve()
      } else {
        reject(new Error(`PWA audit failed with code ${code}`))
      }
    })
    
    lighthouse.on('error', (error) => {
      reject(error)
    })
  })
}

// Main execution
async function main() {
  let server = null
  
  try {
    // Check if server is already running
    const isAlreadyRunning = await checkServerRunning()
    
    if (!isAlreadyRunning) {
      // Start development server
      server = await startDevServer()
      
      // Wait for server to be ready
      await waitForServer()
    } else {
      console.log('✅ Server is already running!')
    }
    
    // Run audits
    await runLighthouseAudit()
    await runPWAAudit()
    
    console.log('\n🎉 All audits completed successfully!')
    console.log('📊 Check the generated reports:')
    console.log('   - lighthouse-report.html (Full audit)')
    console.log('   - lighthouse-pwa-report.html (PWA audit)')
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message)
    process.exit(1)
  } finally {
    // Clean up server if we started it
    if (server && !process.env.KEEP_SERVER_RUNNING) {
      console.log('🛑 Stopping development server...')
      server.kill('SIGTERM')
      
      // Force kill after 5 seconds
      setTimeout(() => {
        server.kill('SIGKILL')
      }, 5000)
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Audit interrupted by user')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Audit terminated')
  process.exit(0)
})

// Run the script
main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})