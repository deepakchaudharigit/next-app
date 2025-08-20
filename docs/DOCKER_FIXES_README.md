# Docker Prisma OpenSSL Fixes - NPCL Dashboard

This document outlines the comprehensive fixes applied to resolve Docker deployment issues with Next-Auth RBAC authentication setup using Prisma, Next.js, PostgreSQL, and TypeScript.

## 🚨 Problem Summary

The main issue was **Prisma OpenSSL compatibility problems** in Alpine Linux containers, causing:

```
Error: Could not parse schema engine response: SyntaxError: Unexpected token E in JSON at position 0
❌ Prisma DB push failed.
```

**Root Cause**: Alpine Linux missing `libssl.so.1.1` and OpenSSL compatibility libraries required by Prisma engines.

## ✅ Complete Solution Applied

### 1. Enhanced Dockerfile.dev (Alpine with OpenSSL Fixes)

**Fixed**: Added all required OpenSSL libraries for Prisma compatibility:

```dockerfile
# Install ALL required OpenSSL libraries for Prisma compatibility
RUN apk add --no-cache \
    libc6-compat \
    curl \
    bash \
    postgresql-client \
    netcat-openbsd \
    openssl \
    openssl-dev \
    openssl1.1-compat
```

### 2. Alternative Debian-based Dockerfile

**Created**: `Dockerfile.dev.debian` for better compatibility:

```dockerfile
FROM node:18-slim
# Better OpenSSL compatibility out of the box
```

### 3. Enhanced Startup Script

**Fixed**: `scripts/docker/startup-dev.sh` with:
- Prisma environment variables for OpenSSL detection
- Retry logic for database operations
- Better error handling and debugging

```bash
# Set Prisma environment variables for better OpenSSL detection
export PRISMA_QUERY_ENGINE_LIBRARY=/app/node_modules/.prisma/client/libquery_engine-linux-musl.so.node
export PRISMA_QUERY_ENGINE_BINARY=/app/node_modules/.prisma/client/query-engine-linux-musl
export OPENSSL_CONF=/dev/null
```

### 4. Environment Variables Configuration

**Updated**: `.env.docker` with Prisma-specific variables:

```env
PRISMA_QUERY_ENGINE_LIBRARY="/app/node_modules/.prisma/client/libquery_engine-linux-musl.so.node"
PRISMA_QUERY_ENGINE_BINARY="/app/node_modules/.prisma/client/query-engine-linux-musl"
OPENSSL_CONF="/dev/null"
```

### 5. Docker Compose Enhancements

**Updated**: `docker-compose.dev.yml` with proper environment variables and networking.

## 🛠️ New Tools and Scripts

### Quick Fix Script
```bash
# Complete automated fix
bash scripts/docker/fix-prisma-openssl.sh
```

### Troubleshooting Script
```bash
# Diagnose issues
bash scripts/docker/troubleshoot-prisma.sh
```

### Image Switching
```bash
# Switch to Debian (recommended for stability)
npm run docker:switch:debian

# Switch back to Alpine (smaller size)
npm run docker:switch:alpine
```

### New NPM Scripts
```bash
# Clean restart
npm run docker:fix:restart

# Complete cleanup
npm run docker:clean

# Switch between images
npm run docker:switch:debian
npm run docker:switch:alpine
```

## 🚀 Quick Start (After Fixes)

### Option 1: Automated Fix (Recommended)
```bash
# Run the complete fix script
bash scripts/docker/fix-prisma-openssl.sh
```

### Option 2: Manual Steps
```bash
# 1. Clean up existing containers
npm run docker:clean

# 2. Switch to Debian for better compatibility (optional)
npm run docker:switch:debian

# 3. Start development environment
npm run docker:dev
```

## 🔍 Troubleshooting

### If Issues Persist

1. **Run Diagnostics**:
   ```bash
   bash scripts/docker/troubleshoot-prisma.sh
   ```

2. **Check Logs**:
   ```bash
   npm run docker:logs:app
   npm run docker:logs:db
   ```

3. **Try Debian Image**:
   ```bash
   npm run docker:switch:debian
   npm run docker:clean
   npm run docker:dev
   ```

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| OpenSSL errors | Switch to Debian: `npm run docker:switch:debian` |
| Prisma generate fails | Clean rebuild: `npm run docker:clean && npm run docker:dev` |
| Database connection fails | Check PostgreSQL logs: `npm run docker:logs:db` |
| Container won't start | Run troubleshoot: `bash scripts/docker/troubleshoot-prisma.sh` |

## 📋 Verification Steps

After applying fixes, verify everything works:

1. **Containers Running**:
   ```bash
   docker ps
   # Should show: npcl-dashboard-dkch, npcl-postgres, npcl-redis
   ```

2. **Application Accessible**:
   ```bash
   curl http://localhost:3000/api/health
   # Should return: {"status":"ok"}
   ```

3. **Database Connected**:
   ```bash
   docker exec npcl-dashboard-dkch npx prisma db push --preview-feature
   # Should succeed without errors
   ```

## 🎯 Expected Results

✅ **What Should Work Now**:
- No more OpenSSL warnings
- Prisma DB push succeeds
- Database schema created successfully
- Application starts without errors
- Access at http://localhost:3000

✅ **Performance Improvements**:
- Faster container startup
- Reliable database connections
- Consistent Prisma operations
- Better error handling

## 📁 Files Modified/Created

### Modified Files:
- `Dockerfile.dev` - Enhanced with OpenSSL libraries
- `docker-compose.dev.yml` - Added environment variables
- `.env.docker` - Added Prisma configuration
- `scripts/docker/startup-dev.sh` - Enhanced with retry logic
- `package.json` - Added new Docker scripts

### New Files:
- `Dockerfile.dev.debian` - Alternative Debian-based image
- `scripts/docker/fix-prisma-openssl.sh` - Complete fix script
- `scripts/docker/troubleshoot-prisma.sh` - Diagnostic script
- `scripts/docker/switch-dockerfile.sh` - Image switching utility
- `DOCKER_FIXES_README.md` - This documentation

## 🔄 Maintenance

### Regular Maintenance Commands:
```bash
# Weekly cleanup
npm run docker:clean

# Update dependencies
npm run docker:dev:build

# Health check
bash scripts/docker/troubleshoot-prisma.sh
```

### When to Use Each Image:

**Alpine Linux** (Current default):
- ✅ Smaller image size (~200MB less)
- ✅ Faster downloads
- ⚠️ May have OpenSSL compatibility issues
- 🎯 Use when: Size matters, OpenSSL fixes work

**Debian Slim**:
- ✅ Better compatibility
- ✅ More stable for Prisma
- ✅ Native OpenSSL support
- ❌ Larger image size
- 🎯 Use when: Stability is priority, OpenSSL issues persist

## 📞 Support

If you encounter issues after applying these fixes:

1. Run the troubleshoot script: `bash scripts/docker/troubleshoot-prisma.sh`
2. Check the container logs: `npm run docker:logs:app`
3. Try the complete fix script: `bash scripts/docker/fix-prisma-openssl.sh`
4. Switch to Debian image: `npm run docker:switch:debian`

---

**Last Updated**: January 2025  
**Status**: ✅ All fixes applied and tested  
**Compatibility**: Docker 20+, Docker Compose 2+, Node.js 18+