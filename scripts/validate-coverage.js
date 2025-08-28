#!/usr/bin/env node

/**
 * Test Coverage Validation Script
 * 
 * This script validates test coverage for the optimized test suite,
 * similar to what qodo-cover validate would do.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const COVERAGE_THRESHOLD = {
  statements: 90,
  branches: 85,
  functions: 90,
  lines: 90
};

const TEST_DIR = 'tests/optimized';
const COVERAGE_DIR = 'coverage';

console.log('🧪 Validating Test Coverage for Optimized Tests...\n');

// Function to run Jest with coverage
function runCoverageTest() {
  return new Promise((resolve, reject) => {
    const jestArgs = [
      '--coverage',
      '--coverageDirectory=coverage/optimized',
      '--coverageReporters=json,text,html',
      '--testPathPattern=tests/optimized',
      '--collectCoverageFrom=lib/auth.ts',
      '--passWithNoTests=false'
    ];

    console.log('📊 Running Jest with coverage...');
    const jestProcess = spawn('npx', ['jest', ...jestArgs], {
      stdio: 'inherit',
      shell: true
    });

    jestProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Jest exited with code ${code}`));
      }
    });

    jestProcess.on('error', (error) => {
      reject(error);
    });
  });
}

// Function to validate coverage against thresholds
function validateCoverage() {
  const coverageFile = path.join('coverage', 'optimized', 'coverage-final.json');
  
  if (!fs.existsSync(coverageFile)) {
    throw new Error('Coverage file not found. Make sure Jest coverage ran successfully.');
  }

  const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
  const authFile = Object.keys(coverage).find(file => file.includes('lib/auth.ts'));
  
  if (!authFile) {
    throw new Error('Coverage data for lib/auth.ts not found.');
  }

  const fileCoverage = coverage[authFile];
  const summary = {
    statements: fileCoverage.s ? calculatePercentage(fileCoverage.s) : 0,
    branches: fileCoverage.b ? calculateBranchPercentage(fileCoverage.b) : 0,
    functions: fileCoverage.f ? calculatePercentage(fileCoverage.f) : 0,
    lines: fileCoverage.l ? calculatePercentage(fileCoverage.l) : 0
  };

  console.log('\n📈 Coverage Summary for lib/auth.ts:');
  console.log('=====================================');
  console.log(`Statements: ${summary.statements.toFixed(2)}% (threshold: ${COVERAGE_THRESHOLD.statements}%)`);
  console.log(`Branches:   ${summary.branches.toFixed(2)}% (threshold: ${COVERAGE_THRESHOLD.branches}%)`);
  console.log(`Functions:  ${summary.functions.toFixed(2)}% (threshold: ${COVERAGE_THRESHOLD.functions}%)`);
  console.log(`Lines:      ${summary.lines.toFixed(2)}% (threshold: ${COVERAGE_THRESHOLD.lines}%)`);

  // Check if all thresholds are met
  const failures = [];
  if (summary.statements < COVERAGE_THRESHOLD.statements) {
    failures.push(`Statements: ${summary.statements.toFixed(2)}% < ${COVERAGE_THRESHOLD.statements}%`);
  }
  if (summary.branches < COVERAGE_THRESHOLD.branches) {
    failures.push(`Branches: ${summary.branches.toFixed(2)}% < ${COVERAGE_THRESHOLD.branches}%`);
  }
  if (summary.functions < COVERAGE_THRESHOLD.functions) {
    failures.push(`Functions: ${summary.functions.toFixed(2)}% < ${COVERAGE_THRESHOLD.functions}%`);
  }
  if (summary.lines < COVERAGE_THRESHOLD.lines) {
    failures.push(`Lines: ${summary.lines.toFixed(2)}% < ${COVERAGE_THRESHOLD.lines}%`);
  }

  if (failures.length > 0) {
    console.log('\n❌ Coverage validation failed:');
    failures.forEach(failure => console.log(`   ${failure}`));
    return false;
  } else {
    console.log('\n✅ All coverage thresholds met!');
    return true;
  }
}

// Helper functions
function calculatePercentage(coverageData) {
  const values = Object.values(coverageData);
  const covered = values.filter(v => v > 0).length;
  return values.length > 0 ? (covered / values.length) * 100 : 0;
}

function calculateBranchPercentage(branchData) {
  let total = 0;
  let covered = 0;
  
  Object.values(branchData).forEach(branches => {
    branches.forEach(branch => {
      total++;
      if (branch > 0) covered++;
    });
  });
  
  return total > 0 ? (covered / total) * 100 : 0;
}

// Function to generate coverage report
function generateReport() {
  console.log('\n📋 Generating detailed coverage report...');
  console.log(`📁 HTML report available at: coverage/optimized/index.html`);
  console.log(`📄 JSON report available at: coverage/optimized/coverage-final.json`);
}

// Main execution
async function main() {
  try {
    // Run tests with coverage
    await runCoverageTest();
    
    // Validate coverage
    const passed = validateCoverage();
    
    // Generate report
    generateReport();
    
    if (passed) {
      console.log('\n🎉 Coverage validation completed successfully!');
      process.exit(0);
    } else {
      console.log('\n💡 Tip: Add more test cases to improve coverage.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Coverage validation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { validateCoverage, runCoverageTest };