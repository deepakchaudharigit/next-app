# NPCL Dashboard - Backend Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the NPCL Dashboard backend-only system. The refactored application focuses solely on API endpoints for authentication (NextAuth.js) and reports management, making it ideal for microservice architectures or headless deployments.

## Prerequisites

### System Requirements
- **Node.js**: 18.0.0 or higher
- **PostgreSQL**: 12.0 or higher
- **Memory**: Minimum 2GB RAM (4GB recommended for production)
- **Storage**: Minimum 10GB free space
- **Network**: HTTPS support for production deployments

### Required Tools
- Docker and Docker Compose (recommended)
- Git for source code management
- SSL certificates for production HTTPS

## Environment Configuration

### Essential Environment Variables

Create a `.env` file with the following required variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/npcl_dashboard"

# NextAuth.js Configuration (REQUIRED)
NEXTAUTH_SECRET="your-super-secret-jwt-key-here-make-it-long-and-random-minimum-32-characters"
NEXTAUTH_URL="https://your-domain.com"  # or http://localhost:3000 for development

# Node Environment
NODE_ENV="production"
```

### Optional Configuration Variables

```bash
# Email Configuration (for password reset functionality)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="NPCL Dashboard <your-email@gmail.com>"

# Security Settings
BCRYPT_SALT_ROUNDS="12"
JWT_EXPIRES_IN="24h"

# Session Configuration
SESSION_MAX_AGE="86400"      # 24 hours in seconds
SESSION_UPDATE_AGE="3600"    # 1 hour in seconds

# Rate Limiting
RATE_LIMIT_WINDOW_MS="900000"    # 15 minutes
RATE_LIMIT_MAX_ATTEMPTS="5"

# File Upload Limits
MAX_FILE_SIZE="10485760"     # 10MB

# Alert Thresholds
LOW_EFFICIENCY_THRESHOLD="75"
HIGH_TEMPERATURE_THRESHOLD="500"
OFFLINE_TIMEOUT="300000"     # 5 minutes
```

### Environment Variable Generation

Generate secure secrets for production:

```bash
# Generate NEXTAUTH_SECRET (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate database password
openssl rand -base64 16

# Generate JWT secret (different from NEXTAUTH_SECRET)
openssl rand -base64 32
```

## Docker Deployment (Recommended)

### Quick Start with Docker Compose

1. **Clone and Setup**
```bash
git clone <repository-url>
cd NPCL
```

2. **Environment Configuration**
```bash
# Copy Docker environment template
cp .env.docker.example .env.docker

# Edit with your production values
nano .env.docker
```

3. **Start Production Environment**
```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f app
```

### Docker Compose Configuration

The `docker-compose.yml` includes:

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/auth/session"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### Database Initialization

After starting the containers:

```bash
# Run database migrations
docker-compose exec app npx prisma migrate deploy

# Generate Prisma client
docker-compose exec app npx prisma generate

# Seed database with initial data
docker-compose exec app npm run db:seed
```

## Traditional Server Deployment

### Server Setup (Ubuntu/Debian)

1. **System Updates and Dependencies**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install PM2 for process management
sudo npm install -g pm2
```

2. **PostgreSQL Setup**
```bash
# Create database user
sudo -u postgres createuser --interactive npcl_user

# Create database
sudo -u postgres createdb npcl_dashboard

# Set password
sudo -u postgres psql -c "ALTER USER npcl_user PASSWORD 'secure_password';"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE npcl_dashboard TO npcl_user;"
```

3. **Application Deployment**
```bash
# Clone repository
git clone <repository-url>
cd NPCL

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Setup environment
cp .env.example .env
# Edit .env with production values

# Run database setup
npm run db:generate
npm run db:migrate
npm run db:seed
```

4. **Process Management with PM2**

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'npcl-backend',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G'
  }]
}
```

Start the application:
```bash
# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

## Database Management

### Migration Strategy

```bash
# Development migrations
npm run db:migrate

# Production migrations (safer)
npm run db:generate
npx prisma migrate deploy

# Reset database (destructive - development only)
npx prisma migrate reset
```

### Backup and Recovery

```bash
# Create backup
pg_dump -U npcl_user -h localhost npcl_dashboard > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql -U npcl_user -h localhost npcl_dashboard < backup_file.sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/var/backups/npcl"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U npcl_user -h localhost npcl_dashboard | gzip > $BACKUP_DIR/npcl_backup_$DATE.sql.gz

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "npcl_backup_*.sql.gz" -mtime +30 -delete
```

## SSL/TLS Configuration

### Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx Reverse Proxy

Create `/etc/nginx/sites-available/npcl-backend`:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/npcl-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Troubleshooting Common Issues

### 1. Prisma/OpenSSL Issues

**Problem**: Prisma client fails with OpenSSL errors in Docker

**Solution**: Update `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}
```

**Docker Fix**:
```bash
# Rebuild Prisma client in container
docker-compose exec app npx prisma generate

# Or rebuild entire container
docker-compose down
docker-compose build --no-cache app
docker-compose up -d
```

