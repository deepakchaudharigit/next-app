# NPCL Dashboard Docker Quick Fix Script
# PowerShell version for Windows

Write-Host "🛑 Stopping current Docker containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

Write-Host "🧹 Cleaning up Docker cache..." -ForegroundColor Yellow
docker system prune -f

Write-Host "📦 Switching to optimized Alpine-based Dockerfile..." -ForegroundColor Green
if (Test-Path "Dockerfile.dev.backup") {
    Write-Host "Backup already exists, skipping..." -ForegroundColor Yellow
} else {
    Copy-Item "Dockerfile.dev" "Dockerfile.dev.backup"
    Write-Host "Created backup: Dockerfile.dev.backup" -ForegroundColor Green
}

Copy-Item "Dockerfile.dev.optimized" "Dockerfile.dev"
Write-Host "Switched to optimized Dockerfile" -ForegroundColor Green

Write-Host "🚀 Starting with optimized build..." -ForegroundColor Green
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

Write-Host "Press any key to continue..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")