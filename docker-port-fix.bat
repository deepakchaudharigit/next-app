@echo off
echo 🔍 Fixing Docker Port Conflict (Port 3000)
echo ==========================================

echo.
echo 1. Checking what's using port 3000...
netstat -ano | findstr :3000

echo.
echo 2. Stopping any Node.js processes...
taskkill /IM node.exe /F 2>nul
taskkill /IM "next-server" /F 2>nul

echo.
echo 3. Stopping Docker containers...
docker-compose down 2>nul
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down 2>nul

echo.
echo 4. Cleaning Docker resources...
docker system prune -f 2>nul

echo.
echo 5. Final port check...
netstat -ano | findstr :3000

echo.
echo ✅ Port cleanup completed!
echo.
echo 🚀 Now try running Docker:
echo npm run docker:dev
echo.
pause