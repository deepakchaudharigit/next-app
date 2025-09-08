#!/bin/bash

echo "Running tests with full error output..."
echo

# Create logs directory if it doesn't exist
mkdir -p logs

# Run tests and capture all output
npm test > logs/test-output.log 2>&1

# Display the results
echo "Test completed. Results saved to logs/test-output.log"
echo
echo "=== SUMMARY ==="
grep -E "(FAIL|PASS|Test Suites:|Tests:)" logs/test-output.log

echo
echo "=== ERRORS ==="
grep -E "(Error:|TypeError:|ReferenceError:|Failed)" logs/test-output.log

echo
echo "Full output saved to: logs/test-output.log"
echo "To view full output: cat logs/test-output.log"