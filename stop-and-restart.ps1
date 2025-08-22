# Quick stop and restart with Alpine-based image
Write-Host "Stopping current build..." -ForegroundColor Red
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

Write-Host "Switching to Alpine-based Dockerfile for faster build..." -ForegroundColor Green
Copy-Item "Dockerfile.dev.optimized" "Dockerfile.dev" -Force

Write-Host "Restarting with optimized build..." -ForegroundColor Green
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build