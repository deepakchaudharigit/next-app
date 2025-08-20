#!/bin/bash

# NPCL Dashboard Docker Fixes Verification Script
# This script verifies that all Docker issues have been resolved

set -e

echo "🔍 NPCL Dashboard Docker Fixes Verification"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $message"
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ FAIL${NC}: $message"
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC}: $message"
    else
        echo "ℹ️  INFO: $message"
    fi
}

# Function to check if Docker is running
check_docker() {
    echo "1. Checking Docker status..."
    if docker info >/dev/null 2>&1; then
        print_status "PASS" "Docker is running"
        return 0
    else
        print_status "FAIL" "Docker is not running"
        return 1
    fi
}

# Function to check if containers are running
check_containers() {
    echo ""
    echo "2. Checking container status..."
    
    local containers=("npcl-postgres" "npcl-redis" "npcl-dashboard-dkch")
    local all_running=true
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "^$container$"; then
            print_status "PASS" "Container $container is running"
        else
            print_status "FAIL" "Container $container is not running"
            all_running=false
        fi
    done
    
    return $all_running
}

# Function to check PostgreSQL health
check_postgres() {
    echo ""
    echo "3. Checking PostgreSQL health..."
    
    # Check if PostgreSQL is accepting connections
    if docker-compose exec -T postgres pg_isready -U postgres -d npcl-auth-db-dev >/dev/null 2>&1; then
        print_status "PASS" "PostgreSQL is accepting connections"
    else
        print_status "FAIL" "PostgreSQL is not accepting connections"
        return 1
    fi
    
    # Check if database exists
    if docker-compose exec -T postgres psql -U postgres -d npcl-auth-db-dev -c "SELECT 1;" >/dev/null 2>&1; then
        print_status "PASS" "Database npcl-auth-db-dev exists and is accessible"
    else
        print_status "FAIL" "Database npcl-auth-db-dev is not accessible"
        return 1
    fi
}

# Function to check Redis health
check_redis() {
    echo ""
    echo "4. Checking Redis health..."
    
    if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        print_status "PASS" "Redis is responding to ping"
    else
        print_status "FAIL" "Redis is not responding"
        return 1
    fi
}

# Function to check application health
check_application() {
    echo ""
    echo "5. Checking application health..."
    
    # Wait a moment for the application to be ready
    sleep 5
    
    # Check if application is responding
    if curl -f -s http://localhost:3000/api/health >/dev/null 2>&1; then
        print_status "PASS" "Application health endpoint is responding"
        
        # Get health status
        local health_response=$(curl -s http://localhost:3000/api/health)
        echo "   Health response: $health_response"
    else
        print_status "FAIL" "Application health endpoint is not responding"
        return 1
    fi
}

# Function to check Prisma/OpenSSL compatibility
check_prisma() {
    echo ""
    echo "6. Checking Prisma/OpenSSL compatibility..."
    
    # Test Prisma database connection
    if docker-compose exec -T app npx prisma db execute --stdin <<< "SELECT 1 as test;" >/dev/null 2>&1; then
        print_status "PASS" "Prisma can connect to database (OpenSSL working)"
    else
        print_status "FAIL" "Prisma cannot connect to database (OpenSSL issue)"
        return 1
    fi
    
    # Check for OpenSSL errors in logs
    local openssl_errors=$(docker-compose logs app 2>&1 | grep -i "libssl\\|openssl" | grep -i "error\\|failed" | wc -l)
    if [ "$openssl_errors" -eq 0 ]; then
        print_status "PASS" "No OpenSSL errors found in application logs"
    else
        print_status "WARN" "Found $openssl_errors OpenSSL-related errors in logs"
    fi
}

# Function to check environment configuration
check_environment() {
    echo ""
    echo "7. Checking environment configuration..."
    
    # Check if .env.docker exists
    if [ -f ".env.docker" ]; then
        print_status "PASS" ".env.docker file exists"
    else
        print_status "FAIL" ".env.docker file not found"
        return 1
    fi
    
    # Check database URL configuration
    if grep -q "npcl-auth-db-dev" .env.docker; then
        print_status "PASS" "Database name is correctly configured as npcl-auth-db-dev"
    else
        print_status "FAIL" "Database name configuration is incorrect"
        return 1
    fi
    
    # Check if required environment variables are set
    local required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
    for var in "${required_vars[@]}"; do
        if grep -q "^$var=" .env.docker; then
            print_status "PASS" "$var is configured"
        else
            print_status "FAIL" "$var is not configured"
        fi
    done
}

# Function to show detailed status
show_detailed_status() {
    echo ""
    echo "8. Detailed status information..."
    echo ""
    
    echo "📊 Container Status:"
    docker-compose ps
    echo ""
    
    echo "🔗 Service Endpoints:"
    echo "   Application: http://localhost:3000"
    echo "   Health Check: http://localhost:3000/api/health"
    echo "   PostgreSQL: localhost:5432"
    echo "   Redis: localhost:6379"
    echo ""
    
    echo "📋 Quick Commands:"
    echo "   View logs: docker-compose logs -f app"
    echo "   Restart app: docker-compose restart app"
    echo "   Stop all: docker-compose down"
}

# Function to run all checks
run_all_checks() {
    local failed_checks=0
    
    check_docker || ((failed_checks++))
    check_containers || ((failed_checks++))
    check_postgres || ((failed_checks++))
    check_redis || ((failed_checks++))
    check_application || ((failed_checks++))
    check_prisma || ((failed_checks++))
    check_environment || ((failed_checks++))
    
    show_detailed_status
    
    echo ""
    echo "==========================================="
    
    if [ $failed_checks -eq 0 ]; then
        print_status "PASS" "All checks passed! Docker issues have been resolved."
        echo ""
        echo "🎉 Your NPCL Dashboard is running successfully!"
        echo "   Access it at: http://localhost:3000"
    else
        print_status "FAIL" "$failed_checks check(s) failed. Some issues may still exist."
        echo ""
        echo "🔧 To fix remaining issues:"
        echo "   1. Run: ./fix-docker-issues.sh"
        echo "   2. Check logs: docker-compose logs"
        echo "   3. Verify environment: cat .env.docker"
    fi
    
    return $failed_checks
}

# Main execution
main() {
    run_all_checks
    exit $?
}

# Run main function
main "$@"