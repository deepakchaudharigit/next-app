# Docker Troubleshooting Guide for NPCL Dashboard

## Common Issues and Solutions

### 1. Permission Denied Errors (EACCES)

**Problem:** Next.js development server fails with permission errors when trying to create `.next/cache` or `.next/trace` files.

**Error Messages:**
```
Error: EACCES: permission denied, mkdir '/app/.next/cache'
Error: EACCES: permission denied, open '/app/.next/trace'
```

**Solution:**
This issue has been fixed in the latest version. The fix includes:

1. **Dockerfile Updates:** Proper permission setup for `.next` directory
2. **Startup Script:** Automatic permission verification and setup
3. **Environment Configuration:** Correct NODE_ENV setting for development

**Quick Fix Commands:**
```bash
# Stop current containers
docker-compose down

# Rebuild with latest fixes
docker-compose up --build

# Or for development mode specifically
npm run docker:dev
```

### 2. Development vs Production Mode

**Problem:** Container runs in wrong mode (production when you want development).

**Solution:**
- Use `npm run docker:dev` for development mode
- Use `npm run docker:prod` for production mode
- Check `NODE_ENV` in docker-compose.yml

### 3. Database Connection Issues

**Problem:** Application can't connect to PostgreSQL.

**Solution:**
1. Ensure PostgreSQL container is running: `docker-compose ps`
2. Check PostgreSQL logs: `docker-compose logs postgres`
3. Verify DATABASE_URL in environment variables

### 4. Port Conflicts

**Problem:** Port 3000 or 5432 already in use.

**Solution:**
```bash
# Check what's using the ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :5432

# Stop conflicting services or change ports in docker-compose.yml
```

## Docker Commands Reference

### Development Commands
```bash
# Start development environment
npm run docker:dev

# Start with development tools (Adminer, Mailhog)
npm run docker:dev:tools

# View logs
npm run docker:logs
npm run docker:logs:app
npm run docker:logs:db

# Access container shell
npm run docker:shell

# Database operations
npm run docker:db:reset
npm run docker:db:seed
npm run docker:db:studio
```

### Production Commands
```bash
# Start production environment
npm run docker:prod

# Stop all services
npm run docker:down

# Clean up (removes volumes)
npm run docker:down:volumes
```

### Debugging Commands
```bash
# Test permissions inside container
docker-compose exec app bash ./scripts/docker/test-permissions.sh

# Check container status
docker-compose ps

# View container resource usage
docker stats

# Inspect container configuration
docker-compose config
```

## Environment Files

### .env.docker
Used for Docker-specific configuration. Contains:
- Database connection strings with service names
- Production-ready secrets
- Docker-specific paths

### .env (local development)
Used for local development outside Docker.

## File Permissions in Docker

The application runs as user `nextjs` (UID 1001) inside the container. Key directories that need write permissions:

- `.next/` - Next.js build cache and development files
- `uploads/` - File upload storage
- `logs/` - Application logs
- `node_modules/` - Package dependencies

## Troubleshooting Steps

1. **Check Container Status**
   ```bash
   docker-compose ps
   ```

2. **View Application Logs**
   ```bash
   docker-compose logs -f app
   ```

3. **Test Database Connection**
   ```bash
   docker-compose exec app npm run db:test-connection
   ```

4. **Verify Permissions**
   ```bash
   docker-compose exec app bash ./scripts/docker/test-permissions.sh
   ```

5. **Clean Restart**
   ```bash
   docker-compose down -v
   npm run docker:dev
   ```

## Getting Help

If you encounter issues not covered here:

1. Check the application logs: `npm run docker:logs:app`
2. Check the database logs: `npm run docker:logs:db`
3. Verify your environment configuration
4. Try a clean restart with volume cleanup

## Performance Tips

1. **Use .dockerignore** to exclude unnecessary files
2. **Volume Mounts** for development to enable hot reloading
3. **Multi-stage Builds** for optimized production images
4. **Health Checks** to ensure services are ready before starting dependent services