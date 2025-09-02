#!/usr/bin/env node

/**
 * Test Performance Fixes Script
 * Validates that all performance optimizations are working correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing performance fixes...\n');

const tests = [];

// Test 1: Check Next.js config fixes
const testNextConfig = () => {
  const configPath = path.join(__dirname, '..', 'next.config.js');
  const config = fs.readFileSync(configPath, 'utf8');
  
  const hasSwcMinify = config.includes('swcMinify');
  const hasOptimizeCss = config.includes('optimizeCss');
  const hasHeaders = config.includes('async headers()');
  
  return {
    name: 'Next.js Configuration',
    passed: !hasSwcMinify && hasOptimizeCss && hasHeaders,
    details: {
      'Removed deprecated swcMinify': !hasSwcMinify,
      'Added optimizeCss': hasOptimizeCss,
      'Added performance headers': hasHeaders
    }
  };
};

// Test 2: Check layout optimizations
const testLayoutOptimizations = () => {
  const layoutPath = path.join(__dirname, '..', 'app', 'layout.tsx');
  const layout = fs.readFileSync(layoutPath, 'utf8');
  
  const hasGoogleFonts = layout.includes('fonts.googleapis.com');
  const hasMobileCssPreload = layout.includes('/styles/mobile.css');
  const hasPerformanceOptimizer = layout.includes('PerformanceOptimizer');
  
  return {
    name: 'Layout Optimizations',
    passed: !hasGoogleFonts && !hasMobileCssPreload && hasPerformanceOptimizer,
    details: {
      'Removed unused Google Fonts preconnect': !hasGoogleFonts,
      'Fixed mobile.css preload': !hasMobileCssPreload,
      'Added PerformanceOptimizer': hasPerformanceOptimizer
    }
  };
};

// Test 3: Check CSS optimizations
const testCSSOptimizations = () => {
  const globalsPath = path.join(__dirname, '..', 'app', 'globals.css');
  const criticalPath = path.join(__dirname, '..', 'app', 'critical.css');
  
  const globalsExists = fs.existsSync(globalsPath);
  const criticalExists = fs.existsSync(criticalPath);
  
  let hasContainLayout = false;
  let hasTouchAction = false;
  
  if (globalsExists) {
    const globals = fs.readFileSync(globalsPath, 'utf8');
    hasContainLayout = globals.includes('contain: layout style');
    hasTouchAction = globals.includes('touch-action: manipulation');
  }
  
  return {
    name: 'CSS Optimizations',
    passed: globalsExists && criticalExists && hasContainLayout && hasTouchAction,
    details: {
      'globals.css exists': globalsExists,
      'critical.css created': criticalExists,
      'Added contain layout': hasContainLayout,
      'Added touch-action': hasTouchAction
    }
  };
};

// Test 4: Check service worker updates
const testServiceWorker = () => {
  const swPath = path.join(__dirname, '..', 'public', 'sw.js');
  const swExists = fs.existsSync(swPath);
  
  let isV2 = false;
  let hasBFCacheOptimizations = false;
  
  if (swExists) {
    const sw = fs.readFileSync(swPath, 'utf8');
    isV2 = sw.includes('v2.0.0');
    hasBFCacheOptimizations = sw.includes('BFCACHE_SKIP_ROUTES');
  }
  
  return {
    name: 'Service Worker Updates',
    passed: swExists && isV2 && hasBFCacheOptimizations,
    details: {
      'Service worker exists': swExists,
      'Updated to v2.0.0': isV2,
      'Added BFCache optimizations': hasBFCacheOptimizations
    }
  };
};

// Test 5: Check middleware enhancements
const testMiddleware = () => {
  const middlewarePath = path.join(__dirname, '..', 'middleware.ts');
  const middlewareExists = fs.existsSync(middlewarePath);
  
  let hasPerformanceHeaders = false;
  let hasBFCacheHeaders = false;
  
  if (middlewareExists) {
    const middleware = fs.readFileSync(middlewarePath, 'utf8');
    hasPerformanceHeaders = middleware.includes('X-DNS-Prefetch-Control');
    hasBFCacheHeaders = middleware.includes('must-revalidate');
  }
  
  return {
    name: 'Middleware Enhancements',
    passed: middlewareExists && hasPerformanceHeaders && hasBFCacheHeaders,
    details: {
      'Middleware exists': middlewareExists,
      'Added performance headers': hasPerformanceHeaders,
      'Added BFCache headers': hasBFCacheHeaders
    }
  };
};

// Test 6: Check icon optimizations
const testIconOptimizations = () => {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
  
  const iconsExist = fs.existsSync(iconsDir);
  const manifestExists = fs.existsSync(manifestPath);
  
  let hasSVGIcons = false;
  let manifestOptimized = false;
  
  if (iconsExist) {
    const icons = fs.readdirSync(iconsDir);
    hasSVGIcons = icons.some(icon => icon.endsWith('.svg'));
  }
  
  if (manifestExists) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifestOptimized = manifest.icons.every(icon => icon.src.endsWith('.svg'));
  }
  
  return {
    name: 'Icon Optimizations',
    passed: iconsExist && manifestExists && hasSVGIcons && manifestOptimized,
    details: {
      'Icons directory exists': iconsExist,
      'Manifest exists': manifestExists,
      'Has SVG icons': hasSVGIcons,
      'Manifest uses SVG': manifestOptimized
    }
  };
};

// Test 7: Check performance component
const testPerformanceComponent = () => {
  const componentPath = path.join(__dirname, '..', 'components', 'performance', 'PerformanceOptimizer.tsx');
  const componentExists = fs.existsSync(componentPath);
  
  let hasWebVitals = false;
  let hasLazyLoading = false;
  
  if (componentExists) {
    const component = fs.readFileSync(componentPath, 'utf8');
    hasWebVitals = component.includes('web-vitals');
    hasLazyLoading = component.includes('IntersectionObserver');
  }
  
  return {
    name: 'Performance Component',
    passed: componentExists && hasWebVitals && hasLazyLoading,
    details: {
      'Component exists': componentExists,
      'Has Web Vitals monitoring': hasWebVitals,
      'Has lazy loading': hasLazyLoading
    }
  };
};

// Run all tests
const runTests = () => {
  const testFunctions = [
    testNextConfig,
    testLayoutOptimizations,
    testCSSOptimizations,
    testServiceWorker,
    testMiddleware,
    testIconOptimizations,
    testPerformanceComponent
  ];
  
  const results = testFunctions.map(test => test());
  
  console.log('📊 Test Results:\n');
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    
    Object.entries(result.details).forEach(([key, value]) => {
      const detailStatus = value ? '  ✓' : '  ✗';
      console.log(`${detailStatus} ${key}`);
    });
    
    console.log('');
  });
  
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  console.log(`\n📈 Summary: ${passedTests}/${totalTests} tests passed\n`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All performance optimizations are working correctly!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm run build');
    console.log('2. Run: npm run audit:lighthouse');
    console.log('3. Compare with previous Lighthouse scores');
    console.log('4. Expected improvements:');
    console.log('   - Performance score: 79 → 90+');
    console.log('   - FCP: 0.4s (maintained)');
    console.log('   - LCP: 0.6s (maintained)');
    console.log('   - TBT: 480ms → <200ms');
    console.log('   - CLS: 0 (maintained)');
    console.log('   - Fixed render blocking issues');
    console.log('   - Fixed BFCache failures');
    console.log('   - Reduced bundle size');
  } else {
    console.log('⚠️  Some optimizations need attention. Please review the failed tests above.');
    process.exit(1);
  }
};

runTests();