#!/bin/bash

# Comprehensive Prisma Docker Troubleshooting Script
# This script helps diagnose and fix common Prisma + Docker issues

set -e

echo "🔍 NPCL Dashboard - Prisma Docker Troubleshooting"
echo "=================================================="

# Function to check Docker environment
check_docker_environment() {
    echo "📋 Checking Docker Environment..."
    
    echo "  Docker version:"
    docker --version || echo "  ❌ Docker not installed or not running"
    
    echo "  Docker Compose version:"
    docker-compose --version || echo "  ❌ Docker Compose not available"
    
    echo "  Running containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo "  ❌ Cannot list containers"
    
    echo ""
}

# Function to check Prisma engine files
check_prisma_engines() {
    echo "🔧 Checking Prisma Engine Files..."
    
    if docker ps | grep -q "npcl-dashboard"; then
        echo "  Checking Prisma engines in container..."
        docker exec npcl-dashboard-dkch ls -la /app/node_modules/.prisma/client/ 2>/dev/null || {
            echo "  ❌ Cannot access Prisma client directory in container"
            return 1
        }
        
        echo "  Checking for specific engine files:"
        docker exec npcl-dashboard-dkch ls -la /app/node_modules/.prisma/client/libquery_engine-linux-musl.so.node 2>/dev/null && echo "  ✅ Alpine engine found" || echo "  ❌ Alpine engine missing"
        docker exec npcl-dashboard-dkch ls -la /app/node_modules/.prisma/client/query-engine-linux-musl 2>/dev/null && echo "  ✅ Alpine binary found" || echo "  ❌ Alpine binary missing"
    else
        echo "  ❌ Container 'npcl-dashboard-dkch' not running"
    fi
    
    echo ""
}

# Function to check OpenSSL libraries
check_openssl_libraries() {
    echo "🔐 Checking OpenSSL Libraries..."
    
    if docker ps | grep -q "npcl-dashboard"; then
        echo "  Checking OpenSSL installation in container..."
        docker exec npcl-dashboard-dkch which openssl 2>/dev/null && echo "  ✅ OpenSSL binary found" || echo "  ❌ OpenSSL binary missing"
        docker exec npcl-dashboard-dkch openssl version 2>/dev/null || echo "  ❌ Cannot get OpenSSL version"
        
        echo "  Checking for OpenSSL 1.1 compatibility:"
        docker exec npcl-dashboard-dkch ls -la /usr/lib/libssl.so.1.1 2>/dev/null && echo "  ✅ libssl.so.1.1 found" || echo "  ❌ libssl.so.1.1 missing"
        docker exec npcl-dashboard-dkch ls -la /usr/lib/libcrypto.so.1.1 2>/dev/null && echo "  ✅ libcrypto.so.1.1 found" || echo "  ❌ libcrypto.so.1.1 missing"
    else
        echo "  ❌ Container not running"
    fi
    
    echo ""
}

# Function to check environment variables
check_environment_variables() {
    echo "🌍 Checking Environment Variables..."
    
    if docker ps | grep -q "npcl-dashboard"; then
        echo "  Database URL:"
        docker exec npcl-dashboard-dkch printenv DATABASE_URL 2>/dev/null || echo "  ❌ DATABASE_URL not set"
        
        echo "  Prisma engine variables:"
        docker exec npcl-dashboard-dkch printenv PRISMA_QUERY_ENGINE_LIBRARY 2>/dev/null && echo "  ✅ PRISMA_QUERY_ENGINE_LIBRARY set" || echo "  ❌ PRISMA_QUERY_ENGINE_LIBRARY not set"
        docker exec npcl-dashboard-dkch printenv PRISMA_QUERY_ENGINE_BINARY 2>/dev/null && echo "  ✅ PRISMA_QUERY_ENGINE_BINARY set" || echo "  ❌ PRISMA_QUERY_ENGINE_BINARY not set"
        docker exec npcl-dashboard-dkch printenv OPENSSL_CONF 2>/dev/null && echo "  ✅ OPENSSL_CONF set" || echo "  ❌ OPENSSL_CONF not set"
    else
        echo "  ❌ Container not running"
    fi
    
    echo ""
}

