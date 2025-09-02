#!/usr/bin/env node

/**
 * Performance Dependencies Installation Script
 * Installs the correct dependencies for performance optimization features
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Installing Performance Optimization Dependencies...\n')

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json')
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: package.json not found. Please run this script from the project root.')
  process.exit(1)
}

try {
  // Install main dependencies
  console.log('📦 Installing main dependencies...')
  execSync('npm install ioredis web-vitals', { stdio: 'inherit' })
  
  console.log('\n✅ Dependencies installed successfully!')
  
  // Check if Redis is available
  console.log('\n🔍 Checking Redis availability...')
  try {
    execSync('redis-cli ping', { stdio: 'pipe' })
    console.log('✅ Redis is running and available')
  } catch (error) {
    console.log('⚠️  Redis is not running. You can:')
    console.log('   1. Install Redis locally: brew install redis (macOS) or sudo apt-get install redis-server (Ubuntu)')
    console.log('   2. Start Redis: redis-server')
    console.log('   3. Or use Docker: docker run -d -p 6379:6379 redis:7-alpine')
  }
  
  // Check environment file
  console.log('\n🔧 Checking environment configuration...')
  const envPath = path.join(process.cwd(), '.env')
  const envExamplePath = path.join(process.cwd(), '.env.example')
  
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    console.log('📋 Copying .env.example to .env...')
    fs.copyFileSync(envExamplePath, envPath)
    console.log('✅ .env file created. Please update it with your configuration.')
  } else if (fs.existsSync(envPath)) {
    console.log('✅ .env file exists')
    
    // Check if Redis configuration is present
    const envContent = fs.readFileSync(envPath, 'utf8')
    if (!envContent.includes('REDIS_HOST')) {
      console.log('⚠️  Redis configuration not found in .env. Adding Redis settings...')
      const redisConfig = `
# Redis Configuration (Performance Optimization)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_URL=redis://localhost:6379

# Performance Monitoring
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_WEB_VITALS=true
`
      fs.appendFileSync(envPath, redisConfig)
      console.log('✅ Redis configuration added to .env')
    }
  }
  
  console.log('\n🎉 Performance optimization setup complete!')
  console.log('\n📚 Next steps:')
  console.log('   1. Start Redis if not running: redis-server')
  console.log('   2. Update .env with your Redis configuration')
  console.log('   3. Run: npm run dev')
  console.log('   4. Check performance monitoring at /api/cache?action=health')
  
} catch (error) {
  console.error('❌ Installation failed:', error.message)
  console.log('\n🔧 Manual installation:')
  console.log('   npm install ioredis web-vitals')
  process.exit(1)
}