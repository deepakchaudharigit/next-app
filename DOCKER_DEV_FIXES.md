# Docker Development Environment Fixes

## Issues Fixed

### 1. Script Permission Issues
- **Problem**: Startup scripts didn't have execute permissions
- **Fix**: Added `chmod +x` commands in Dockerfile and startup command

### 2. NPM Deprecation Warnings
- **Problem**: Many deprecated packages causing build warnings
- **Fixes Applied**:
  - Updated `eslint` from 8.57.1 to 9.15.0
  - Updated `supertest` from 6.3.3 to 7.1.3
  - Added npm config flags to reduce warnings: `--silent --no-audit --no-fund`

### 3. Docker Build Optimization
- **Problem**: Slow builds and excessive output
- **Fixes Applied**:
  - Added npm optimization flags in Dockerfile
  - Added environment variables to suppress npm warnings
  - Improved Docker layer caching

## Quick Fix Commands

### For Windows Users:
```cmd
fix-docker-dev.bat
```

### For Linux/Mac Users:
```bash
chmod +x fix-docker-dev.sh
./fix-docker-dev.sh
```

### Manual Fix Steps:

1. **Stop existing containers:**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
   ```

2. **Fix script permissions:**
   ```bash
   find scripts -name "*.sh" -type f -exec chmod +x {} \;
   ```

3. **Clean Docker cache:**
   ```bash
   docker system prune -f
   ```

4. **Remove package-lock.json for fresh install:**
   ```bash
   rm package-lock.json
   ```

5. **Start development environment:**
   ```bash
   npm run docker:dev
   ```

## Alternative Startup Methods

If the startup script still fails, you can use these alternatives:

### Method 1: Direct npm command
Edit `docker-compose.dev.yml` and change the command to:
```yaml
command: ["npm", "run", "dev"]
```

### Method 2: Simple bash startup
```yaml
command: ["/bin/bash", "-c", "npx prisma generate && npx prisma db push && npm run dev"]
```

## Verification Steps

1. **Check if containers are running:**
   ```bash
   docker-compose ps
   ```

2. **Check application health:**
   ```bash
   curl http://localhost:3000/api/health
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f app
   ```

## Common Issues and Solutions

### Issue: "Permission denied" errors
**Solution**: Run the fix script or manually set permissions:
```bash
chmod +x scripts/docker/*.sh
```

### Issue: Build hangs on npm install
**Solution**: 
1. Stop containers: `docker-compose down`
2. Clean Docker: `docker system prune -f`
3. Remove package-lock.json: `rm package-lock.json`
4. Restart: `npm run docker:dev`

### Issue: Database connection errors
**Solution**: Wait for PostgreSQL to fully start (can take 30-60 seconds on first run)

### Issue: Port conflicts
**Solution**: 
1. Stop other services using ports 3000, 5432, 6379
2. Or change ports in docker-compose files

## Environment Variables

The following environment variables are now optimized:
- `NPM_CONFIG_AUDIT=false` - Reduces audit warnings
- `NPM_CONFIG_FUND=false` - Reduces funding messages
- `NPM_CONFIG_LOGLEVEL=warn` - Reduces verbose output
- `NEXT_TELEMETRY_DISABLED=1` - Disables Next.js telemetry

## Success Indicators

When everything is working correctly, you should see:
1. ✅ PostgreSQL container healthy
2. ✅ Redis container healthy  
3. ✅ App container healthy
4. 🌐 Application accessible at http://localhost:3000
5. 🔍 Health check returns 200 at http://localhost:3000/api/health

## Additional Tools

Enable development tools with:
```bash
npm run docker:dev:tools
```

This provides:
- **Adminer** (Database UI): http://localhost:8080
- **MailHog** (Email testing): http://localhost:8025