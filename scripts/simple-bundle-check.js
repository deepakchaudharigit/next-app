#!/usr/bin/env node

/**
 * Simple Bundle Size Checker
 * Identifies large dependencies that might be causing the 911 KiB unused JavaScript
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Checking for large dependencies that might be causing bundle bloat...\n')

// Read package.json to check dependencies
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

// Known large packages that might cause issues
const potentiallyLargePackages = [
  'recharts',
  'next-auth',
  '@prisma/client',
  'bcryptjs',
  'nodemailer',
  'ioredis',
  'web-vitals',
  '@aws-sdk/client-ses',
  'exceljs',
  '@json2csv/plainjs'
]

console.log('📦 Potentially large packages found:')
potentiallyLargePackages.forEach(pkg => {
  if (dependencies[pkg]) {
    console.log(`   ✓ ${pkg} (${dependencies[pkg]})`)
  }
})

console.log('\n💡 Recommendations to reduce bundle size:')
console.log('   1. Use dynamic imports for heavy components')
console.log('   2. Consider lighter alternatives for large packages')
console.log('   3. Use tree shaking for libraries like recharts')
console.log('   4. Move server-only packages to devDependencies if possible')

console.log('\n🚀 Quick fixes to try:')
console.log('   - Dynamic import recharts only when needed')
console.log('   - Lazy load dashboard components')
console.log('   - Use Next.js built-in optimizations')

// Check if .next directory exists to see build output
if (fs.existsSync('.next')) {
  console.log('\n📊 To analyze current bundle:')
  console.log('   npm run build')
  console.log('   Check .next/static/chunks/ for large files')
} else {
  console.log('\n📊 Run "npm run build" first to see actual bundle sizes')
}