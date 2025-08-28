# Quick Fix for Rate Limiting Test Issues

## Problem Identified
The server is returning HTML instead of JSON from API endpoints, which means:
1. The wrong application is running on port 3000
2. The Next.js API routes are not being served properly
3. A different server (possibly Qodo Command) is running instead

## Quick Fixes

### Option 1: Use PowerShell Script (Recommended for Windows)
```powershell
# Run the Windows-compatible test script
.\scripts\testing\test-rate-limiting-windows.ps1

# Or with custom parameters
.\scripts\testing\test-rate-limiting-windows.ps1 -Email "user@npcl.com" -Attempts 10
```

### Option 2: Diagnose Server Issues
```bash
# Run diagnostic to see what's actually running
node scripts/testing/diagnose-server.js
```

### Option 3: Fix Server and Test
```bash
# 1. Stop any running servers
# Press Ctrl+C in any terminal running servers

# 2. Make sure you're in the right directory
cd C:\Users\shaik\OneDrive\Documents\GitHub\next-app

# 3. Start the Next.js development server
npm run dev

# 4. In a new terminal, test rate limiting
node scripts/testing/quick-test.js
```

### Option 4: Test with curl (if available)
```bash
# Test the API endpoint directly
curl -X POST http://localhost:3000/api/auth/test-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpassword"}'
```

## Environment Variable Fix for Windows
Instead of:
```bash
TEST_EMAIL=user@npcl.com node scripts/testing/quick-test.js
```

Use PowerShell:
```powershell
$env:TEST_EMAIL="user@npcl.com"; node scripts/testing/quick-test.js
```

Or use the PowerShell script with parameters:
```powershell
.\scripts\testing\test-rate-limiting-windows.ps1 -Email "user@npcl.com"
```

## Expected Working Output
When the server is running correctly, you should see:
```
Attempt 1/8...
  ❌ Status: 404 | User not found

Attempt 2/8...
  ❌ Status: 404 | User not found

...

Attempt 6/8...
  🚫 Status: 429 | Too many authentication attempts. Please try again later.
     Rate Limited: 6 attempts, retry after 847s
```

## Troubleshooting Steps
1. **Check what's running on port 3000**
   ```bash
   netstat -ano | findstr :3000
   ```

2. **Verify you're in the correct project directory**
   ```bash
   dir package.json
   # Should show NPCL Dashboard package.json
   ```

3. **Check if Next.js is properly installed**
   ```bash
   npm list next
   ```

4. **Start fresh**
   ```bash
   # Kill any processes on port 3000
   # Then start the correct server
   npm run dev
   ```