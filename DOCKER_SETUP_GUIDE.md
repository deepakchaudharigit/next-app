# 🐳 NPCL Dashboard Docker Setup Guide

## 📋 Overview

Your NPCL Dashboard project is already configured for Docker! This guide will help you get it running in containers.

## 🏗️ Architecture

Your Docker setup includes:
- **Next.js App** (main application)
- **PostgreSQL** (database)
- **Redis** (session storage/caching)
- **Nginx** (reverse proxy - optional for production)

## 🚀 Quick Start

### 1. Prerequisites

Make sure you have installed:
- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)

### 2. Environment Setup

Copy the Docker environment file:
```bash
cp .env.docker.example .env.docker
```

Edit `.env.docker` with your configuration:
```bash
# Required: Update these values
NEXTAUTH_SECRET="your-super-secret-jwt-key-here-make-it-long-and-random"
POSTGRES_PASSWORD="your-secure-password"

# Optional: Update email settings for password reset
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
```

### 3. Build and Run

#### Development Mode
```bash
# Start all services
npm run docker:dev

# Or manually:
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

#### Production Mode
```bash
# Start production services
npm run docker:prod

# Or manually:
docker-compose up -d --build
```

## 📁 Docker Files Structure

```
├── Dockerfile                 # Multi-stage production build
├── docker-compose.yml         # Main services configuration
├── docker-compose.dev.yml     # Development overrides
├── .dockerignore              # Files to exclude from build
├── .env.docker               # Docker environment variables
├── .env.docker.example       # Environment template
└── scripts/docker/
    └── startup.sh            # Container startup script
```

## 🔧 Available Commands

### Docker Management
```bash
# Development
npm run docker:dev              # Start dev environment
npm run docker:dev:detached     # Start in background
npm run docker:down:dev         # Stop dev environment

# Production
npm run docker:prod             # Start production
npm run docker:down             # Stop all services
npm run docker:restart          # Restart services

# Database
npm run docker:db:reset         # Reset database
npm run docker:db:seed          # Seed database
npm run docker:db:studio        # Open Prisma Studio

# Utilities
npm run docker:logs             # View all logs
npm run docker:logs:app         # View app logs only
npm run docker:logs:db          # View database logs
npm run docker:shell            # Access app container shell
npm run docker:clean            # Clean up containers and volumes
```

## 🌐 Service URLs

Once running, access your services at:
- **Application**: http://localhost:3000
- **Database**: localhost:5432
- **Redis**: localhost:6379
- **Health Check**: http://localhost:3000/api/health

## 🔍 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check if PostgreSQL is running
docker-compose ps

# View database logs
docker-compose logs postgres

# Test database connection
docker-compose exec app npm run db:test-connection
```

#### 2. Prisma Issues
```bash
# Regenerate Prisma client
docker-compose exec app npx prisma generate

# Reset database schema
docker-compose exec app npx prisma db push --force-reset

# Check database status
docker-compose exec app npx prisma db status
```

#### 3. Build Failures
```bash
# Clean build (removes cache)
docker-compose build --no-cache

# Check build logs
docker-compose build app
```

#### 4. Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Restart with clean state
npm run docker:clean
npm run docker:dev
```

### Debug Commands

```bash
# View container status
docker-compose ps

# Check container logs
docker-compose logs -f app
docker-compose logs -f postgres

# Access container shell
docker-compose exec app bash
docker-compose exec postgres psql -U postgres -d npcl-auth-db-dev

# Monitor resource usage
docker stats

# Inspect container details
docker inspect npcl-dashboard-dkch
```

## 🔒 Security Considerations

### Environment Variables
- Never commit `.env.docker` to version control
- Use strong passwords for database and JWT secrets
- Update default credentials before production deployment

### Network Security
- Services communicate through internal Docker network
- Only necessary ports are exposed to host
- Database is not directly accessible from outside

### Production Deployment
- Use HTTPS in production (configure Nginx SSL)
- Set strong database passwords
- Enable firewall rules
- Regular security updates

## 📊 Monitoring

### Health Checks
All services include health checks:
- **App**: HTTP health endpoint
- **Database**: PostgreSQL connection test
- **Redis**: Redis ping command

### Logs
```bash
# Application logs
docker-compose logs -f app

# Database logs
docker-compose logs -f postgres

# All services
docker-compose logs -f
```

## 🚀 Production Deployment

### 1. Environment Setup
```bash
# Copy production environment
cp .env.docker.example .env.production

# Update production values
nano .env.production
```

### 2. SSL Configuration (Optional)
```bash
# Generate SSL certificates
mkdir -p nginx/ssl
# Add your SSL certificates to nginx/ssl/

# Start with Nginx
docker-compose --profile production up -d
```

### 3. Database Backup
```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres npcl-auth-db-dev > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres npcl-auth-db-dev < backup.sql
```

## 🔄 Updates and Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up --build -d
```

### Database Migrations
```bash
# Run migrations
docker-compose exec app npx prisma migrate deploy

# Or reset and reseed (development only)
docker-compose exec app npm run db:reset
```

## 📈 Performance Optimization

### Resource Limits
Add to `docker-compose.yml`:
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

### Volume Optimization
- Use named volumes for persistent data
- Mount only necessary directories
- Use `.dockerignore` to exclude unnecessary files

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review container logs: `docker-compose logs -f`
3. Verify environment variables in `.env.docker`
4. Ensure all required services are running: `docker-compose ps`

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)

---

🎉 **Your NPCL Dashboard is now ready for Docker deployment!**