@echo off
REM Script to run Prisma Studio from host machine pointing to Docker database

echo 🎯 Starting Prisma Studio from host machine...
echo 📊 Connecting to Docker PostgreSQL database...

REM Check if Docker containers are running
docker ps | findstr "npcl-postgres" >nul
if errorlevel 1 (
    echo ❌ PostgreSQL Docker container is not running!
    echo Please start your Docker containers first:
    echo    docker-compose up -d
    pause
    exit /b 1
)

REM Backup current .env if it exists
if exist ".env" (
    echo 📦 Backing up current .env to .env.backup
    copy ".env" ".env.backup" >nul
)

REM Create temporary .env with Docker database connection
echo 🔄 Setting up temporary environment for host connection...
(
echo # Temporary environment for Prisma Studio from host
echo DATABASE_URL="postgresql://postgres:SecurePassword2025@localhost:5432/npcl-auth-db-dev?schema=public"
echo NEXTAUTH_SECRET="npcl-dashboard-super-secret-jwt-key-2024-production-ready-secure-random-string-ba52b3778b35aa7e8dc32e68cac112403ae85635a43eeec0e8048e7289237042"
echo NEXTAUTH_URL="http://localhost:3000"
) > .env

REM Test database connection
echo 🔍 Testing database connection...
npx prisma db pull --schema=prisma/schema.prisma >nul 2>&1
if errorlevel 1 (
    echo ❌ Database connection failed!
    echo Please ensure:
    echo    1. Docker containers are running: docker-compose ps
    echo    2. PostgreSQL port 5432 is accessible: docker-compose logs postgres
    goto cleanup
)

echo ✅ Database connection successful!

REM Start Prisma Studio
echo 🚀 Starting Prisma Studio on http://localhost:5555
echo 📱 Studio will open in your default browser
echo Press Ctrl+C to stop...
echo.

npx prisma studio --schema=prisma/schema.prisma --hostname 0.0.0.0 --port 5555

:cleanup
echo.
echo 🔄 Restoring original environment...
if exist ".env.backup" (
    move ".env.backup" ".env" >nul
    echo ✅ Original .env restored
) else (
    del ".env" >nul 2>&1
    echo ✅ Temporary .env removed
)