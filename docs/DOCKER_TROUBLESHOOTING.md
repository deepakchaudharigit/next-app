# Docker Development Environment Troubleshooting

## Issue Fixed: Startup Script Not Found

The issue where the container was failing with "No such file or directory" for `./startup-dev.sh` has been resolved.

### What was the problem?
The Dockerfile was trying to copy the startup script from `./scripts/docker/startup-dev-simple.sh` to `./startup-dev.sh`, but this copy operation was failing silently, causing the container to exit with code 127.

### What was changed?
1. **Dockerfile.dev**: Modified to execute the script directly from its original location instead of copying it
2. **docker-compose.dev.yml**: Updated the command to use the correct script path

### How to restart the development environment

1. **Stop current containers** (if running):
   ```bash
   npm run docker:stop
   # or manually:
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
   ```

2. **Start development environment**:
   ```bash
   npm run docker:dev
   ```

3. **If you need to rebuild completely**:
   ```bash
   # Stop containers
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
   
   # Clean up
   docker container prune -f
   docker image prune -f
   
   # Rebuild and start
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
   ```

### Helper Scripts Created

I've created two helper scripts for easier management:

1. **restart-docker-dev.sh**: Stops, cleans up, and rebuilds the development environment
2. **stop-docker-dev.sh**: Simply stops the development containers

To use them:
```bash
# Make executable (Linux/Mac)
chmod +x restart-docker-dev.sh stop-docker-dev.sh

# Restart development environment
./restart-docker-dev.sh

# Stop development environment
./stop-docker-dev.sh
```

### Expected Behavior After Fix

When you run `npm run docker:dev`, you should see:
1. PostgreSQL and Redis starting successfully
2. The app container building without errors
3. The startup script executing and showing:
   - Environment debug information
   - PostgreSQL connection waiting
   - Database setup (Prisma generate, schema push, seeding)
   - Development server starting on port 3000

### Verification

Once the containers are running, you can verify:
1. **Application**: http://localhost:3000
2. **Health check**: http://localhost:3000/api/health
3. **Database admin** (if dev-tools profile enabled): http://localhost:8080

### If Issues Persist

If you still encounter issues:
1. Check the logs: `docker-compose logs app`
2. Verify environment variables: `docker-compose config`
3. Check if ports are available: `netstat -tulpn | grep :3000`
4. Ensure Docker has enough resources allocated