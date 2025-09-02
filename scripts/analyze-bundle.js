#!/usr/bin/env node

/**
 * Bundle Analyzer Script
 * Analyzes the Next.js bundle to identify optimization opportunities
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🔍 Analyzing Next.js bundle for performance optimization...\n')

// Check if @next/bundle-analyzer is installed
try {
  require.resolve('@next/bundle-analyzer')
} catch (error) {
  console.log('📦 Installing @next/bundle-analyzer...')
  execSync('npm install --save-dev @next/bundle-analyzer', { stdio: 'inherit' })
}

// Create a temporary next.config.js with bundle analyzer
const originalConfig = fs.readFileSync('next.config.js', 'utf8')
const analyzerConfig = `
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

${originalConfig.replace('module.exports = nextConfig;', 'module.exports = withBundleAnalyzer(nextConfig);')}
`

// Write temporary config
fs.writeFileSync('next.config.analyzer.js', analyzerConfig)

try {
  console.log('🏗️  Building application with bundle analyzer...')
  
  // Build with analyzer
  execSync('ANALYZE=true next build', {
    stdio: 'inherit',
    env: { ...process.env, ANALYZE: 'true' }
  })
  
  console.log('\n✅ Bundle analysis complete!')
  console.log('📊 Check the opened browser tabs for detailed bundle analysis')
  console.log('\n💡 Optimization tips:')
  console.log('   - Look for large chunks that can be code-split')
  console.log('   - Identify unused dependencies')
  console.log('   - Check for duplicate modules')
  console.log('   - Consider lazy loading heavy components')
  
} catch (error) {
  console.error('❌ Bundle analysis failed:', error.message)
} finally {
  // Cleanup
  if (fs.existsSync('next.config.analyzer.js')) {
    fs.unlinkSync('next.config.analyzer.js')
  }
}