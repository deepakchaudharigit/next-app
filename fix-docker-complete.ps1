# NPCL Dashboard - Complete Docker Fix Script
# This script fixes all Docker and port conflict issues

Write-Host "🔧 NPCL Dashboard - Complete Docker Fix" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Function to kill processes on a specific port
function Kill-ProcessOnPort {
    param([int]$Port)
    
    Write-Host "🔍 Checking for processes on port $Port..." -ForegroundColor Yellow
    
    $processes = netstat -ano | findstr ":$Port"
    if ($processes) {
        Write-Host "Found processes on port ${Port}:" -ForegroundColor Red
        Write-Host $processes -ForegroundColor Red
        
        # Extract PIDs and kill them
        $pids = ($processes | ForEach-Object { 
            $parts = $_ -split '\s+'
            $parts[-1] 
        }) | Sort-Object -Unique | Where-Object { $_ -and $_ -ne "0" }
        
        foreach ($pid in $pids) {
            if ($pid -and $pid -ne "0") {
                Write-Host "💀 Killing process $pid..." -ForegroundColor Yellow
                try {
                    taskkill /PID $pid /F 2>$null
                    Write-Host "✅ Process $pid killed successfully" -ForegroundColor Green
                } catch {
                    Write-Host "⚠️  Failed to kill process $pid" -ForegroundColor Yellow
                }
            }
        }
    } else {
        Write-Host "✅ No processes found on port $Port" -ForegroundColor Green
    }
}

# Step 1: Stop all Docker containers
Write-Host "`n🛑 Step 1: Stopping Docker containers..." -ForegroundColor Yellow
try {
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v --remove-orphans
    Write-Host "✅ Docker containers stopped" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Error stopping containers: $_" -ForegroundColor Yellow
}

# Step 2: Kill processes on ports 3000, 5432, 6379
Write-Host "`n🔫 Step 2: Killing processes on required ports..." -ForegroundColor Yellow
Kill-ProcessOnPort -Port 3000
Kill-ProcessOnPort -Port 5432
Kill-ProcessOnPort -Port 6379

# Step 3: Clean up Docker resources
Write-Host "`n🧹 Step 3: Cleaning up Docker resources..." -ForegroundColor Yellow
try {
    docker system prune -f
    Write-Host "✅ Docker resources cleaned" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Error cleaning Docker resources: $_" -ForegroundColor Yellow
}

# Step 4: Remove any dangling volumes
Write-Host "`n📦 Step 4: Removing dangling volumes..." -ForegroundColor Yellow
try {
    docker volume prune -f
    Write-Host "✅ Dangling volumes removed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Error removing volumes: $_" -ForegroundColor Yellow
}

# Step 5: Wait a moment for cleanup
Write-Host "`n⏳ Step 5: Waiting for cleanup to complete..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Step 6: Restart Docker Desktop (if needed)
Write-Host "`n🔄 Step 6: Checking Docker status..." -ForegroundColor Yellow
try {
    $dockerStatus = docker version 2>$null
    if ($dockerStatus) {
        Write-Host "✅ Docker is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Docker may need to be restarted" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Docker status check failed" -ForegroundColor Yellow
}

# Step 7: Start Docker services
Write-Host "`n🚀 Step 7: Starting Docker services..." -ForegroundColor Green
Write-Host "This may take a few minutes for the first build..." -ForegroundColor Cyan

try {
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build --force-recreate
} catch {
    Write-Host "❌ Error starting Docker services: $_" -ForegroundColor Red
    Write-Host "`n🔧 Try running the following commands manually:" -ForegroundColor Yellow
    Write-Host "1. docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v" -ForegroundColor Cyan
    Write-Host "2. docker system prune -f" -ForegroundColor Cyan
    Write-Host "3. docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build" -ForegroundColor Cyan
}