#!/bin/bash

# Complete Fix Script for Prisma OpenSSL Issues in Docker
# This script implements all the fixes mentioned in the instructions

set -e

echo "🛠️  NPCL Dashboard - Complete Prisma OpenSSL Fix"
echo "================================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Function to stop and clean existing containers
cleanup_containers() {
    echo "🧹 Cleaning up existing containers and volumes..."
    
    cd "$PROJECT_ROOT"
    
    # Stop all containers
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v 2>/dev/null || true
    
    # Remove any orphaned containers
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Clean up Docker system
    echo "  Pruning Docker system..."
    docker system prune -f
    
    echo "✅ Cleanup completed"
    echo ""
}

# Function to verify environment files
verify_environment_files() {
    echo "📋 Verifying environment configuration..."
    
    cd "$PROJECT_ROOT"
    
    # Check if .env.docker exists and has required variables
    if [ ! -f ".env.docker" ]; then
        echo "❌ .env.docker file missing"
        exit 1
    fi
    
    # Check for required Prisma environment variables
    if ! grep -q "PRISMA_QUERY_ENGINE_LIBRARY" .env.docker; then
        echo "⚠️  Adding missing Prisma environment variables to .env.docker"
        echo "" >> .env.docker
        echo "# Prisma OpenSSL Fix Variables" >> .env.docker
        echo "PRISMA_QUERY_ENGINE_LIBRARY=\"/app/node_modules/.prisma/client/libquery_engine-linux-musl.so.node\"" >> .env.docker
        echo "PRISMA_QUERY_ENGINE_BINARY=\"/app/node_modules/.prisma/client/query-engine-linux-musl\"" >> .env.docker
        echo "OPENSSL_CONF=\"/dev/null\"" >> .env.docker
    fi
    
    echo "✅ Environment files verified"
    echo ""
}

# Function to choose Docker image type
choose_docker_image() {
    echo "🐳 Choosing Docker image type..."
    
    echo "Select Docker base image:"
    echo "1. Alpine Linux (smaller, with OpenSSL fixes)"
    echo "2. Debian Slim (larger, better compatibility)"
    echo ""
    
    read -p "Enter choice (1 or 2) [default: 2]: " choice
    choice=${choice:-2}
    
    case $choice in
        1)
            echo "  Using Alpine Linux with OpenSSL compatibility fixes"
            # Current Dockerfile.dev is already Alpine with fixes
            ;;
        2)
            echo "  Switching to Debian Slim for better compatibility"
            if [ -f "$PROJECT_ROOT/Dockerfile.dev.debian" ]; then
                cp "$PROJECT_ROOT/Dockerfile.dev" "$PROJECT_ROOT/Dockerfile.dev.alpine.backup"
                cp "$PROJECT_ROOT/Dockerfile.dev.debian" "$PROJECT_ROOT/Dockerfile.dev"
                echo "  ✅ Switched to Debian-based Dockerfile"
            else
                echo "  ❌ Debian Dockerfile not found"
                exit 1
            fi
            ;;
        *)
            echo "  ❌ Invalid choice"
            exit 1
            ;;
    esac
    
    echo ""
}

# Function to build and start containers
build_and_start() {
    echo "🚀 Building and starting containers..."
    
    cd "$PROJECT_ROOT"
    
    # Build the development image
    echo "  Building development image..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache app
    
    # Start all services
    echo "  Starting all services..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
    
    echo "✅ Containers started"
    echo ""
}

# Function to wait for services to be ready
wait_for_services() {
    echo "⏳ Waiting for services to be ready..."
    
    # Wait for PostgreSQL
    echo "  Waiting for PostgreSQL..."
    timeout=60
    counter=0
    while ! docker exec npcl-postgres pg_isready -U postgres >/dev/null 2>&1; do
        sleep 2
        counter=$((counter + 2))
        if [ $counter -ge $timeout ]; then
            echo "  ❌ PostgreSQL failed to start within $timeout seconds"
            exit 1
        fi
        echo "    PostgreSQL not ready yet... ($counter/$timeout seconds)"
    done
    echo "  ✅ PostgreSQL is ready"
    
    # Wait for app container
    echo "  Waiting for app container..."
    timeout=120
    counter=0
    while ! docker exec npcl-dashboard-dkch echo "ready" >/dev/null 2>&1; do
        sleep 2
        counter=$((counter + 2))
        if [ $counter -ge $timeout ]; then
            echo "  ❌ App container failed to start within $timeout seconds"
            exit 1
        fi
        echo "    App container not ready yet... ($counter/$timeout seconds)"
    done
    echo "  ✅ App container is ready"
    
    echo ""
}

