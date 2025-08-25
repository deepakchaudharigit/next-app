# NPCL Dashboard - Docker Deployment Guide

## Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

### Development Setup
```bash
git clone <repository-url>
cd npcl-dashboard
cp .env.docker.example .env.docker
# Edit .env.docker with your configuration
docker-compose up -d
```

### Production Setup
```bash
# Generate secure secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 16)

# Update .env.docker with production values
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Environment Configuration

### Required Variables (.env.docker)
```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:SecurePassword2025!@postgres:5432/npcl-auth-db-dev?schema=public"

# NextAuth Configuration
NEXTAUTH_SECRET="your-super-secret-jwt-key-here-make-it-long-and-random"
NEXTAUTH_URL="http://localhost:3000"

# PostgreSQL Configuration
POSTGRES_DB="npcl-auth-db-dev"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="SecurePassword2025!"
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

# Performance Settings
NODE_OPTIONS="--max-old-space-size=2048"
NEXT_TELEMETRY_DISABLED="1"
```

## Docker Services

### Core Services

#### 1. Application (app)
- **Image:** Custom Next.js application
- **Port:** 3000
- **Health Check:** `/api/health`
- **Volumes:** uploads, logs
- **Dependencies:** postgres, redis

#### 2. PostgreSQL (postgres)
- **Image:** postgres:15-alpine
- **Port:** 5432 (prod), 5433 (dev)
- **Volume:** postgres_data
- **Health Check:** `pg_isready`

#### 3. Redis (redis)
- **Image:** redis:7-alpine
- **Port:** 6379
- **Volume:** redis_data
- **Purpose:** Session storage, caching

### Development Tools (Optional)

#### 4. Adminer (database management)
- **Port:** 8080
- **Profile:** `dev-tools`
- **Access:** http://localhost:8080

#### 5. Mailhog (email testing)
- **SMTP Port:** 1025
- **Web UI:** 8025
- **Profile:** `dev-tools`
- **Access:** http://localhost:8025

#### 6. Nginx (reverse proxy - production only)
- **Ports:** 80, 443
- **Profile:** `production`
- **SSL/TLS termination**

## Docker Commands

### Development Commands
```bash
# Start development environment
docker-compose up -d

# Start with development tools
docker-compose --profile dev-tools up -d

# View logs
docker-compose logs -f
docker-compose logs -f app
docker-compose logs -f postgres

# Access container shell
docker-compose exec app bash
docker-compose exec postgres psql -U postgres -d npcl-auth-db-dev

# Stop services
docker-compose down
```

### Production Commands
```bash
# Build production image
docker-compose build --no-cache

# Start production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale application
docker-compose up -d --scale app=3

# Update application
docker-compose pull app
docker-compose up -d app
```

### Database Commands
```bash
# Reset database (destructive)
docker-compose down -v
docker-compose up -d postgres
docker-compose exec app npx prisma db push

# Backup database
docker-compose exec postgres pg_dump -U postgres npcl-auth-db-dev > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres npcl-auth-db-dev < backup.sql

# Run Prisma Studio
docker-compose exec app npx prisma studio --hostname 0.0.0.0 --port 5555
```

### Maintenance Commands
```bash
# Update all images
docker-compose pull

# Clean up unused resources
docker system prune -a

# View resource usage
docker stats

# Restart specific service
docker-compose restart app
```

## Deployment Strategies

### Development Deployment
```bash
# Hot reloading enabled
# Source code mounted as volume
# Development tools included
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Staging Deployment
```bash
# Production build with development database
# SSL disabled
# Debug logging enabled
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
```

### Production Deployment
```bash
# Optimized production build
# SSL/TLS enabled
# Resource limits applied
# Health checks enabled
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Security Configuration

### Container Security
```yaml
# Run as non-root user
user: "1001:1001"

# Read-only root filesystem
read_only: true

# Drop capabilities
cap_drop:
  - ALL

# Resource limits
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

### Network Security
```yaml
# Internal network for services
networks:
  npcl-network:
    driver: bridge
    internal: true  # No external access

# Expose only necessary ports
ports:
  - "3000:3000"  # Application
  - "5432:5432"  # Database (development only)
```

### Environment Security
- Never commit `.env.docker` to version control
- Use strong, unique secrets
- Rotate secrets regularly
- Use Docker secrets in production

