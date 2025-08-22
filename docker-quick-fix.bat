@echo off
echo Stopping current Docker containers...
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

echo Cleaning up Docker cache...
docker system prune -f

echo Starting with optimized build...
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

pause