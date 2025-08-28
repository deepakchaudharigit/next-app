# Rate Limiting Test Script for Windows PowerShell
# Tests rate limiting functionality with proper Windows environment variable handling

param(
    [string]$Url = "http://localhost:3000",
    [string]$Email = "test@example.com",
    [string]$Password = "wrongpassword",
    [int]$Attempts = 8
)

Write-Host "🔒 NPCL Dashboard Rate Limiting Test (Windows)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Target: $Url/api/auth/test-login"
Write-Host "Email: $Email"
Write-Host "Attempts: $Attempts"
Write-Host ""

# Function to make HTTP request
function Invoke-TestRequest {
    param(
        [string]$Uri,
        [hashtable]$Body
    )
    
    try {
        $jsonBody = $Body | ConvertTo-Json
        $response = Invoke-RestMethod -Uri $Uri -Method POST -Body $jsonBody -ContentType "application/json" -ErrorAction Stop
        return @{
            Success = $true
            StatusCode = 200
            Data = $response
        }
    }
    catch {
        $statusCode = 0
        $errorData = $null
        
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $errorBody = $reader.ReadToEnd()
                $errorData = $errorBody | ConvertFrom-Json
            }
            catch {
                $errorData = @{ message = $_.Exception.Message }
            }
        }
        else {
            $errorData = @{ message = $_.Exception.Message }
        }
        
        return @{
            Success = $false
            StatusCode = $statusCode
            Data = $errorData
        }
    }
}

# Test server availability
Write-Host "Checking server availability..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-RestMethod -Uri "$Url/api/health" -Method GET -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ Server is running" -ForegroundColor Green
}
catch {
    Write-Host "❌ Server is not available at $Url" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start the server first:" -ForegroundColor Yellow
    Write-Host "  npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Track results
$results = @()
$successful = 0
$failed = 0
$rateLimited = 0
$errors = 0

# Make attempts
for ($i = 1; $i -le $Attempts; $i++) {
    Write-Host "Attempt $i/$Attempts..." -ForegroundColor White
    
    $requestBody = @{
        email = $Email
        password = $Password
    }
    
    $result = Invoke-TestRequest -Uri "$Url/api/auth/test-login" -Body $requestBody
    
    $attemptResult = @{
        Attempt = $i
        StatusCode = $result.StatusCode
        Success = $result.Data.success -eq $true
        Message = $result.Data.message
        RateLimited = $result.StatusCode -eq 429
        RateLimitInfo = $result.Data.rateLimitInfo
    }
    
    $results += $attemptResult
    
    # Determine status icon and category
    if ($attemptResult.RateLimited) {
        $statusIcon = "🚫"
        $statusText = "RATE LIMITED"
        $rateLimited++
    }
    elseif ($attemptResult.Success) {
        $statusIcon = "✅"
        $statusText = "SUCCESS"
        $successful++
    }
    elseif ($result.StatusCode -eq 0) {
        $statusIcon = "❌"
        $statusText = "ERROR"
        $errors++
    }
    else {
        $statusIcon = "❌"
        $statusText = "FAILED"
        $failed++
    }
    
    Write-Host "  $statusIcon Status: $($attemptResult.StatusCode) | $statusText | $($attemptResult.Message)" -ForegroundColor White
    
    # Show rate limit info if available
    if ($attemptResult.RateLimited -and $attemptResult.RateLimitInfo) {
        $retryAfter = $attemptResult.RateLimitInfo.retryAfter
        $totalAttempts = $attemptResult.RateLimitInfo.totalAttempts
        Write-Host "     Rate Limited: $totalAttempts attempts, retry after ${retryAfter}s" -ForegroundColor Yellow
    }
    
    # Wait before next attempt (except for last)
    if ($i -lt $Attempts) {
        Start-Sleep -Seconds 1
    }
}

# Summary
Write-Host ""
Write-Host "📊 Results Summary" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host "Successful: $successful" -ForegroundColor Green
Write-Host "Failed (Auth): $failed" -ForegroundColor Red
Write-Host "Rate Limited: $rateLimited" -ForegroundColor Yellow
Write-Host "Errors: $errors" -ForegroundColor Red

# Find when rate limiting started
$firstRateLimited = $results | Where-Object { $_.RateLimited } | Select-Object -First 1
if ($firstRateLimited) {
    Write-Host "Rate limiting triggered at attempt: $($firstRateLimited.Attempt)" -ForegroundColor Yellow
}

# Analysis
Write-Host ""
Write-Host "🔍 Rate Limiting Analysis" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

if ($rateLimited -eq 0) {
    Write-Host "⚠️  WARNING: No rate limiting detected. This might indicate:" -ForegroundColor Yellow
    Write-Host "   - Rate limiting is not properly configured" -ForegroundColor Yellow
    Write-Host "   - The test email/password combination is valid" -ForegroundColor Yellow
    Write-Host "   - Rate limiting thresholds are higher than test attempts" -ForegroundColor Yellow
    Write-Host "   - API endpoint is not working correctly" -ForegroundColor Yellow
}
else {
    Write-Host "✅ Rate limiting is working correctly" -ForegroundColor Green
    
    if ($firstRateLimited -and $firstRateLimited.Attempt -le 6) {
        Write-Host "✅ Rate limiting triggered at expected threshold" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Rate limiting triggered later than expected" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Test completed" -ForegroundColor Green

# Usage examples
Write-Host ""
Write-Host "Usage examples:" -ForegroundColor Cyan
Write-Host "  # Test with different email" -ForegroundColor Gray
Write-Host "  .\scripts\testing\test-rate-limiting-windows.ps1 -Email 'user@npcl.com'" -ForegroundColor Gray
Write-Host ""
Write-Host "  # Test with different URL" -ForegroundColor Gray
Write-Host "  .\scripts\testing\test-rate-limiting-windows.ps1 -Url 'https://your-domain.com'" -ForegroundColor Gray
Write-Host ""
Write-Host "  # Test with more attempts" -ForegroundColor Gray
Write-Host "  .\scripts\testing\test-rate-limiting-windows.ps1 -Attempts 15" -ForegroundColor Gray