### 2. Environment Variable Issues

**Problem**: NextAuth configuration errors

**Symptoms**:
- "NEXTAUTH_SECRET is not set" errors
- "Invalid configuration" warnings
- Session creation failures

**Solution**:
```bash
# Verify environment variables are loaded
docker-compose exec app env | grep -E "(DATABASE_URL|NEXTAUTH)"

# Check .env file exists and has correct values
cat .env.docker

# Restart services after environment changes
docker-compose restart app
```

### 3. Database Connection Issues

**Problem**: Application can't connect to PostgreSQL

**Symptoms**:
- "Connection refused" errors
- "ECONNREFUSED" in logs
- Database timeout errors

**Solutions**:

**Check PostgreSQL Status**:
```bash
# In Docker
docker-compose logs postgres
docker-compose exec postgres pg_isready -U postgres

# On host system
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"
```

**Verify Connection String**:
```bash
# Test connection manually
psql "postgresql://username:password@localhost:5432/npcl_dashboard"

# Check if database exists
sudo -u postgres psql -l | grep npcl
```

**Fix Connection Issues**:
```bash
# Reset database container
docker-compose down postgres
docker volume rm npcl_postgres_data
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
docker-compose exec postgres pg_isready -U postgres
```

### 4. Authentication Issues

**Problem**: NextAuth.js authentication failures

**Common Issues**:
- JWT secret not set or too short
- Callback URL mismatch
- Session cookie issues

**Solutions**:
```bash
# Generate proper NEXTAUTH_SECRET (minimum 32 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Verify NEXTAUTH_URL matches your domain
echo $NEXTAUTH_URL

# Clear browser cookies and try again
# Check browser developer tools for cookie issues
```

### 5. Build and Deployment Issues

**Problem**: Application build failures

**Solutions**:
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript compilation
npx tsc --noEmit

# Verify all dependencies are installed
npm audit
```

## Monitoring and Health Checks

### Application Health Monitoring

```bash
# Check application status
curl -f http://localhost:3000/api/auth/session

# Monitor with PM2
pm2 status
pm2 logs npcl-backend
pm2 monit

# Database health check
docker-compose exec postgres pg_isready -U postgres -d npcl_dashboard
```

### Log Management

```bash
# View application logs
docker-compose logs -f app

# View database logs
docker-compose logs -f postgres

# PM2 log management
pm2 logs --lines 100
pm2 flush  # Clear logs
```

### Automated Monitoring

Add to crontab for health checks:
```bash
# Check every 5 minutes
*/5 * * * * curl -f http://localhost:3000/api/auth/session || echo "NPCL Backend is down" | mail -s "Alert" admin@company.com

# Daily backup
0 2 * * * /path/to/backup-script.sh
```

## Performance Optimization

### Database Optimization

```sql
-- Create indexes for common queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_voicebot_calls_received_at ON voicebot_calls(received_at);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM voicebot_calls WHERE received_at > NOW() - INTERVAL '7 days';
```

### Application Optimization

```bash
# Enable gzip compression in Nginx
gzip on;
gzip_types text/plain application/json application/javascript text/css;

# Configure PM2 for optimal performance
pm2 start ecosystem.config.js --instances max
```

## Security Checklist

### Production Security

- [ ] Use HTTPS in production (SSL/TLS certificates)
- [ ] Set strong, unique database passwords
- [ ] Configure firewall (UFW/iptables)
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] Monitor access logs
- [ ] Use environment variables for all secrets
- [ ] Enable audit logging
- [ ] Configure rate limiting
- [ ] Regular security scans

### Environment Security

```bash
# Secure file permissions
chmod 600 .env
chmod 600 .env.docker

# Secure database files
sudo chown postgres:postgres /var/lib/postgresql/data
sudo chmod 700 /var/lib/postgresql/data
```

## Maintenance Procedures

### Daily Tasks
- Monitor application health and logs
- Check error rates and performance metrics
- Verify backup completion

### Weekly Tasks
- Review security logs and audit trails
- Update dependencies (security patches)
- Performance monitoring and optimization

### Monthly Tasks
- Full system backup and recovery testing
- Security vulnerability scanning
- Database maintenance and optimization
- Log rotation and cleanup

## Support and Troubleshooting

### Common Commands

```bash
# Restart services
docker-compose restart app
pm2 restart npcl-backend

# View logs
docker-compose logs -f app
pm2 logs npcl-backend --lines 100

# Database operations
docker-compose exec app npx prisma studio
docker-compose exec postgres psql -U postgres -d npcl_dashboard

# Health checks
curl -f http://localhost:3000/api/auth/session
docker-compose ps
```

### Getting Help

1. Check application logs for specific error messages
2. Verify environment configuration
3. Test database connectivity
4. Check service status and health
5. Review this deployment guide for common issues

For additional support, refer to the project documentation or create an issue in the repository.

---

This deployment guide provides a comprehensive foundation for deploying the NPCL Dashboard backend in production environments with proper security, monitoring, and maintenance procedures.