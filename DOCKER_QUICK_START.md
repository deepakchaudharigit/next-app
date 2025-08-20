# 🐳 NPCL Dashboard - Docker Quick Start

## 🚀 Get Started in 3 Steps

### 1. Setup Environment
```bash
# Copy environment template
cp .env.docker.example .env.docker

# Edit with your settings (minimum required)
nano .env.docker
```

**Required changes in `.env.docker`:**
```bash
NEXTAUTH_SECRET="your-super-secret-jwt-key-here-make-it-long-and-random"
POSTGRES_PASSWORD="your-secure-password"
```

### 2. Make Scripts Executable
```bash
chmod +x docker-start.sh
chmod +x scripts/docker/startup.sh
chmod +x scripts/docker/startup-dev-simple.sh
```

### 3. Start the Application
```bash
# Development mode (with hot reloading)
./docker-start.sh start development

# Or use npm scripts
npm run docker:dev
```

## 🎯 Quick Commands

```bash
# Start services
./docker-start.sh start development    # Development mode
./docker-start.sh start production     # Production mode
./docker-start.sh start dev-tools      # With extra dev tools

# Manage services
./docker-start.sh stop                 # Stop all services
./docker-start.sh restart development  # Restart services
./docker-start.sh status               # Show service status

# View logs
./docker-start.sh logs                 # All services
./docker-start.sh logs app             # Application only
./docker-start.sh logs postgres        # Database only

# Access containers
./docker-start.sh shell                # App container shell
./docker-start.sh db-shell             # Database shell

# Cleanup
./docker-start.sh clean                # Remove containers and volumes
```

## 🌐 Service URLs

Once running, access:
- **Application**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **Database**: localhost:5432
- **Redis**: localhost:6379

### Development Tools (with dev-tools profile)
- **Adminer** (DB Admin): http://localhost:8080
- **MailHog** (Email Testing): http://localhost:8025

## 🔧 NPM Scripts Available

```bash
# Development
npm run docker:dev              # Start dev environment
npm run docker:dev:detached     # Start in background
npm run docker:dev:tools        # Start with dev tools

# Production
npm run docker:prod             # Start production
npm run docker:down             # Stop all services

# Database
npm run docker:db:reset         # Reset database
npm run docker:db:seed          # Seed database
npm run docker:db:studio        # Open Prisma Studio

# Utilities
npm run docker:logs             # View logs
npm run docker:shell            # Access container
npm run docker:clean            # Clean up
```

## 🐛 Troubleshooting

### Common Issues

**Database connection failed:**
```bash
# Check services
./docker-start.sh status

# View database logs
./docker-start.sh logs postgres

# Restart services
./docker-start.sh restart development
```

**Build failures:**
```bash
# Clean build
./docker-start.sh clean
./docker-start.sh start development
```

**Permission issues:**
```bash
# Fix permissions
sudo chown -R $USER:$USER .
chmod +x docker-start.sh
chmod +x scripts/docker/*.sh
```

## 📁 Docker Files

Your project includes:
- `Dockerfile` - Production build
- `Dockerfile.dev` - Development build
- `docker-compose.yml` - Main services
- `docker-compose.dev.yml` - Development overrides
- `.dockerignore` - Build exclusions
- `docker-start.sh` - Quick start script

## 🎉 You're Ready!

Your NPCL Dashboard is now fully dockerized with:
- ✅ Multi-stage production builds
- ✅ Development hot reloading
- ✅ Database migrations
- ✅ Health checks
- ✅ Easy management scripts

Start developing with: `./docker-start.sh start development`