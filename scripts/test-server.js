#!/usr/bin/env node

/**
 * Simple Server Test Script
 * Tests if the development server is responding
 */

const http = require('http')

const PORT = process.env.PORT || 3000
const URL = `http://localhost:${PORT}`

console.log('🔍 Testing server connection...\n')

function testServer() {
  return new Promise((resolve, reject) => {
    console.log(`📡 Connecting to: ${URL}`)
    
    const req = http.get(URL, { timeout: 15000 }, (res) => {
      console.log(`✅ Server responded with status: ${res.statusCode}`)
      console.log(`📋 Headers:`)
      console.log(`   Content-Type: ${res.headers['content-type']}`)
      console.log(`   X-Powered-By: ${res.headers['x-powered-by'] || 'Not set'}`)
      
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          console.log(`✅ Server is working correctly!`)
          console.log(`📄 Response length: ${data.length} characters`)
          
          // Check if it looks like a Next.js app
          if (data.includes('__NEXT_DATA__') || data.includes('_next')) {
            console.log(`🚀 Next.js app detected!`)
          }
          
          resolve(true)
        } else {
          reject(new Error(`Server returned status ${res.statusCode}`))
        }
      })
    })
    
    req.on('error', (error) => {
      console.log(`❌ Connection failed: ${error.message}`)
      
      if (error.code === 'ECONNREFUSED') {
        console.log(`🔧 Server is not running. Start it with: npm run dev`)
      } else if (error.code === 'ENOTFOUND') {
        console.log(`🔧 Hostname not found. Check if localhost is accessible.`)
      } else {
        console.log(`🔧 Network error: ${error.code}`)
      }
      
      resolve(false)
    })
    
    req.on('timeout', () => {
      console.log(`❌ Request timeout (15 seconds)`)
      console.log(`🔧 Server might be slow to respond. Try again.`)
      req.destroy()
      resolve(false)
    })
  })
}

async function main() {
  try {
    const isWorking = await testServer()
    
    if (isWorking) {
      console.log(`\n🎉 Server test passed!`)
      console.log(`\n🚀 You can now run:`)
      console.log(`   npm run audit:quick    # Quick Lighthouse audit`)
      console.log(`   npm run audit:manual   # Manual Lighthouse audit`)
      console.log(`   npm run audit:simple   # Simple audit with retries`)
    } else {
      console.log(`\n❌ Server test failed!`)
      console.log(`\n🔧 To fix:`)
      console.log(`   1. Start the server: npm run dev`)
      console.log(`   2. Wait for "Ready" message`)
      console.log(`   3. Run this test again: node scripts/test-server.js`)
    }
    
  } catch (error) {
    console.error(`❌ Test error:`, error.message)
    process.exit(1)
  }
}

main()