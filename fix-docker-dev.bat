@echo off
echo 🔧 Fixing Docker Development Setup...
echo ======================================

REM Step 1: Stop any running containers
echo 1. Stopping existing containers...
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down 2>nul

REM Step 2: Clean up Docker to avoid cache issues
echo 2. Cleaning Docker cache...
docker system prune -f 2>nul

REM Step 3: Remove package-lock.json to force fresh install
echo 3. Updating package-lock.json...
if exist package-lock.json del package-lock.json

REM Step 4: Start the development environment
echo 4. Starting Docker development environment...
echo    This may take a few minutes on first run...

docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

echo.
echo ✅ Docker development setup complete!
echo 🌐 Application should be available at: http://localhost:3000
echo 🔍 Health check: http://localhost:3000/api/health
echo 📊 Database admin (if dev-tools enabled): http://localhost:8080