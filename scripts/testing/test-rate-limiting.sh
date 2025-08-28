#!/bin/bash

# Rate Limiting Test Script (Bash/curl version)
# Quick manual testing of rate limiting functionality

# Configuration
BASE_URL="${1:-http://localhost:3000}"
EMAIL="${2:-test@example.com}"
PASSWORD="${3:-wrongpassword}"
MAX_ATTEMPTS="${4:-10}"
ENDPOINT="/api/auth/test-login"

echo "🔒 NPCL Dashboard Rate Limiting Test (curl version)"
echo "=================================================="
echo "Target URL: ${BASE_URL}${ENDPOINT}"
echo "Test Email: ${EMAIL}"
echo "Max Attempts: ${MAX_ATTEMPTS}"
echo ""

# Function to make a login attempt
make_attempt() {
    local attempt_num=$1
    echo "Attempt ${attempt_num}/${MAX_ATTEMPTS}..."
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST "${BASE_URL}${ENDPOINT}" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")
    
    # Extract HTTP status and body
    http_status=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    # Parse JSON response (basic parsing)
    success=$(echo "$body" | grep -o '"success":[^,]*' | cut -d: -f2 | tr -d ' ')
    message=$(echo "$body" | grep -o '"message":"[^"]*"' | cut -d: -f2 | tr -d '"')
    code=$(echo "$body" | grep -o '"code":"[^"]*"' | cut -d: -f2 | tr -d '"')
    
    # Determine status icon
    if [ "$http_status" = "429" ]; then
        status_icon="🚫"
        status_text="RATE LIMITED"
    elif [ "$success" = "true" ]; then
        status_icon="✅"
        status_text="SUCCESS"
    else
        status_icon="❌"
        status_text="FAILED"
    fi
    
    echo "  ${status_icon} Status: ${http_status} | ${status_text} | ${message}"
    
    # Show rate limit info if available
    if [ "$http_status" = "429" ]; then
        retry_after=$(echo "$body" | grep -o '"retryAfter":[0-9]*' | cut -d: -f2)
        total_attempts=$(echo "$body" | grep -o '"totalAttempts":[0-9]*' | cut -d: -f2)
        if [ -n "$retry_after" ] && [ -n "$total_attempts" ]; then
            echo "     Rate Limited: ${total_attempts} attempts, retry after ${retry_after}s"
        fi
    fi
    
    return $http_status
}

# Track results
successful_attempts=0
failed_attempts=0
rate_limited_attempts=0
error_attempts=0
first_rate_limited=""

echo "Starting rate limiting test..."
echo ""

# Make attempts
for i in $(seq 1 $MAX_ATTEMPTS); do
    make_attempt $i
    status=$?
    
    case $status in
        200)
            successful_attempts=$((successful_attempts + 1))
            ;;
        401|404)
            failed_attempts=$((failed_attempts + 1))
            ;;
        429)
            rate_limited_attempts=$((rate_limited_attempts + 1))
            if [ -z "$first_rate_limited" ]; then
                first_rate_limited=$i
            fi
            ;;
        *)
            error_attempts=$((error_attempts + 1))
            ;;
    esac
    
    # Small delay between attempts
    if [ $i -lt $MAX_ATTEMPTS ]; then
        sleep 1
    fi
done

echo ""
echo "📊 Test Results Summary"
echo "======================="
echo "Total Attempts: ${MAX_ATTEMPTS}"
echo "Successful: ${successful_attempts}"
echo "Failed (Auth): ${failed_attempts}"
echo "Rate Limited: ${rate_limited_attempts}"
echo "Errors: ${error_attempts}"

if [ -n "$first_rate_limited" ]; then
    echo "Rate limiting triggered at attempt: ${first_rate_limited}"
fi

echo ""
echo "🔍 Rate Limiting Analysis"
echo "========================="

if [ $rate_limited_attempts -eq 0 ]; then
    echo "⚠️  WARNING: No rate limiting detected. This might indicate:"
    echo "   - Rate limiting is not properly configured"
    echo "   - The test email/password combination is valid"
    echo "   - Rate limiting thresholds are higher than test attempts"
else
    echo "✅ Rate limiting is working correctly"
    
    if [ -n "$first_rate_limited" ] && [ $first_rate_limited -le 6 ]; then
        echo "✅ Rate limiting triggered at expected threshold"
    else
        echo "⚠️  Rate limiting triggered later than expected"
    fi
fi

echo ""
echo "✅ Rate limiting test completed"

# Test rate limit statistics (if admin token available)
if [ -n "$ADMIN_TOKEN" ]; then
    echo ""
    echo "📈 Fetching rate limit statistics..."
    
    stats_response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X GET "${BASE_URL}/api/auth/rate-limit" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}")
    
    stats_status=$(echo "$stats_response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    
    if [ "$stats_status" = "200" ]; then
        echo "✅ Rate limit statistics retrieved successfully"
        # Basic JSON parsing for key stats
        stats_body=$(echo "$stats_response" | sed 's/HTTPSTATUS:[0-9]*$//')
        tracked=$(echo "$stats_body" | grep -o '"totalTrackedIdentifiers":[0-9]*' | cut -d: -f2)
        blocked=$(echo "$stats_body" | grep -o '"blockedIdentifiers":[0-9]*' | cut -d: -f2)
        
        if [ -n "$tracked" ] && [ -n "$blocked" ]; then
            echo "   Tracked identifiers: ${tracked}"
            echo "   Blocked identifiers: ${blocked}"
        fi
    else
        echo "❌ Failed to retrieve rate limit statistics (Status: ${stats_status})"
        echo "   Make sure ADMIN_TOKEN environment variable is set"
    fi
fi

echo ""
echo "Usage examples:"
echo "  # Test with different URL"
echo "  $0 https://your-domain.com"
echo ""
echo "  # Test with specific email"
echo "  $0 http://localhost:3000 user@npcl.com"
echo ""
echo "  # Test with admin token for statistics"
echo "  ADMIN_TOKEN=your_token $0"