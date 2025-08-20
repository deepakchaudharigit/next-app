# Docker Issues Fixed

## Issues Resolved

### 1. Database Connection Issue
**Problem**: `npcl-postgres | FATAL: database npcl-auth-db does not exist`

**Root Cause**: PostgreSQL container was not properly initializing the database.

**Fixes Applied**:
- Created proper database initialization scripts in `scripts/db/`
- Added `01-init.sql` for basic database setup with extensions
- Added `02-create-database.sql` for database verification
- Updated `.env.docker` with proper PostgreSQL configuration

### 2. Prisma Client Edge Runtime Issue
**Problem**: `Error [TypeError]: Native module not found: @prisma/client` in middleware

**Root Cause**: Next.js middleware runs in Edge Runtime which doesn't support native modules like Prisma Client.

**Fixes Applied**:
- Created `types/auth.ts` with UserRole enum that doesn't depend on Prisma
- Updated `middleware.ts` to import from `types/auth` instead of `@prisma/client`
- This allows middleware to run in Edge Runtime without Prisma dependencies

### 3. Docker Build Issues
**Problem**: Various build and startup issues in Docker container

**Fixes Applied**:
- Fixed Dockerfile to properly install all dependencies in builder stage
- Updated startup script reference from `startup-dev.sh` to `startup.sh`
- Added package-lock.json to final image for npm scripts
- Improved startup script error handling and database checks

## Files Modified

1. **scripts/db/01-init.sql** - New database initialization script
2. **scripts/db/02-create-database.sql** - New database verification script
3. **types/auth.ts** - New types file for Edge Runtime compatibility
4. **middleware.ts** - Updated to use new types instead of Prisma
5. **Dockerfile** - Fixed build process and startup script
6. **scripts/docker/startup.sh** - Improved database checking logic
7. **.env.docker** - Added proper PostgreSQL configuration

## How to Test the Fixes

1. **Stop existing containers**:
   ```bash
   docker-compose down -v
   ```

2. **Rebuild and start**:
   ```bash
   docker-compose up --build
   ```

3. **Check logs**:
   ```bash
   docker-compose logs -f postgres
   docker-compose logs -f app
   ```

4. **Verify database**:
   ```bash
   docker-compose exec postgres psql -U postgres -d npcl-auth-db -c "SELECT health_check();"
   ```

5. **Test application**:
   - Visit http://localhost:3000
   - Check health endpoint: http://localhost:3000/api/health

## Expected Behavior

- PostgreSQL container should start successfully and create the database
- Application container should connect to database and run migrations
- Middleware should work without Prisma import errors
- Application should be accessible on http://localhost:3000

## Troubleshooting

If issues persist:

1. **Check PostgreSQL logs**: `docker-compose logs postgres`
2. **Check application logs**: `docker-compose logs app`
3. **Verify environment variables**: Check `.env.docker` file
4. **Clean rebuild**: `docker-compose down -v && docker-compose build --no-cache && docker-compose up`