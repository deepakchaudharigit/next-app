#!/usr/bin/env node

/**
 * Server Health Check Script
 * Checks if the development server is running and healthy
 */

const http = require('http')
const https = require('https')

const DEFAULT_URLS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://0.0.0.0:3000'
]

function checkUrl(url, timeout = 5000) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url)
      const client = urlObj.protocol === 'https:' ? https : http
      
      const req = client.get(url, { timeout }, (res) => {
        resolve({
          url,
          status: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 400,
          headers: res.headers
        })
      })
      
      req.on('error', (error) => {
        resolve({
          url,
          success: false,
          error: error.message
        })
      })
      
      req.on('timeout', () => {
        req.destroy()
        resolve({
          url,
          success: false,
          error: 'Request timeout'
        })
      })
    } catch (error) {
      resolve({
        url,
        success: false,
        error: error.message
      })
    }
  })
}

async function checkServerHealth() {
  console.log('🔍 Checking server health...\n')
  
  const urls = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_URLS
  
  for (const url of urls) {
    console.log(`⏳ Checking: ${url}`)
    
    const result = await checkUrl(url)
    
    if (result.success) {
      console.log(`✅ ${url} - Status: ${result.status}`)
      
      // Check for Next.js specific headers
      if (result.headers['x-powered-by']) {
        console.log(`   🔧 Powered by: ${result.headers['x-powered-by']}`)
      }
      
      // Check for PWA manifest
      try {
        const manifestResult = await checkUrl(`${url}/manifest.json`)
        if (manifestResult.success) {
          console.log(`   📱 PWA manifest: Available`)
        } else {
          console.log(`   📱 PWA manifest: Not found`)
        }
      } catch (error) {
        console.log(`   📱 PWA manifest: Error checking`)
      }
      
      // Check for service worker
      try {
        const swResult = await checkUrl(`${url}/sw.js`)
        if (swResult.success) {
          console.log(`   ⚙️  Service worker: Available`)
        } else {
          console.log(`   ⚙️  Service worker: Not found`)
        }
      } catch (error) {
        console.log(`   ⚙️  Service worker: Error checking`)
      }
      
      console.log(`   🎯 Ready for Lighthouse audit!`)
      return { success: true, url }
      
    } else {
      console.log(`❌ ${url} - Error: ${result.error || 'Unknown error'}`)
    }
    
    console.log('')
  }
  
  return { success: false }
}

async function main() {
  const result = await checkServerHealth()
  
  if (result.success) {
    console.log('🎉 Server is healthy and ready!')
    console.log(`\n📊 To run Lighthouse audit:`)
    console.log(`   npx lighthouse ${result.url} --view`)
    console.log(`\n📱 To run PWA audit:`)
    console.log(`   npx lighthouse ${result.url} --only-categories=pwa --view`)
    console.log(`\n🚀 To run automated audit:`)
    console.log(`   npm run audit:lighthouse`)
    process.exit(0)
  } else {
    console.log('❌ No healthy server found!')
    console.log('\n🔧 To start the development server:')
    console.log('   npm run dev')
    console.log('\n🐳 To start with Docker:')
    console.log('   npm run docker:dev')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Health check failed:', error)
  process.exit(1)
})