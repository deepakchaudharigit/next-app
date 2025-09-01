# Docker Fix Script for Windows PowerShell
# Comprehensive script to fix Docker issues and ensure proper setup

Write-Host "🚀 NPCL Dashboard Docker Fix (Windows PowerShell)" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

function Test-Command {
    param($Command)
    try {
        & $Command --version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Invoke-SafeCommand {
    param(
        [string]$Command,
        [string]$Description,
        [switch]$AllowFailure,
        [switch]$Silent
    )
    
    Write-Host "🔧 $Description..." -ForegroundColor Yellow
    
    try {
        if ($Silent) {
            $output = Invoke-Expression $Command 2>$null
        } else {
            $output = Invoke-Expression $Command
        }
        Write-Host "✅ $Description completed" -ForegroundColor Green
        return @{ Success = $true; Output = $output }
    }
    catch {
        if ($AllowFailure) {
            Write-Host "⚠️ $Description completed (some operations may have failed, which is normal)" -ForegroundColor Yellow
            return @{ Success = $true; Output = "" }
        }
        Write-Host "❌ $Description failed: $($_.Exception.Message)" -ForegroundColor Red
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

# Step 1: Check Docker status
Write-Host "`n🐳 Checking Docker status..." -ForegroundColor Cyan

if (-not (Test-Command "docker")) {
    Write-Host "❌ Docker is not installed or not running!" -ForegroundColor Red
    Write-Host "📝 Please install Docker Desktop and make sure it's running." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Command "docker-compose")) {
    Write-Host "❌ Docker Compose is not available!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker and Docker Compose are available" -ForegroundColor Green

# Step 2: Check environment files
Write-Host "`n📁 Checking environment files..." -ForegroundColor Cyan

$envFiles = @(".env", ".env.docker")
$allExist = $true

foreach ($file in $envFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
        $allExist = $false
    }
}

if (-not $allExist) {
    Write-Host "`n❌ Missing environment files!" -ForegroundColor Red
    Write-Host "📝 Please run: npm run fix:auth" -ForegroundColor Yellow
    exit 1
}

# Step 3: Cleanup existing Docker resources
Write-Host "`n🧹 Cleaning up Docker..." -ForegroundColor Cyan

# Stop all containers using docker-compose
Invoke-SafeCommand "docker-compose -f docker-compose.yml -f docker-compose.dev.yml down" "Stopping all containers"

# Force remove any remaining containers
Write-Host "`n🗑️ Force removing existing containers..." -ForegroundColor Cyan

$containerNames = @(
    "npcl-dashboard-app",
    "npcl-dashboard-dev", 
    "npcl-postgres", 
    "npcl-redis",
    "npcl-adminer",
    "npcl-mailhog"
)

foreach ($name in $containerNames) {
    Invoke-SafeCommand "docker stop $name" "Stopping container $name" -AllowFailure -Silent
    Invoke-SafeCommand "docker rm -f $name" "Removing container $name" -AllowFailure -Silent
}

# Remove problematic images
Write-Host "`n🗑️ Removing problematic images..." -ForegroundColor Cyan

$imageNames = @("next-app-app", "next-app_app", "npcl-dashboard:dev")
foreach ($name in $imageNames) {
    Invoke-SafeCommand "docker rmi $name" "Removing image $name" -AllowFailure -Silent
}

# Clean up system
Invoke-SafeCommand "docker image prune -f" "Removing dangling images"
Invoke-SafeCommand "docker builder prune -f" "Cleaning build cache"

# Step 4: Build and start services
Write-Host "`n🚀 Building and starting containers..." -ForegroundColor Cyan

$buildResult = Invoke-SafeCommand "docker-compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache app" "Building application container"

if (-not $buildResult.Success) {
    Write-Host "`n❌ Build failed! Check the error above." -ForegroundColor Red
    exit 1
}

$startResult = Invoke-SafeCommand "docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d" "Starting services"

if (-not $startResult.Success) {
    Write-Host "`n❌ Failed to start services! Check the error above." -ForegroundColor Red
    Write-Host "📝 Try running: npm run docker:logs:app" -ForegroundColor Yellow
    exit 1
}

# Step 5: Check service status
Write-Host "`n🔍 Checking service status..." -ForegroundColor Cyan
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow

Start-Sleep -Seconds 5

Invoke-SafeCommand "docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps" "Service status"

Write-Host "`n📋 Recent logs:" -ForegroundColor Cyan
Invoke-SafeCommand "docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs --tail=20" "Recent logs"

Write-Host "`n$('=' * 50)" -ForegroundColor Green
Write-Host "🎉 Docker fix completed!" -ForegroundColor Green
Write-Host "✅ Services should be starting up." -ForegroundColor Green
Write-Host "`n📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Wait 30-60 seconds for services to fully start" -ForegroundColor White
Write-Host "   2. Check status: npm run docker:logs:app" -ForegroundColor White
Write-Host "   3. Visit: http://localhost:3000" -ForegroundColor White
Write-Host "   4. If issues persist, check logs: npm run docker:logs" -ForegroundColor White