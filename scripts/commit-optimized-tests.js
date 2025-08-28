#!/usr/bin/env node

/**
 * Commit Optimized Tests Script
 * 
 * This script commits the optimized tests to a new branch,
 * similar to what qodo-cover commit would do.
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BRANCH_NAME = 'optimized-tests';
const TEST_DIR = 'tests/optimized';

console.log('🚀 Committing Optimized Tests...\n');

// Function to execute git commands
function execGit(command, options = {}) {
  try {
    const result = execSync(`git ${command}`, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return result.trim();
  } catch (error) {
    throw new Error(`Git command failed: git ${command}\n${error.message}`);
  }
}

// Function to check if we're in a git repository
function checkGitRepo() {
  try {
    execGit('rev-parse --git-dir', { silent: true });
    return true;
  } catch {
    return false;
  }
}

// Function to check if branch exists
function branchExists(branchName) {
  try {
    execGit(`rev-parse --verify ${branchName}`, { silent: true });
    return true;
  } catch {
    return false;
  }
}

// Function to get current branch
function getCurrentBranch() {
  try {
    return execGit('branch --show-current', { silent: true });
  } catch {
    return 'main'; // fallback
  }
}

// Function to check if there are uncommitted changes
function hasUncommittedChanges() {
  try {
    const status = execGit('status --porcelain', { silent: true });
    return status.length > 0;
  } catch {
    return false;
  }
}

// Function to create and switch to branch
function createAndSwitchBranch() {
  const currentBranch = getCurrentBranch();
  console.log(`📍 Current branch: ${currentBranch}`);

  if (branchExists(BRANCH_NAME)) {
    console.log(`🔄 Branch '${BRANCH_NAME}' already exists. Switching to it...`);
    execGit(`checkout ${BRANCH_NAME}`);
  } else {
    console.log(`🌿 Creating new branch '${BRANCH_NAME}'...`);
    execGit(`checkout -b ${BRANCH_NAME}`);
  }
}

// Function to stage and commit optimized tests
function commitOptimizedTests() {
  console.log('📁 Staging optimized test files...');
  
  // Stage the optimized test directory
  if (fs.existsSync(TEST_DIR)) {
    execGit(`add ${TEST_DIR}/`);
  }
  
  // Stage the validation script
  if (fs.existsSync('scripts/validate-coverage.js')) {
    execGit('add scripts/validate-coverage.js');
  }
  
  // Stage this commit script
  if (fs.existsSync('scripts/commit-optimized-tests.js')) {
    execGit('add scripts/commit-optimized-tests.js');
  }

  // Check if there are changes to commit
  try {
    const stagedChanges = execGit('diff --cached --name-only', { silent: true });
    if (!stagedChanges) {
      console.log('ℹ️  No changes to commit.');
      return false;
    }

    console.log('📝 Staged files:');
    stagedChanges.split('\n').forEach(file => {
      console.log(`   ${file}`);
    });

    // Create commit
    const commitMessage = `feat: add optimized auth tests with improved coverage

- Optimized auth.test.ts with better test organization
- Removed redundant test cases
- Added comprehensive edge case testing
- Improved test coverage for password and token management
- Added integration test scenarios
- Created coverage validation script

Coverage improvements:
- Enhanced password hashing/verification tests
- Added reset token generation/hashing tests
- Comprehensive deprecated function testing
- Edge case handling for empty inputs
- Integration scenarios for complete workflows`;

    console.log('💾 Committing changes...');
    execGit(`commit -m "${commitMessage}"`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to commit changes:', error.message);
    return false;
  }
}

// Function to generate summary
function generateSummary() {
  console.log('\n📊 Optimization Summary:');
  console.log('========================');
  
  const originalTestFile = '__tests__/lib/auth.test.ts';
  const optimizedTestFile = 'tests/optimized/auth.test.ts';
  
  if (fs.existsSync(originalTestFile) && fs.existsSync(optimizedTestFile)) {
    const originalContent = fs.readFileSync(originalTestFile, 'utf8');
    const optimizedContent = fs.readFileSync(optimizedTestFile, 'utf8');
    
    const originalLines = originalContent.split('\n').length;
    const optimizedLines = optimizedContent.split('\n').length;
    
    const originalTests = (originalContent.match(/it\(/g) || []).length;
    const optimizedTests = (optimizedContent.match(/it\(/g) || []).length;
    
    console.log(`📏 Lines of code: ${originalLines} → ${optimizedLines} (${optimizedLines > originalLines ? '+' : ''}${optimizedLines - originalLines})`);
    console.log(`🧪 Test cases: ${originalTests} → ${optimizedTests} (${optimizedTests > originalTests ? '+' : ''}${optimizedTests - originalTests})`);
    console.log(`✨ Improvements:`);
    console.log(`   - Better test organization with describe blocks`);
    console.log(`   - Comprehensive edge case testing`);
    console.log(`   - Integration test scenarios`);
    console.log(`   - Improved mocking and setup`);
    console.log(`   - Enhanced error handling tests`);
  }
  
  console.log(`\n📁 Files created:`);
  console.log(`   - ${optimizedTestFile}`);
  console.log(`   - scripts/validate-coverage.js`);
  console.log(`   - scripts/commit-optimized-tests.js`);
}

// Main execution
async function main() {
  try {
    // Check if we're in a git repository
    if (!checkGitRepo()) {
      throw new Error('Not in a git repository. Please run this script from the project root.');
    }

    // Check if test directory exists
    if (!fs.existsSync(TEST_DIR)) {
      throw new Error(`Optimized test directory '${TEST_DIR}' not found.`);
    }

    // Warn about uncommitted changes
    if (hasUncommittedChanges()) {
      console.log('⚠️  Warning: You have uncommitted changes. Consider committing them first.');
      console.log('   Continuing with optimized test commit...\n');
    }

    // Create and switch to branch
    createAndSwitchBranch();

    // Commit optimized tests
    const committed = commitOptimizedTests();

    if (committed) {
      console.log(`\n✅ Successfully committed optimized tests to branch '${BRANCH_NAME}'`);
      
      // Generate summary
      generateSummary();
      
      console.log(`\n🎯 Next steps:`);
      console.log(`   1. Run: node scripts/validate-coverage.js`);
      console.log(`   2. Review the optimized tests`);
      console.log(`   3. Merge the branch when ready: git checkout main && git merge ${BRANCH_NAME}`);
    } else {
      console.log('\nℹ️  No changes were committed.');
    }

  } catch (error) {
    console.error('\n❌ Failed to commit optimized tests:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { commitOptimizedTests, createAndSwitchBranch };