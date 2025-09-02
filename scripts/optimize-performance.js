#!/usr/bin/env node

/**
 * Performance Optimization Script
 * Applies various performance optimizations to the NPCL Dashboard
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting performance optimization...');

// 1. Create optimized CSS for critical path
const createCriticalCSS = () => {
  console.log('📝 Creating critical CSS...');
  
  const criticalCSS = `
/* Critical CSS - Above the fold styles */
html{overflow-x:hidden;scroll-behavior:smooth;-webkit-text-size-adjust:100%;-moz-text-size-adjust:100%;text-size-adjust:100%;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
body{overflow-x:hidden;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;contain:layout style}
.min-h-screen{min-height:100vh;min-height:100dvh}
*{touch-action:manipulation}
img{height:auto;max-width:100%}
.btn{min-height:44px;padding:8px 16px;border-radius:8px;font-weight:500;transition:all 0.2s ease;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent}
.btn-primary{background-color:#4f46e5;color:white;border:none}
.btn-primary:hover{background-color:#4338ca}
.form-input{display:block;width:100%;padding:12px 16px;font-size:16px;border:2px solid #e5e7eb;border-radius:8px;transition:border-color 0.2s ease}
.form-input:focus{border-color:#4f46e5;outline:none;box-shadow:0 0 0 3px rgba(79,70,229,0.1)}
`;

  const criticalCSSPath = path.join(__dirname, '..', 'app', 'critical.css');
  fs.writeFileSync(criticalCSSPath, criticalCSS);
  console.log('✅ Critical CSS created');
};

// 2. Optimize images and icons
const optimizeIcons = () => {
  console.log('🎨 Optimizing icons...');
  
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  const icons = fs.readdirSync(iconsDir).filter(file => file.endsWith('.svg'));
  
  icons.forEach(icon => {
    const iconPath = path.join(iconsDir, icon);
    let content = fs.readFileSync(iconPath, 'utf8');
    
    // Minify SVG content
    content = content
      .replace(/\\s+/g, ' ')
      .replace(/> </g, '><')
      .replace(/\\n/g, '')
      .trim();
    
    fs.writeFileSync(iconPath, content);
  });
  
  console.log(`✅ Optimized ${icons.length} SVG icons`);
};

// 3. Create performance monitoring script
const createPerformanceMonitor = () => {
  console.log('📊 Creating performance monitor...');
  
  const monitorScript = `
// Performance monitoring for NPCL Dashboard
(function() {
  'use strict';
  
  // Web Vitals monitoring
  function measureWebVitals() {
    if ('web-vitals' in window) {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = window.webVitals;
      
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    }
  }
  
  // Performance observer for long tasks
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn('Long task detected:', entry.duration + 'ms');
        }
      }
    });
    
    observer.observe({ entryTypes: ['longtask'] });
  }
  
  // Monitor resource loading
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    
    console.log('Navigation timing:', {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      totalTime: navigation.loadEventEnd - navigation.fetchStart
    });
    
    // Log slow resources
    resources.forEach(resource => {
      if (resource.duration > 1000) {
        console.warn('Slow resource:', resource.name, resource.duration + 'ms');
      }
    });
    
    measureWebVitals();
  });
})();
`;

  const monitorPath = path.join(__dirname, '..', 'public', 'performance-monitor.js');
  fs.writeFileSync(monitorPath, monitorScript);
  console.log('✅ Performance monitor created');
};

// 4. Create optimized manifest
const optimizeManifest = () => {
  console.log('📱 Optimizing PWA manifest...');
  
  const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Remove shortcuts that reference missing icons
  manifest.shortcuts = [];
  
  // Remove screenshots that reference missing files
  manifest.screenshots = [];
  
  // Optimize icons array to only include existing SVG files
  manifest.icons = manifest.icons.filter(icon => {
    const iconPath = path.join(__dirname, '..', 'public', icon.src);
    return fs.existsSync(iconPath);
  });
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ PWA manifest optimized');
};

// 5. Create bundle analyzer script
const createBundleAnalyzer = () => {
  console.log('📦 Creating bundle analyzer...');
  
  const analyzerScript = `
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  webpack: (config, { isServer }) => {
    if (process.env.ANALYZE === 'true') {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: isServer ? '../analyze/server.html' : './analyze/client.html',
          openAnalyzer: false,
        })
      );
    }
    return config;
  },
};
`;

  const analyzerPath = path.join(__dirname, 'bundle-analyzer.js');
  fs.writeFileSync(analyzerPath, analyzerScript);
  console.log('✅ Bundle analyzer script created');
};

// 6. Update package.json scripts
const updatePackageScripts = () => {
  console.log('📝 Updating package.json scripts...');
  
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Add performance scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    'perf:analyze': 'ANALYZE=true npm run build',
    'perf:monitor': 'node scripts/performance-monitor.js',
    'perf:optimize': 'node scripts/optimize-performance.js',
    'perf:lighthouse': 'npm run audit:lighthouse',
    'perf:all': 'npm run perf:optimize && npm run build && npm run perf:lighthouse'
  };
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Package.json scripts updated');
};

// Run all optimizations
async function runOptimizations() {
  try {
    createCriticalCSS();
    optimizeIcons();
    createPerformanceMonitor();
    optimizeManifest();
    createBundleAnalyzer();
    updatePackageScripts();
    
    console.log('\\n🎉 Performance optimization completed successfully!');
    console.log('\\n📋 Next steps:');
    console.log('1. Run: npm run build');
    console.log('2. Run: npm run audit:lighthouse');
    console.log('3. Check performance improvements');
    
  } catch (error) {
    console.error('❌ Error during optimization:', error);
    process.exit(1);
  }
}

runOptimizations();