# Start Correct Server for Rate Limiting Testing
# This script helps ensure you're running the right server

Write-Host "🚀 NPCL Dashboard Server Starter" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found!" -ForegroundColor Red
    Write-Host "   Make sure you're in the correct directory:" -ForegroundColor Yellow
    Write-Host "   cd C:\Users\shaik\OneDrive\Documents\GitHub\next-app" -ForegroundColor Yellow
    exit 1
}

# Check package.json content
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$projectName = $packageJson.name

Write-Host "📦 Project: $projectName" -ForegroundColor Green

if ($projectName -ne "npcl-dashboard") {
    Write-Host "⚠️  Warning: Expected 'npcl-dashboard' but found '$projectName'" -ForegroundColor Yellow
    Write-Host "   Make sure you're in the correct project directory." -ForegroundColor Yellow
}

# Check what's running on port 3000
Write-Host ""
Write-Host "🔍 Checking port 3000..." -ForegroundColor Yellow

$portCheck = netstat -ano | findstr :3000
if ($portCheck) {
    Write-Host "⚠️  Port 3000 is already in use:" -ForegroundColor Yellow
    Write-Host $portCheck -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔧 To fix this:" -ForegroundColor Cyan
    Write-Host "   1. Find the terminal running the server" -ForegroundColor White
    Write-Host "   2. Press Ctrl+C to stop it" -ForegroundColor White
    Write-Host "   3. Run this script again" -ForegroundColor White
    Write-Host ""
    
    $response = Read-Host "Do you want to continue anyway? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Exiting..." -ForegroundColor Gray
        exit 0
    }
}

# Start the development server
Write-Host ""
Write-Host "🚀 Starting Next.js development server..." -ForegroundColor Green
Write-Host "   This will start your NPCL Dashboard on http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 What to expect:" -ForegroundColor Cyan
Write-Host "   ✅ 'Ready - started server on 0.0.0.0:3000'" -ForegroundColor Green
Write-Host "   ✅ 'compiled successfully'" -ForegroundColor Green
Write-Host ""
Write-Host "🧪 After the server starts, you can test rate limiting:" -ForegroundColor Cyan
Write-Host "   # In a new PowerShell window:" -ForegroundColor Gray
Write-Host "   .\scripts\testing\test-rate-limiting-windows.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop the server when done." -ForegroundColor Yellow
Write-Host ""

# Start the server
try {
    npm run dev
}
catch {
    Write-Host ""
    Write-Host "❌ Failed to start server!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Try these fixes:" -ForegroundColor Cyan
    Write-Host "   1. npm install" -ForegroundColor White
    Write-Host "   2. npm run build" -ForegroundColor White
    Write-Host "   3. Check for any error messages above" -ForegroundColor White
    exit 1
}