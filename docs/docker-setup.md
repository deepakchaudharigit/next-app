# Docker Setup Guide

This guide provides comprehensive instructions for setting up and running the NPCL Dashboard using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd NPCL
chmod +x scripts/docker/*.sh
```

### 2. Environment Configuration

```bash
# Copy Docker environment template
cp .env.docker.example .env.docker

# Edit with your configuration
nano .env.docker
```

### 3. Start Development Environment

```bash
# Automated setup
./scripts/docker/setup.sh dev

# Or manual setup
npm run docker:dev
```

### 4. Start Production Environment

```bash
# Automated setup
./scripts/docker/setup.sh prod

# Or manual setup
npm run docker:prod
```

## Environment Configuration

### Required Variables

Update `.env.docker` with these essential variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:password@postgres:5432/npcl-auth-db?schema=public"

# NextAuth Configuration
NEXTAUTH_SECRET="your-super-secret-jwt-key-here-make-it-long-and-random"
NEXTAUTH_URL="http://localhost:3000"

# PostgreSQL Configuration
POSTGRES_DB="npcl-auth-db"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="password"
```

### Optional Variables

```bash
# Email Configuration
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Security Settings
BCRYPT_SALT_ROUNDS="12"
PRISMA_CONNECTION_LIMIT="10"
```

## Docker Services

### Core Services

1. **app** - Next.js application
   - Port: 3000
   - Health check: `/api/health`
   - Volumes: uploads, logs

2. **postgres** - PostgreSQL database
   - Port: 5432 (prod), 5433 (dev)
   - Volume: persistent data storage
   - Health check: `pg_isready`

3. **redis** - Redis cache
   - Port: 6379
   - Volume: persistent data storage

### Development Tools (Optional)

4. **adminer** - Database management
   - Port: 8080
   - Profile: `dev-tools`

5. **mailhog** - Email testing
   - SMTP Port: 1025
   - Web UI: 8025
   - Profile: `dev-tools`

6. **nginx** - Reverse proxy (production only)
   - Ports: 80, 443
   - Profile: `production`

## Available Commands

### Development Commands

```bash
# Start development environment
npm run docker:dev

# Start with development tools (Adminer, Mailhog)
npm run docker:dev:tools

# Start in detached mode
npm run docker:dev:detached

# Stop development environment
npm run docker:down:dev
```

### Production Commands

```bash
# Start production environment
npm run docker:prod

# Build production image
npm run docker:build

# Stop production environment
npm run docker:down
```

### Database Commands

```bash
# Reset database (destructive)
npm run docker:db:reset

# Seed database with test data
npm run docker:db:seed

# Open Prisma Studio
npm run docker:db:studio

# Access database shell
npm run docker:shell:db
```

### Monitoring Commands

```bash
# View all logs
npm run docker:logs

# View application logs
npm run docker:logs:app

# View database logs
npm run docker:logs:db

# Access application shell
npm run docker:shell

# Restart services
npm run docker:restart
npm run docker:restart:app
```

### Cleanup Commands

```bash
# Stop containers
npm run docker:down

# Stop and remove volumes (destructive)
npm run docker:down:volumes

# Clean Docker system
docker system prune -a
```

## Development Workflow

### 1. Initial Setup

```bash
# Setup development environment
./scripts/docker/setup.sh dev

# Verify services are running
docker-compose ps
```

### 2. Code Development

```bash
# Start development with hot reloading
npm run docker:dev

# Access application at http://localhost:3000
# Code changes will automatically reload
```

### 3. Database Operations

```bash
# View database in Adminer
npm run docker:dev:tools
# Open http://localhost:8080

# Or use Prisma Studio
npm run docker:db:studio
```

### 4. Testing Email

```bash
# Start Mailhog for email testing
npm run docker:dev:tools
# Open http://localhost:8025
```

## Production Deployment

### 1. Environment Setup

```bash
# Create production environment file
cp .env.docker.example .env.docker

# Update with production values
nano .env.docker
```

### 2. Security Configuration

```bash
# Generate secure secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 16)

# Update .env.docker with generated values
```

### 3. SSL/TLS Setup (Optional)

```bash
# Create SSL certificates directory
mkdir -p nginx/ssl

# Add your SSL certificates
cp your-cert.pem nginx/ssl/
cp your-key.pem nginx/ssl/

# Update nginx configuration
```

### 4. Start Production

```bash
# Start production environment
npm run docker:prod

# Verify all services are healthy
docker-compose ps
```

## Monitoring and Maintenance

### Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# View health check logs
docker inspect <container-name> | grep Health -A 10
```

### Log Management

```bash
# View real-time logs
npm run docker:logs

# View specific service logs
docker-compose logs -f app
docker-compose logs -f postgres

# Log rotation (production)
docker-compose logs --tail=100 app > app.log
```

### Backup and Restore

```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres npcl-auth-db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres npcl-auth-db < backup.sql

# Backup volumes
docker run --rm -v npcl_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

## Performance Optimization

### 1. Resource Limits

Add to `docker-compose.yml`:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

### 2. Connection Pooling

Update `.env.docker`:

```bash
PRISMA_CONNECTION_LIMIT=10
DATABASE_CONNECTION_POOL_SIZE=20
```

### 3. Caching

```bash
# Use Redis for session storage
REDIS_URL="redis://redis:6379"

# Enable Next.js caching
NEXT_CACHE_HANDLER="redis"
```

## Troubleshooting

For detailed troubleshooting information, see [Docker Troubleshooting Guide](./docker-troubleshooting.md).

### Common Issues

1. **Database connection failed**
   - Check if PostgreSQL container is running
   - Verify DATABASE_URL uses `postgres` hostname

2. **Port conflicts**
   - Use development ports (5433 for PostgreSQL)
   - Check for running local services

3. **Permission errors**
   - Run `chmod +x scripts/docker/*.sh`
   - Check file ownership in mounted volumes

4. **Build failures**
   - Clear Docker cache: `docker system prune -a`
   - Rebuild without cache: `docker-compose build --no-cache`

## Security Considerations

### 1. Environment Variables

- Never commit `.env.docker` to version control
- Use strong, unique secrets
- Rotate secrets regularly

### 2. Network Security

```yaml
# Restrict external access
networks:
  npcl-network:
    driver: bridge
    internal: true  # For internal services
```

### 3. Container Security

```yaml
# Run as non-root user
user: "1001:1001"

# Read-only root filesystem
read_only: true

# Drop capabilities
cap_drop:
  - ALL
```

## Support

For additional help:

1. Check the [troubleshooting guide](./docker-troubleshooting.md)
2. Review container logs: `npm run docker:logs`
3. Verify environment configuration
4. Create an issue in the project repository