@echo off
echo ========================================
echo Quick Port 3000 Fix
echo ========================================

echo Killing all processes on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Killing process %%a
    taskkill /PID %%a /F
)

echo.
echo Stopping Docker containers...
docker-compose down -v

echo.
echo Port 3000 should now be free.
echo You can now restart Docker with:
echo docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

pause