## Monitoring and Logging

### Health Checks
All services include comprehensive health checks:
```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -fsS http://localhost:3000/api/health || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

### Log Management
```bash
# View real-time logs
docker-compose logs -f

# Log rotation (production)
docker-compose logs --tail=100 app > app.log

# Centralized logging (optional)
# Configure log drivers for external systems
```

### Performance Monitoring
```bash
# Resource usage
docker stats

# Container inspection
docker inspect <container-name>

# Network inspection
docker network ls
docker network inspect npcl_npcl-network
```

## Backup and Recovery

### Database Backup
```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres npcl-auth-db-dev | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Automated backup script
#!/bin/bash
BACKUP_DIR="/var/backups/npcl"
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec postgres pg_dump -U postgres npcl-auth-db-dev | gzip > $BACKUP_DIR/npcl_backup_$DATE.sql.gz
find $BACKUP_DIR -name "npcl_backup_*.sql.gz" -mtime +30 -delete
```

### Volume Backup
```bash
# Backup volumes
docker run --rm -v npcl_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data

# Restore volumes
docker run --rm -v npcl_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /
```

### Application Backup
```bash
# Backup application data
docker-compose exec app tar czf /tmp/app-backup.tar.gz /app/uploads /app/logs
docker cp $(docker-compose ps -q app):/tmp/app-backup.tar.gz ./app-backup.tar.gz
```

## Performance Optimization

### Resource Limits
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'
```

### Connection Pooling
```bash
# Environment variables
PRISMA_CONNECTION_LIMIT=10
DATABASE_CONNECTION_POOL_SIZE=20
```

### Caching Strategy
```bash
# Redis configuration
REDIS_URL="redis://redis:6379"
NEXT_CACHE_HANDLER="redis"

# Application caching
NEXT_TELEMETRY_DISABLED=1
```

## Troubleshooting

### Common Issues

#### 1. Container Won't Start
```bash
# Check logs
docker-compose logs app

# Check resource usage
docker stats

# Verify configuration
docker-compose config
```

#### 2. Database Connection Failed
```bash
# Check PostgreSQL status
docker-compose ps postgres

# Test connection
docker-compose exec app npx prisma db pull

# Check network connectivity
docker-compose exec app ping postgres
```

#### 3. Port Conflicts
```bash
# Check port usage
netstat -tulpn | grep :3000

# Use different ports
# Edit docker-compose.yml ports section
```

#### 4. Permission Errors
```bash
# Fix file permissions
chmod +x scripts/docker/*.sh

# Check volume permissions
docker-compose exec app ls -la /app
```

#### 5. Memory Issues
```bash
# Increase Docker memory allocation
# Check Docker Desktop settings

# Monitor memory usage
docker stats

# Add memory limits
# Update docker-compose.yml with resource limits
```

### Debug Commands
```bash
# Container inspection
docker inspect <container-name>

# Network debugging
docker network inspect npcl_npcl-network

# Volume inspection
docker volume inspect npcl_postgres_data

# Process monitoring
docker-compose exec app ps aux

# File system check
docker-compose exec app df -h
```

## Production Checklist

### Pre-deployment
- [ ] Update all environment variables
- [ ] Generate secure secrets
- [ ] Configure SSL certificates
- [ ] Set up backup strategy
- [ ] Configure monitoring
- [ ] Test database migrations
- [ ] Verify resource limits

### Post-deployment
- [ ] Verify all services are healthy
- [ ] Test application functionality
- [ ] Check log outputs
- [ ] Verify backup procedures
- [ ] Monitor resource usage
- [ ] Test disaster recovery

### Maintenance
- [ ] Regular security updates
- [ ] Database maintenance
- [ ] Log rotation
- [ ] Backup verification
- [ ] Performance monitoring
- [ ] Capacity planning

## Support and Resources

### Documentation
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Redis Docker Image](https://hub.docker.com/_/redis)

### Monitoring Tools
- Docker Desktop (development)
- Portainer (container management)
- Grafana + Prometheus (metrics)
- ELK Stack (logging)

### Getting Help
1. Check container logs: `docker-compose logs`
2. Verify configuration: `docker-compose config`
3. Test connectivity: `docker-compose exec app ping postgres`
4. Review this documentation
5. Create an issue in the project repository