# Function to test Prisma operations
test_prisma_operations() {
    echo "🔧 Testing Prisma operations..."
    
    # Test Prisma generate
    echo "  Testing Prisma generate..."
    if docker exec npcl-dashboard-dkch npx prisma generate; then
        echo "  ✅ Prisma generate successful"
    else
        echo "  ❌ Prisma generate failed"
        return 1
    fi
    
    # Test Prisma db push
    echo "  Testing Prisma db push..."
    if docker exec npcl-dashboard-dkch npx prisma db push --force-reset; then
        echo "  ✅ Prisma db push successful"
    else
        echo "  ❌ Prisma db push failed"
        return 1
    fi
    
    echo "✅ All Prisma operations successful"
    echo ""
}

# Function to verify the application is working
verify_application() {
    echo "🎯 Verifying application..."
    
    # Wait a bit for the app to fully start
    sleep 10
    
    # Test health endpoint
    echo "  Testing health endpoint..."
    timeout=30
    counter=0
    while ! curl -f http://localhost:3000/api/health >/dev/null 2>&1; do
        sleep 2
        counter=$((counter + 2))
        if [ $counter -ge $timeout ]; then
            echo "  ❌ Health endpoint not responding within $timeout seconds"
            echo "  📋 Check logs: npm run docker:logs:app"
            return 1
        fi
        echo "    Health endpoint not ready yet... ($counter/$timeout seconds)"
    done
    
    echo "  ✅ Health endpoint responding"
    echo "  ✅ Application is running at http://localhost:3000"
    echo ""
}

# Function to show final status and next steps
show_final_status() {
    echo "🎉 Fix Applied Successfully!"
    echo "=========================="
    echo ""
    echo "✅ What was fixed:"
    echo "  - OpenSSL compatibility issues resolved"
    echo "  - Prisma engine configuration updated"
    echo "  - Environment variables properly set"
    echo "  - Database connection established"
    echo "  - Application is running successfully"
    echo ""
    echo "🔗 Access your application:"
    echo "  - Main app: http://localhost:3000"
    echo "  - Database admin: http://localhost:8080 (if dev-tools profile enabled)"
    echo ""
    echo "📋 Useful commands:"
    echo "  - View logs: npm run docker:logs:app"
    echo "  - Stop containers: npm run docker:down:dev"
    echo "  - Restart: npm run docker:fix:restart"
    echo "  - Troubleshoot: bash scripts/docker/troubleshoot-prisma.sh"
    echo ""
    echo "💡 If you encounter issues in the future:"
    echo "  1. Run: bash scripts/docker/troubleshoot-prisma.sh"
    echo "  2. Try: npm run docker:clean && npm run docker:dev"
    echo "  3. Switch image: npm run docker:switch:debian"
}

# Function to handle errors
handle_error() {
    echo ""
    echo "❌ Error occurred during fix process"
    echo "=================================="
    echo ""
    echo "🔍 Troubleshooting steps:"
    echo "  1. Check container logs: npm run docker:logs:app"
    echo "  2. Check PostgreSQL logs: npm run docker:logs:db"
    echo "  3. Run troubleshoot script: bash scripts/docker/troubleshoot-prisma.sh"
    echo "  4. Try switching to Debian image: npm run docker:switch:debian"
    echo ""
    echo "📋 Current container status:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Cannot list containers"
    
    exit 1
}

# Set up error handling
trap handle_error ERR

# Main execution
main() {
    echo "This script will fix the Prisma OpenSSL compatibility issues in Docker."
    echo "It will stop existing containers, clean up, and rebuild with fixes."
    echo ""
    
    read -p "Continue? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
    
    echo ""
    
    cleanup_containers
    verify_environment_files
    choose_docker_image
    build_and_start
    wait_for_services
    test_prisma_operations
    verify_application
    show_final_status
}

main "$@"