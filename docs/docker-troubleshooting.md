# Docker Troubleshooting Guide

## File Permission Errors

### Problem: EACCES permission denied errors
```
Error: EACCES: permission denied, mkdir '/app/.next/cache'
Error: EACCES: permission denied, open '/app/.next/trace'
```

### Root Cause
This occurs when the Docker container's non-root user doesn't have write permissions to the `.next` directory, typically caused by:
1. Incorrect ownership of copied files in the Docker image
2. Host machine `.next` directory interfering with container permissions
3. Missing required directories that Next.js needs to create at runtime

### Solution
1. **Clean build artifacts on host:**
   ```bash
   rm -rf .next .swc
   ```

2. **Use the clean build script:**
   ```bash
   ./scripts/docker/clean-build.sh
   ```

3. **Manual rebuild (if needed):**
   ```bash
   docker-compose down --remove-orphans
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Prevention
- The Dockerfile has been updated to properly handle permissions
- The `.dockerignore` file excludes build artifacts
- Always use the clean build script when encountering permission issues

## Other Common Issues

### Container won't start
1. Check if ports are already in use:
   ```bash
   docker-compose ps
   netstat -tulpn | grep :3000
   ```

2. Check container logs:
   ```bash
   docker-compose logs app
   ```

### Database connection issues
1. Ensure PostgreSQL container is healthy:
   ```bash
   docker-compose ps postgres
   ```

2. Check database logs:
   ```bash
   docker-compose logs postgres
   ```

### Environment variables
1. Ensure `.env.docker` file exists and is properly configured
2. Check that all required environment variables are set

## Useful Commands

```bash
# View all container logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app

# Restart specific service
docker-compose restart app

# Execute commands in running container
docker-compose exec app bash

# Check container resource usage
docker stats

# Clean up everything (nuclear option)
docker system prune -a --volumes
```