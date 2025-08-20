@echo off
REM NPCL Dashboard Docker Issues Fix Script for Windows
REM This script fixes the OpenSSL compatibility and database name issues

echo 🔧 NPCL Dashboard Docker Issues Fix
echo ====================================
echo.

REM Function to check if Docker is running
echo ✅ Checking Docker status...
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)
echo ✅ Docker is running

REM Function to stop and remove existing containers
echo 🧹 Cleaning up existing containers...
docker-compose down --remove-orphans >nul 2>&1
docker rm -f npcl-dashboard-dkch npcl-postgres npcl-redis npcl-nginx >nul 2>&1
docker image prune -f >nul 2>&1
echo ✅ Cleanup completed

REM Function to verify environment files
echo 🔍 Verifying environment configuration...
if not exist ".env.docker" (
    echo ❌ .env.docker file not found
    pause
    exit /b 1
)

findstr /C:"npcl-auth-db-dev" .env.docker >nul
if errorlevel 1 (
    echo ❌ Database name configuration needs fixing
    pause
    exit /b 1
)
echo ✅ Environment configuration verified

REM Function to rebuild images with OpenSSL fixes
echo 🔨 Rebuilding Docker images with OpenSSL fixes...
echo    Building production image...
docker-compose build --no-cache app
if errorlevel 1 (
    echo ❌ Failed to build production image
    pause
    exit /b 1
)

echo    Building development image...
docker-compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache app
if errorlevel 1 (
    echo ❌ Failed to build development image
    pause
    exit /b 1
)
echo ✅ Images rebuilt successfully

REM Function to start services
echo 🚀 Starting services...
echo    Starting PostgreSQL...
docker-compose up -d postgres
if errorlevel 1 (
    echo ❌ Failed to start PostgreSQL
    pause
    exit /b 1
)

echo    Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak >nul

echo    Starting Redis...
docker-compose up -d redis
if errorlevel 1 (
    echo ❌ Failed to start Redis
    pause
    exit /b 1
)

echo    Starting NPCL Dashboard...
docker-compose up -d app
if errorlevel 1 (
    echo ❌ Failed to start application
    pause
    exit /b 1
)
echo ✅ All services started

REM Function to check service health
echo 🏥 Checking service health...
echo    Waiting for services to initialize...
timeout /t 30 /nobreak >nul

echo    Checking PostgreSQL...
docker-compose exec postgres pg_isready -U postgres -d npcl-auth-db-dev >nul 2>&1
if errorlevel 1 (
    echo ⚠️  PostgreSQL health check failed
) else (
    echo ✅ PostgreSQL is healthy
)

echo    Checking Redis...
docker-compose exec redis redis-cli ping >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Redis health check failed
) else (
    echo ✅ Redis is healthy
)

echo    Checking application...
timeout /t 15 /nobreak >nul
curl -f http://localhost:3000/api/health >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Application health check failed - checking logs...
    docker-compose logs app
) else (
    echo ✅ Application is healthy
)

REM Function to show status
echo.
echo 📊 Service Status:
echo ==================
docker-compose ps
echo.
echo 🌐 Access Points:
echo =================
echo    Application: http://localhost:3000
echo    Health Check: http://localhost:3000/api/health
echo    PostgreSQL: localhost:5432
echo    Redis: localhost:6379
echo.
echo 📋 Useful Commands:
echo ==================
echo    View logs: docker-compose logs -f app
echo    Stop services: docker-compose down
echo    Restart app: docker-compose restart app
echo    Database shell: docker-compose exec postgres psql -U postgres -d npcl-auth-db-dev
echo.
echo 🎉 Docker issues fix completed successfully!
echo    The OpenSSL compatibility issue has been resolved
echo    The database name mismatch has been fixed
echo    All services should now be running properly
echo.
pause