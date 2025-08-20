# NPCL Dashboard - Troubleshooting Guide

This guide helps you fix common terminal errors and setup issues with the NPCL Dashboard.

## 🚨 Quick Fix Commands

If you're experiencing terminal errors, try these commands in order:

```bash
# 1. Quick diagnosis
npm run diagnose

# 2. Quick fix attempt
npm run fix:quick

# 3. Comprehensive fix (if quick fix doesn't work)
npm run fix:errors

# 4. Verify everything is working
npm run verify:setup
```

## 🔍 Common Terminal Errors and Solutions

### 1. "Cannot find module '@prisma/client'"

**Cause**: Prisma client not generated or corrupted.

**Solution**:
```bash
npx prisma generate
```

**If that doesn't work**:
```bash
rm -rf node_modules/.prisma
npm install
npx prisma generate
```

### 2. "Module not found: Can't resolve 'next/font'"

**Cause**: Next.js version compatibility issue.

**Solution**:
```bash
npm install next@latest
npm run build
```

### 3. "Error: Environment variable not found: DATABASE_URL"

**Cause**: Missing or incorrect environment variables.

**Solution**:
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your actual values
# Make sure to set:
# - DATABASE_URL
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL
```

### 4. "TypeError: Cannot read properties of undefined"

**Cause**: Missing NEXT_PUBLIC_ prefix for client-side variables.

**Solution**: Check your `.env` file and ensure client-side variables have the `NEXT_PUBLIC_` prefix:
```bash
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NEXT_PUBLIC_ENABLE_REGISTRATION="true"
```

### 5. "Error loading shared library libssl.so.1.1"

**Cause**: Docker OpenSSL compatibility issue (already fixed in this project).

**Solution**:
```bash
# Use the provided fix script
./run-prisma-fix.sh

# Or manually restart Docker with Debian images
npm run docker:fix:restart
```

### 6. "Jest encountered an unexpected token"

**Cause**: Jest configuration issues with ES modules or Prisma.

**Solution**: The project already includes fixes in `jest.config.ts` and `jest.setup.ts`. If you still have issues:
```bash
npx jest --clearCache
npm test
```

### 7. "TypeScript compilation errors"

**Cause**: Type mismatches or missing type definitions.

**Solution**:
```bash
# Check for specific errors
npx tsc --noEmit

# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
npm install
```

### 8. "EADDRINUSE: address already in use :::3000"

**Cause**: Port 3000 is already in use.

**Solution**:
```bash
# Kill process using port 3000
npx kill-port 3000

# Or use a different port
PORT=3001 npm run dev
```

## 🛠️ Comprehensive Troubleshooting Steps

### Step 1: System Requirements Check
```bash
# Check Node.js version (should be >=18)
node --version

# Check npm version
npm --version

# Check if you're in the right directory
ls package.json
```

### Step 2: Clean Installation
```bash
# Remove all generated files
rm -rf node_modules package-lock.json .next

# Fresh install
npm install

# Generate Prisma client
npx prisma generate
```

### Step 3: Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings
# Required variables:
# - DATABASE_URL
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL
```

### Step 4: Database Setup
```bash
# If using local PostgreSQL
createdb npcl-auth-db

# Push schema to database
npm run db:push

# Seed initial data
npm run db:seed
```

### Step 5: Build Test
```bash
# Test TypeScript compilation
npx tsc --noEmit

# Test Next.js build
npm run build

# Test development server
npm run dev
```

## 🐳 Docker Troubleshooting

### Docker Won't Start
```bash
# Clean Docker environment
npm run docker:clean

# Restart with fresh build
npm run docker:dev
```

### Database Connection Issues in Docker
```bash
# Check if PostgreSQL container is running
docker ps

# Check database logs
npm run docker:logs:db

# Reset database
npm run docker:db:reset
```

### Prisma Issues in Docker
```bash
# The project uses Debian-based images to avoid OpenSSL issues
# If you encounter Prisma errors, run:
./fix-prisma-openssl-docker.sh
```

## 🧪 Testing Issues

### Tests Failing
```bash
# Clear Jest cache
npx jest --clearCache

# Run tests with verbose output
npm test -- --verbose

# Run specific test suites
npm run test:unit
npm run test:api
```

### Prisma Mocking Issues
The project includes comprehensive Prisma mocking in `jest.setup.ts`. If you encounter issues:
```bash
# Check the Jest configuration
cat jest.config.ts

# Verify mock setup
cat jest.setup.ts
```

## 📋 Diagnostic Commands

### Quick Health Check
```bash
npm run health:check
```

### Detailed Diagnosis
```bash
npm run diagnose
```

### Setup Verification
```bash
npm run verify:setup
```

### Manual Checks
```bash
# Check if Prisma client exists
ls node_modules/.prisma/client

# Check environment variables
cat .env

# Check TypeScript compilation
npx tsc --noEmit --skipLibCheck

# Test Prisma import
node -e "console.log(require('@prisma/client'))"
```

## 🔧 Advanced Troubleshooting

### Clear All Caches
```bash
# Clear npm cache
npm cache clean --force

# Clear Next.js cache
rm -rf .next

# Clear Jest cache
npx jest --clearCache

# Clear TypeScript cache
rm -rf .tsbuildinfo
```

### Reset Everything
```bash
# Nuclear option - reset everything
rm -rf node_modules package-lock.json .next .tsbuildinfo
npm install
npx prisma generate
npm run build
```

### Check for Port Conflicts
```bash
# Check what's using port 3000
lsof -i :3000

# Kill process using port 3000
npx kill-port 3000
```

## 📞 Getting Help

If you're still experiencing issues after trying these solutions:

1. **Check the error message carefully** - it often contains the exact solution
2. **Look at the project documentation**:
   - `README.md` - General setup instructions
   - `JEST_FIXES_SUMMARY.md` - Testing issues
   - `PRISMA_OPENSSL_FIX_APPLIED.md` - Docker/Prisma issues
3. **Run the diagnostic script**: `npm run diagnose`
4. **Check the logs**: Look for specific error messages in the terminal output

## 🎯 Prevention Tips

1. **Always use the correct Node.js version** (>=18.0.0)
2. **Keep your .env file updated** with the correct variables
3. **Run `npx prisma generate`** after any schema changes
4. **Use the provided npm scripts** instead of running commands manually
5. **Keep dependencies updated** but test thoroughly after updates

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Docker Documentation](https://docs.docker.com)

---

**Remember**: Most terminal errors in this project are related to:
1. Missing Prisma client generation
2. Incorrect environment variables
3. Missing NEXT_PUBLIC_ prefixes for client-side variables
4. Node.js version compatibility
5. Docker OpenSSL issues (already fixed)

The scripts provided in this project should handle most common issues automatically.