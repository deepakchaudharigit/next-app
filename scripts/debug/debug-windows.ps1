# PowerShell Debug Scripts for Windows
# Usage: .\scripts\debug\debug-windows.ps1 [command]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("inspect", "debug", "verbose", "api", "prisma", "nextauth", "help")]
    [string]$Command
)

function Show-Help {
    Write-Host "🔍 Windows Debug Scripts for NPCL Dashboard" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\scripts\debug\debug-windows.ps1 [command]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Available commands:" -ForegroundColor Green
    Write-Host "  inspect   - Start with Node.js inspector (port 9229)" -ForegroundColor White
    Write-Host "  debug     - Start with external debug access" -ForegroundColor White
    Write-Host "  verbose   - Start with verbose logging" -ForegroundColor White
    Write-Host "  api       - Start with API debugging" -ForegroundColor White
    Write-Host "  prisma    - Start with Prisma query debugging" -ForegroundColor White
    Write-Host "  nextauth  - Start with NextAuth debugging" -ForegroundColor White
    Write-Host "  help      - Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\scripts\debug\debug-windows.ps1 inspect" -ForegroundColor Gray
    Write-Host "  .\scripts\debug\debug-windows.ps1 api" -ForegroundColor Gray
    Write-Host ""
    Write-Host "After starting, open Chrome and go to: chrome://inspect" -ForegroundColor Magenta
}

function Start-Debug {
    param($DebugType)
    
    Write-Host "🚀 Starting Next.js with $DebugType debugging..." -ForegroundColor Green
    Write-Host ""
    
    switch ($DebugType) {
        "inspect" {
            Write-Host "📍 Node.js Inspector will be available at: http://localhost:9229" -ForegroundColor Yellow
            $env:NODE_OPTIONS = "--inspect"
            npm run dev
        }
        "debug" {
            Write-Host "📍 External debug access enabled on: 0.0.0.0:9229" -ForegroundColor Yellow
            $env:NODE_OPTIONS = "--inspect=0.0.0.0:9229"
            npm run dev
        }
        "verbose" {
            Write-Host "📍 Verbose logging enabled for all modules" -ForegroundColor Yellow
            $env:DEBUG = "*"
            npm run dev
        }
        "api" {
            Write-Host "📍 API debugging enabled" -ForegroundColor Yellow
            $env:DEBUG = "1"
            npm run dev
        }
        "prisma" {
            Write-Host "📍 Prisma query debugging enabled" -ForegroundColor Yellow
            $env:DEBUG = "prisma:*"
            npm run dev
        }
        "nextauth" {
            Write-Host "📍 NextAuth debugging enabled" -ForegroundColor Yellow
            $env:NEXTAUTH_DEBUG = "true"
            npm run dev
        }
    }
}

# Main execution
switch ($Command) {
    "help" {
        Show-Help
    }
    default {
        Start-Debug $Command
    }
}