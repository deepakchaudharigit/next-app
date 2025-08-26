# TypeScript Error Fixing Guide

This guide helps you find and fix common TypeScript errors like "Cannot find module 'react' or its corresponding type declarations.ts(2307)".

## Quick Fix (Recommended)

For most common issues, run the quick fix script:

```bash
npm run ts:quick-fix
```

This will:
- Install missing dependencies
- Install missing type declarations
- Regenerate Prisma client
- Clear Next.js cache
- Run TypeScript check

## Comprehensive Diagnosis

For a detailed analysis of your TypeScript setup:

```bash
npm run ts:diagnose
```

This will check:
- Environment setup (Node.js, npm, TypeScript)
- File structure
- Dependencies and type declarations
- TypeScript configuration
- Import statements
- Compiler errors

## Advanced Fix

For complex issues that need automatic fixing:

```bash
npm run ts:fix
```

This will:
- Detect and categorize TypeScript errors
- Apply automatic fixes where possible
- Update configuration files
- Install missing packages
- Provide manual fix suggestions

## Manual TypeScript Check

To manually check for TypeScript errors:

```bash
npm run type:check
```

Or with watch mode:

```bash
npm run type:check:watch
```

## Common TypeScript Errors and Solutions

### 1. Cannot find module 'react' (TS2307)

**Error:**
```
Cannot find module 'react' or its corresponding type declarations.ts(2307)
```

**Solutions:**
```bash
# Install React type declarations
npm install --save-dev @types/react @types/react-dom

# Or run quick fix
npm run ts:quick-fix
```

### 2. Cannot find module '@/...' (Path Mapping Issues)

**Error:**
```
Cannot find module '@/components/...' or its corresponding type declarations.
```

**Solution:**
Check your `tsconfig.json` paths configuration:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@lib/*": ["./lib/*"],
      "@components/*": ["./components/*"]
    }
  }
}
```

### 3. Cannot find name 'React' (TS2304)

**Error:**
```
Cannot find name 'React'.ts(2304)
```

**Solution:**
Add React import to your JSX files:

```typescript
import React from 'react';
// or
import { useState } from 'react';
```

### 4. Module has no exported member (TS2305)

**Error:**
```
Module '"next-auth"' has no exported member 'Session'.ts(2305)
```

**Solution:**
Check the correct import path and available exports:

```typescript
// Correct
import { Session } from 'next-auth';

// Or check documentation for correct import
import type { Session } from 'next-auth';
```

### 5. Prisma Client Issues

**Error:**
```
Cannot find module '@prisma/client' or its corresponding type declarations.
```

**Solution:**
```bash
# Regenerate Prisma client
npx prisma generate

# Or install Prisma client
npm install @prisma/client
```

## IDE/Editor Issues

### VS Code

1. **Restart TypeScript Language Server:**
   - Open Command Palette (Ctrl+Shift+P)
   - Run "TypeScript: Restart TS Server"

2. **Clear VS Code Cache:**
   - Close VS Code
   - Delete `.vscode` folder (if exists)
   - Restart VS Code

3. **Check TypeScript Version:**
   - Open Command Palette
   - Run "TypeScript: Select TypeScript Version"
   - Choose "Use Workspace Version"

### Other IDEs

- Restart the TypeScript language service
- Clear IDE cache
- Reload the project

## Troubleshooting Steps

1. **Clear all caches:**
   ```bash
   rm -rf node_modules package-lock.json .next
   npm install
   ```

2. **Regenerate everything:**
   ```bash
   npm install
   npx prisma generate
   npm run build
   ```

3. **Check Node.js version:**
   ```bash
   node --version  # Should be >= 18.0.0
   ```

4. **Verify TypeScript installation:**
   ```bash
   npx tsc --version
   ```

## Prevention Tips

1. **Always install type declarations** for third-party packages:
   ```bash
   npm install --save-dev @types/package-name
   ```

2. **Keep dependencies updated:**
   ```bash
   npm update
   ```

3. **Use consistent import paths** throughout your project

4. **Configure your IDE** to use the workspace TypeScript version

5. **Run type checks regularly:**
   ```bash
   npm run type:check
   ```

## Getting Help

If you're still experiencing issues after trying these solutions:

1. Run the diagnostic tool: `npm run ts:diagnose`
2. Check the output for specific error codes
3. Search for the specific error code (e.g., "TS2307") in TypeScript documentation
4. Check if it's a known issue with the specific package you're using

## Useful Commands Summary

```bash
# Quick fixes
npm run ts:quick-fix          # Fix common issues automatically
npm run ts:diagnose           # Comprehensive diagnosis
npm run ts:fix               # Advanced automatic fixing

# Manual checks
npm run type:check           # Check TypeScript errors
npm run type:check:watch     # Watch mode
npm run lint:fix             # Fix ESLint issues

# Cache clearing
rm -rf .next                 # Clear Next.js cache
rm -rf node_modules          # Clear dependencies
npx prisma generate          # Regenerate Prisma client
```