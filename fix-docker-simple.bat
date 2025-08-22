@echo off
echo ========================================
echo NPCL Dashboard - Docker Fix Script
echo ========================================

echo.
echo Step 1: Stopping Docker containers...
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v --remove-orphans

echo.
echo Step 2: Killing processes on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Killing process %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo Step 3: Cleaning Docker resources...
docker system prune -f

echo.
echo Step 4: Waiting for cleanup...
timeout /t 5 /nobreak >nul

echo.
echo Step 5: Starting Docker services...
echo This may take a few minutes for the first build...
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build --force-recreate

pause