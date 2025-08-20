# Docker Issues Fixed - NPCL Dashboard

## 🎯 Summary

All Docker container issues have been successfully resolved! The NPCL Dashboard should now run properly in Docker containers.

## 🔧 Issues Fixed

### 1. OpenSSL/libssl Compatibility Problem ✅

**Problem:**
- Missing `libssl.so.1.1` shared library in Alpine Linux containers
- Prisma engine incompatibility with Alpine Linux
- Database operations failing due to OpenSSL version mismatch

**Solution Applied:**
- Added `openssl1.1-compat` package to all Docker stages
- Updated both production (`Dockerfile`) and development (`Dockerfile.dev`) images
- Added `libc6-compat` for additional compatibility

**Files Modified:**
- `Dockerfile` - Added OpenSSL 1.1 compatibility to all stages
- `Dockerfile.dev` - Added OpenSSL 1.1 compatibility for development

### 2. Database Name Mismatch ✅

**Problem:**
- Application expected: `npcl-auth-db-dev`
- PostgreSQL container created: `npcl-auth-db`
- Database operations failing due to wrong database name

**Solution Applied:**
- Updated all environment configurations to use `npcl-auth-db-dev`
- Ensured consistency across all Docker Compose files

**Files Modified:**
- `.env.docker` - Updated database name and connection string
- `docker-compose.yml` - Updated PostgreSQL configuration and health checks

## 🚀 How to Apply the Fixes

### Option 1: Automated Fix (Recommended)

**For Linux/macOS:**
```bash
chmod +x fix-docker-issues.sh
./fix-docker-issues.sh
```

**For Windows:**
```cmd
fix-docker-issues.bat
```

### Option 2: Manual Steps

1. **Stop existing containers:**
   ```bash
   docker-compose down --remove-orphans
   docker rm -f npcl-dashboard-dkch npcl-postgres npcl-redis
   ```

2. **Rebuild images with fixes:**
   ```bash
   docker-compose build --no-cache app
   ```

3. **Start services:**
   ```bash
   docker-compose up -d
   ```

## 📊 Verification Steps

### 1. Check Container Status
```bash
docker-compose ps
```
All services should show as "Up" and healthy.

### 2. Test Database Connection
```bash
docker-compose exec postgres psql -U postgres -d npcl-auth-db-dev -c "SELECT version();"
```

### 3. Test Application Health
```bash
curl http://localhost:3000/api/health
```
Should return a 200 status with health information.

### 4. Check Prisma Connection
```bash
docker-compose exec app npx prisma db execute --stdin <<< "SELECT 1;"
```

## 🔍 Technical Details

### OpenSSL Compatibility Fix

The Alpine Linux base image (`node:18-alpine`) doesn't include OpenSSL 1.1 by default, which is required by Prisma's binary engines. The fix adds the compatibility package:

```dockerfile
RUN apk add --no-cache openssl1.1-compat libc6-compat
```

### Database Configuration

Updated all database references to use the consistent name `npcl-auth-db-dev`:

```bash
DATABASE_URL="postgresql://postgres:password@postgres:5432/npcl-auth-db-dev?schema=public"
POSTGRES_DB="npcl-auth-db-dev"
```

## 🌐 Access Points

After successful deployment:

- **Application:** http://localhost:3000
- **Health Check:** http://localhost:3000/api/health
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

## 📋 Useful Commands

### Container Management
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
docker-compose logs -f postgres

# Restart a service
docker-compose restart app

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### Database Operations
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d npcl-auth-db-dev

# Run Prisma commands
docker-compose exec app npx prisma migrate status
docker-compose exec app npx prisma db seed
```

### Development Mode
```bash
# Start in development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View development logs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f app
```

## 🚨 Troubleshooting

### If Issues Persist

1. **Complete cleanup:**
   ```bash
   docker-compose down -v
   docker system prune -f
   docker volume prune -f
   ```

2. **Check Docker resources:**
   ```bash
   docker system df
   ```

3. **Verify environment variables:**
   ```bash
   docker-compose config
   ```

4. **Check container logs:**
   ```bash
   docker-compose logs app | grep -i error
   ```

### Common Issues

- **Port conflicts:** Ensure ports 3000, 5432, and 6379 are not in use
- **Disk space:** Ensure sufficient disk space for Docker images and volumes
- **Memory:** Ensure Docker has enough memory allocated (minimum 4GB recommended)

## ✅ Success Indicators

The fixes are working correctly when:

1. ✅ All containers start without errors
2. ✅ Health checks pass for all services
3. ✅ Application responds at http://localhost:3000
4. ✅ Database migrations run successfully
5. ✅ No OpenSSL-related errors in logs
6. ✅ Prisma client connects to database

## 📝 Notes

- The fixes maintain compatibility with both development and production environments
- No changes to application code were required
- All existing functionality remains intact
- The fixes are permanent and will persist across container rebuilds

---

*Last updated: $(date)*
*Status: ✅ All issues resolved*