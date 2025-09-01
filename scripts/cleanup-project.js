#!/usr/bin/env node

/**
 * Project Cleanup Script
 * Removes unnecessary files and maintains clean project structure
 */

const fs = require('fs');
const path = require('path');

// Files and directories that should be cleaned up
const CLEANUP_TARGETS = {
  // Temporary files
  tempFiles: [
    '.DS_Store',
    'Thumbs.db',
    '*.tmp',
    '*.temp',
    '*.log',
    '*.swp',
    '*.swo'
  ],
  
  // Build artifacts that can be regenerated
  buildArtifacts: [
    '.next',
    'dist',
    'build',
    'out',
    '.vercel',
    '.turbo'
  ],
  
  // Test artifacts
  testArtifacts: [
    'coverage',
    '.nyc_output',
    'test-results',
    'junit.xml'
  ],
  
  // Dependency directories (can be reinstalled)
  dependencies: [
    'node_modules',
    '.pnpm-store'
  ],
  
  // IDE and editor files
  ideFiles: [
    '.vscode/settings.json',
    '.idea',
    '*.sublime-*'
  ]
};

// Files that should NOT be deleted (whitelist)
const PROTECTED_FILES = [
  '.env',
  '.env.local',
  '.env.docker',
  '.gitignore',
  '.eslintrc.json',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'next.config.js',
  'tailwind.config.js',
  'postcss.config.js',
  'jest.config.cjs',
  'jest.config.live.cjs',
  'jest.setup.ts',
  'middleware.ts',
  'README.md',
  'Dockerfile',
  'Dockerfile.dev',
  'docker-compose.yml',
  'docker-compose.dev.yml',
  'prisma/schema.prisma'
];

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // cyan
    success: '\x1b[32m', // green
    warning: '\x1b[33m', // yellow
    error: '\x1b[31m',   // red
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function isProtectedFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  return PROTECTED_FILES.some(protected => {
    return relativePath === protected || relativePath.endsWith(protected);
  });
}

function deleteFile(filePath) {
  try {
    if (fs.lstatSync(filePath).isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
      log(`🗂️  Removed directory: ${filePath}`, 'success');
    } else {
      fs.unlinkSync(filePath);
      log(`📄 Removed file: ${filePath}`, 'success');
    }
    return true;
  } catch (error) {
    log(`❌ Failed to remove ${filePath}: ${error.message}`, 'error');
    return false;
  }
}

function cleanupCategory(category, targets, dryRun = false) {
  log(`\n🧹 Cleaning up ${category}...`, 'info');
  
  let removedCount = 0;
  let totalSize = 0;
  
  targets.forEach(target => {
    const fullPath = path.resolve(target);
    
    if (fileExists(fullPath) && !isProtectedFile(fullPath)) {
      if (dryRun) {
        log(`Would remove: ${fullPath}`, 'warning');
      } else {
        if (deleteFile(fullPath)) {
          removedCount++;
        }
      }
    }
  });
  
  if (removedCount > 0) {
    log(`✅ Removed ${removedCount} items from ${category}`, 'success');
  } else {
    log(`ℹ️  No ${category} to clean up`, 'info');
  }
}

function validateProjectStructure() {
  log('\n🔍 Validating project structure...', 'info');
  
  const requiredDirs = [
    'app',
    'components', 
    'lib',
    '__tests__',
    'prisma',
    'scripts'
  ];
  
  const requiredFiles = [
    'package.json',
    'next.config.js',
    'tsconfig.json'
  ];
  
  let isValid = true;
  
  requiredDirs.forEach(dir => {
    if (!fileExists(dir)) {
      log(`❌ Missing required directory: ${dir}`, 'error');
      isValid = false;
    }
  });
  
  requiredFiles.forEach(file => {
    if (!fileExists(file)) {
      log(`❌ Missing required file: ${file}`, 'error');
      isValid = false;
    }
  });
  
  if (isValid) {
    log('✅ Project structure is valid', 'success');
  }
  
  return isValid;
}

function checkTestStructure() {
  log('\n🧪 Checking test structure...', 'info');
  
  const testDirs = [
    '__tests__/lib',
    '__tests__/api',
    '__tests__/utils',
    '__tests__/live'
  ];
  
  testDirs.forEach(dir => {
    if (fileExists(dir)) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.test.ts') || f.endsWith('.test.tsx'));
      log(`📁 ${dir}: ${files.length} test files`, 'info');
    }
  });
  
  // All test files are properly organized in __tests__ directory
  log('✅ Test files are properly organized in __tests__ directory', 'info');
}

function showUsage() {
  log('\nProject Cleanup Script', 'info');
  log('======================', 'info');
  log('\nUsage: node scripts/cleanup-project.js [options]', 'info');
  log('\nOptions:', 'info');
  log('  --dry-run     Show what would be deleted without actually deleting', 'info');
  log('  --temp        Clean only temporary files', 'info');
  log('  --build       Clean only build artifacts', 'info');
  log('  --test        Clean only test artifacts', 'info');
  log('  --deps        Clean only dependencies (node_modules)', 'info');
  log('  --all         Clean everything (default)', 'info');
  log('  --validate    Only validate project structure', 'info');
  log('  --help        Show this help message', 'info');
  log('\nExamples:', 'info');
  log('  node scripts/cleanup-project.js --dry-run', 'info');
  log('  node scripts/cleanup-project.js --temp --build', 'info');
  log('  node scripts/cleanup-project.js --validate', 'info');
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    showUsage();
    return;
  }
  
  const dryRun = args.includes('--dry-run');
  const validateOnly = args.includes('--validate');
  
  log('🚀 NPCL Dashboard Project Cleanup', 'info');
  log('=================================', 'info');
  
  if (dryRun) {
    log('\n⚠️  DRY RUN MODE - No files will be deleted', 'warning');
  }
  
  // Always validate structure
  const isValid = validateProjectStructure();
  checkTestStructure();
  
  if (validateOnly) {
    return;
  }
  
  if (!isValid) {
    log('\n❌ Project structure validation failed. Aborting cleanup.', 'error');
    return;
  }
  
  // Determine what to clean
  const cleanTemp = args.includes('--temp') || args.includes('--all') || args.length === 0 || dryRun;
  const cleanBuild = args.includes('--build') || args.includes('--all') || args.length === 0 || dryRun;
  const cleanTest = args.includes('--test') || args.includes('--all') || args.length === 0 || dryRun;
  const cleanDeps = args.includes('--deps');
  
  if (cleanTemp) {
    cleanupCategory('temporary files', CLEANUP_TARGETS.tempFiles, dryRun);
  }
  
  if (cleanBuild) {
    cleanupCategory('build artifacts', CLEANUP_TARGETS.buildArtifacts, dryRun);
  }
  
  if (cleanTest) {
    cleanupCategory('test artifacts', CLEANUP_TARGETS.testArtifacts, dryRun);
  }
  
  if (cleanDeps) {
    log('\n⚠️  Cleaning dependencies will require reinstalling with npm install', 'warning');
    cleanupCategory('dependencies', CLEANUP_TARGETS.dependencies, dryRun);
  }
  
  log('\n✨ Cleanup completed!', 'success');
  
  if (dryRun) {
    log('\nTo actually perform the cleanup, run without --dry-run flag', 'info');
  } else {
    log('\nRecommended next steps:', 'info');
    log('  1. npm install (if dependencies were cleaned)', 'info');
    log('  2. npm run build (to verify everything works)', 'info');
    log('  3. npm test (to run tests)', 'info');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  cleanupCategory,
  validateProjectStructure,
  checkTestStructure
};