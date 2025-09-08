# How to View All Test Errors

## Quick Solutions (try these first):

### 1. Save output to file and view:
```bash
npm test > test-results.txt 2>&1
notepad test-results.txt
```

### 2. Use the new debug command:
```bash
npm run test:debug
```

### 3. Run tests one file at a time:
```bash
# Test just the LoginForm component
npm test __tests__/components/LoginForm.test.tsx

# Test just the integration tests
npm test __tests__/api/auth/login.integration.test.ts

# Test just validation
npm test __tests__/lib/validations.test.ts
```

### 4. Use the batch script (Windows):
```bash
scripts\test-with-full-output.bat
```

### 5. Increase terminal buffer:
```bash
# In Command Prompt
mode con: cols=120 lines=9999
npm test

# In PowerShell
npm test | Out-Host -Paging
```

## What Each Command Does:

- `npm test` - Now runs with verbose output and no coverage
- `npm run test:debug` - Runs tests sequentially with full verbose output
- `npm run test:errors-only` - Shows only errors and failures
- `npm run test:full` - Original test command with coverage

## Files Created:
- `logs/test-output.log` - Full test output when using batch script
- `test-results.txt` - When redirecting output manually

## Tips:
1. Use `Ctrl+F` in notepad to search for "FAIL" or "Error"
2. The batch script will show a summary of errors
3. Run individual test files to isolate issues
4. Use `--bail` flag to stop on first failure: `npm test -- --bail`