@echo off
echo ========================================
echo NPCL Dashboard - Docker Fix Verification
echo ========================================

echo.
echo Checking Docker status...
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running or not installed
    goto :end
) else (
    echo ✅ Docker is running
)

echo.
echo Checking if containers are running...
docker-compose ps

echo.
echo Checking port 3000...
netstat -ano | findstr :3000
if %errorlevel% neq 0 (
    echo ❌ Nothing is running on port 3000
) else (
    echo ✅ Port 3000 is in use
)

echo.
echo Testing health endpoint...
curl -f http://localhost:3000/api/health 2>nul
if %errorlevel% neq 0 (
    echo ❌ Health endpoint not responding
    echo Try waiting a few more minutes for the app to start
) else (
    echo ✅ Health endpoint is responding
)

echo.
echo Checking Docker logs (last 10 lines)...
docker-compose logs --tail=10 app

:end
echo.
echo Verification complete!
pause