# Function to test database connectivity
test_database_connectivity() {
    echo "🗄️ Testing Database Connectivity..."
    
    if docker ps | grep -q "npcl-postgres"; then
        echo "  PostgreSQL container status: ✅ Running"
        
        echo "  Testing connection from app container:"
        if docker ps | grep -q "npcl-dashboard"; then
            docker exec npcl-dashboard-dkch pg_isready -h postgres -p 5432 -U postgres 2>/dev/null && echo "  ✅ Database connection successful" || echo "  ❌ Database connection failed"
        else
            echo "  ❌ App container not running"
        fi
    else
        echo "  ❌ PostgreSQL container not running"
    fi
    
    echo ""
}

# Function to test Prisma operations
test_prisma_operations() {
    echo "⚙️ Testing Prisma Operations..."
    
    if docker ps | grep -q "npcl-dashboard"; then
        echo "  Testing Prisma generate:"
        docker exec npcl-dashboard-dkch npx prisma generate 2>/dev/null && echo "  ✅ Prisma generate successful" || echo "  ❌ Prisma generate failed"
        
        echo "  Testing Prisma db push (dry run):"
        docker exec npcl-dashboard-dkch npx prisma db push --preview-feature 2>/dev/null && echo "  ✅ Prisma db push would succeed" || echo "  ❌ Prisma db push would fail"
    else
        echo "  ❌ Container not running"
    fi
    
    echo ""
}

# Function to provide recommendations
provide_recommendations() {
    echo "💡 Recommendations:"
    echo "=================="
    
    if ! docker ps | grep -q "npcl-dashboard"; then
        echo "1. Start the containers: npm run docker:dev"
        echo ""
        return
    fi
    
    # Check if OpenSSL 1.1 libraries are missing
    if ! docker exec npcl-dashboard-dkch ls -la /usr/lib/libssl.so.1.1 >/dev/null 2>&1; then
        echo "1. 🔧 OpenSSL 1.1 libraries missing - Switch to Debian image:"
        echo "   npm run docker:switch:debian"
        echo "   npm run docker:clean"
        echo "   npm run docker:dev"
        echo ""
    fi
    
    # Check if Prisma engines are missing
    if ! docker exec npcl-dashboard-dkch ls -la /app/node_modules/.prisma/client/libquery_engine-linux-musl.so.node >/dev/null 2>&1; then
        echo "2. 🔧 Prisma engines missing - Rebuild with clean cache:"
        echo "   npm run docker:clean"
        echo "   npm run docker:dev"
        echo ""
    fi
    
    # Check if environment variables are missing
    if ! docker exec npcl-dashboard-dkch printenv PRISMA_QUERY_ENGINE_LIBRARY >/dev/null 2>&1; then
        echo "3. 🔧 Environment variables missing - Check .env.docker file"
        echo "   Ensure PRISMA_QUERY_ENGINE_LIBRARY and related vars are set"
        echo ""
    fi
    
    echo "4. 🔄 If issues persist, try the complete fix sequence:"
    echo "   npm run docker:clean"
    echo "   npm run docker:switch:debian"
    echo "   npm run docker:dev"
    echo ""
    
    echo "5. 📋 For detailed logs:"
    echo "   npm run docker:logs:app"
    echo ""
}

# Main execution
main() {
    check_docker_environment
    check_prisma_engines
    check_openssl_libraries
    check_environment_variables
    test_database_connectivity
    test_prisma_operations
    provide_recommendations
    
    echo "🎯 Troubleshooting complete!"
    echo "If you need further assistance, check the container logs:"
    echo "  npm run docker:logs:app"
}

main "$@"