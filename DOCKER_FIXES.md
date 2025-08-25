# Docker Issues Fixed 🐳

This document outlines the fixes applied to resolve PostgreSQL authentication and memory issues in the NPCL Dashboard Docker setup.

## Issues Resolved

### 1. PostgreSQL Authentication Error ❌ → ✅
**Problem**: `P1000: Authentication failed for user 'postgres'`

**Root Cause**: Password encoding mismatch between DATABASE_URL and PostgreSQL service configuration.

**Fix Applied**:
- Updated `.env.docker` to use unencoded password in DATABASE_URL
- Changed from: `SecurePassword2025%21` (URL encoded)
- Changed to: `SecurePassword2025!` (raw password)

### 2. Memory Issues (ENOMEM) ❌ → ✅
**Problem**: `Error: ENOMEM: not enough memory, scandir '/app/app'`

**Root Cause**: Insufficient memory allocation and suboptimal Node.js memory settings.

**Fixes Applied**:
- Increased Docker container memory limit from 3G to 4G
- Added CPU limits (2.0 cores max, 1.0 reserved)
- Optimized Node.js memory settings:
  - `--max-old-space-size=3072` (3GB heap)
  - `--max-semi-space-size=256` (256MB semi-space)
  - `--optimize-for-size` (memory optimization)
- Added `UV_THREADPOOL_SIZE=4` for better I/O performance

## Files Modified

### Configuration Files
- `.env.docker` - Fixed DATABASE_URL password encoding
- `docker-compose.yml` - Updated memory limits and Node.js settings
- `docker-compose.dev.yml` - Updated memory limits and Node.js settings
- `Dockerfile.dev` - Optimized environment variables

### Scripts Added/Updated
- `scripts/docker/startup-memory-optimized.sh` - Updated memory settings
- `scripts/docker/validate-fixes.sh` - New validation script
- `fix-docker-issues.sh` - New quick fix script
- `package.json` - Added new npm scripts

## Memory Recommendations

### For Development (Medium-sized Next.js/Prisma monorepo)

| Resource | Recommended | Minimum |
|----------|-------------|---------|
| Docker Desktop Memory | 6GB+ | 4GB |
| Container Memory Limit | 4GB | 3GB |
| Node.js Heap Size | 3GB | 2GB |
| CPU Cores | 2+ | 1 |

### Docker Desktop Settings
1. Open Docker Desktop → Settings → Resources
2. Set Memory to at least 6GB (8GB recommended)
3. Set CPUs to at least 2 cores
4. Apply & Restart Docker Desktop

## Usage

### Quick Fix (Recommended)
```bash
# Apply all fixes and start services
npm run docker:fix
```

### Manual Steps
```bash
# 1. Validate configuration
npm run docker:validate

# 2. Start development environment
npm run docker:dev

# 3. Check logs if needed
npm run docker:logs:app
```

### Troubleshooting Commands
```bash
# Stop all services and clean up
npm run docker:clean

# Restart just the app container
npm run docker:restart:app

# View app logs
npm run docker:logs:app

# Access app container shell
npm run docker:shell

# Access database
npm run docker:shell:db
```

## Verification

After applying fixes, verify the setup:

1. **Database Connection**: Check that Prisma can connect without authentication errors
2. **Memory Usage**: Monitor container memory usage (should stay under 4GB)
3. **Application Start**: Verify Next.js dev server starts without ENOMEM errors
4. **Health Check**: Confirm `/api/health` endpoint responds successfully

### Expected Startup Sequence
```
✅ PostgreSQL is ready!
🔧 Generating Prisma client...
✅ Database connection successful!
📊 Pushing database schema...
🎯 Starting Next.js development server...
📱 App will be available at: http://localhost:3000
```

## Performance Optimizations Applied

1. **Memory Management**:
   - Optimized Node.js heap allocation
   - Reduced semi-space size for faster GC
   - Enabled size optimization flags

2. **File Watching**:
   - Disabled polling where possible
   - Optimized file change detection intervals
   - Reduced memory overhead from file watchers

3. **Container Resources**:
   - Set appropriate memory and CPU limits
   - Reserved minimum resources for stability
   - Optimized thread pool size for I/O operations

## Monitoring

Monitor your application with these commands:

```bash
# Container resource usage
docker stats npcl-dashboard-dkch

# Application logs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f app

# Database logs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f postgres
```

## Support

If you encounter issues after applying these fixes:

1. Run the validation script: `npm run docker:validate`
2. Check Docker Desktop has sufficient memory allocated (6GB+)
3. Ensure no other memory-intensive applications are running
4. Try the clean restart: `npm run docker:clean && npm run docker:dev`

---

**Last Updated**: January 2025  
**Tested With**: Docker Desktop 4.x, Node.js 18+, Next.js 15.4.0, Prisma 6.14.0