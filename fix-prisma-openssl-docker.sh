#!/bin/bash

# NPCL Dashboard - Complete Prisma OpenSSL Docker Fix
# This script fixes the OpenSSL compatibility issues by switching to Debian-based images

set -e

echo "🛠️  NPCL Dashboard - Prisma OpenSSL Docker Fix"
echo "=============================================="
echo ""
echo "This script will:"
echo "1. Stop and clean existing containers"
echo "2. Switch to Debian-based Docker images"
echo "3. Rebuild containers with proper OpenSSL support"
echo "4. Test the application"
echo ""

# Function to stop and clean existing containers
cleanup_containers() {
    echo "🧹 Cleaning up existing containers and volumes..."
    
    # Stop all containers
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v 2>/dev/null || true
    docker-compose down -v 2>/dev/null || true
    
    # Remove any orphaned containers
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Clean up Docker system
    echo "  Pruning Docker system..."
    docker system prune -f
    
    # Remove any existing NPCL images to force rebuild
    echo "  Removing existing NPCL images..."
    docker images | grep npcl | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
    
    echo "✅ Cleanup completed"
    echo ""
}

# Function to verify environment files
verify_environment_files() {
    echo "📋 Verifying environment configuration..."
    
    # Check if .env.docker exists
    if [ ! -f ".env.docker" ]; then
        echo "❌ .env.docker file missing"
        exit 1
    fi
    
    echo "✅ Environment files verified"
    echo ""
}

# Function to build and start containers
build_and_start() {
    echo "🚀 Building and starting containers with Debian-based images..."
    
    # Build the development image with no cache to ensure fresh build
    echo "  Building development image (this may take a few minutes)..."
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
            echo "  📋 Check logs: docker-compose logs postgres"
            exit 1
        fi
        echo "    PostgreSQL not ready yet... ($counter/$timeout seconds)"
    done
    echo "  ✅ PostgreSQL is ready"
    
    # Wait for app container to be running
    echo "  Waiting for app container..."
    timeout=120
    counter=0
    while ! docker ps | grep -q "npcl-dashboard-dkch"; do
        sleep 2
        counter=$((counter + 2))
        if [ $counter -ge $timeout ]; then
            echo "  ❌ App container failed to start within $timeout seconds"
            echo "  📋 Check logs: docker-compose logs app"
            exit 1
        fi
        echo "    App container not ready yet... ($counter/$timeout seconds)"
    done
    echo "  ✅ App container is running"
    
    echo ""
}

# Function to test Prisma operations
test_prisma_operations() {
    echo "🔧 Testing Prisma operations..."
    
    # Wait a bit for the container to fully initialize
    sleep 10
    
    # Test Prisma generate
    echo "  Testing Prisma generate..."
    if docker exec npcl-dashboard-dkch npx prisma generate; then
        echo "  ✅ Prisma generate successful"
    else
        echo "  ❌ Prisma generate failed"
        echo "  📋 Check logs: docker-compose logs app"
        return 1
    fi
    
    # Test database connection
    echo "  Testing database connection..."
    if docker exec npcl-dashboard-dkch npm run db:test-connection; then
        echo "  ✅ Database connection successful"
    else
        echo "  ❌ Database connection failed"
        echo "  📋 Check logs: docker-compose logs app"
        return 1
    fi
    
    echo "✅ All Prisma operations successful"
    echo ""
}

# Function to verify the application is working
verify_application() {
    echo "🎯 Verifying application..."
    
    # Wait for the app to fully start
    echo "  Waiting for application to start..."
    timeout=60
    counter=0
    while ! curl -f http://localhost:3000/api/health >/dev/null 2>&1; do
        sleep 2
        counter=$((counter + 2))
        if [ $counter -ge $timeout ]; then
            echo "  ❌ Health endpoint not responding within $timeout seconds"
            echo "  📋 Check logs: docker-compose logs app"
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
    echo "🎉 Prisma OpenSSL Fix Applied Successfully!"
    echo "=========================================="
    echo ""
    echo "✅ What was fixed:"
    echo "  - Switched from Alpine Linux to Debian-based Docker images"
    echo "  - Resolved OpenSSL 1.1 compatibility issues"
    echo "  - Updated Prisma engine configuration for Debian"
    echo "  - Cleaned and rebuilt all containers"
    echo "  - Verified database connection and Prisma operations"
    echo ""
    echo "🔗 Access your application:"
    echo "  - Main app: http://localhost:3000"
    echo "  - Health check: http://localhost:3000/api/health"
    echo "  - Database admin: http://localhost:8080 (run: docker-compose --profile dev-tools up -d)"
    echo ""
    echo "📋 Useful commands:"
    echo "  - View app logs: docker-compose logs -f app"
    echo "  - View all logs: docker-compose logs -f"
    echo "  - Stop containers: docker-compose down"
    echo "  - Restart: docker-compose restart"
    echo "  - Shell into app: docker exec -it npcl-dashboard-dkch bash"
    echo ""
    echo "💡 If you encounter issues in the future:"
    echo "  1. Check logs: docker-compose logs app"
    echo "  2. Restart containers: docker-compose restart"
    echo "  3. Full rebuild: docker-compose down -v && docker-compose up --build"
    echo ""
    echo "🎯 The OpenSSL compatibility issue has been resolved!"
}

# Function to handle errors
handle_error() {
    echo ""
    echo "❌ Error occurred during fix process"
    echo "=================================="
    echo ""
    echo "🔍 Troubleshooting steps:"
    echo "  1. Check container logs: docker-compose logs app"
    echo "  2. Check PostgreSQL logs: docker-compose logs postgres"
    echo "  3. Verify containers are running: docker ps"
    echo "  4. Check Docker system: docker system df"
    echo ""
    echo "📋 Current container status:"
    docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}" 2>/dev/null || echo "Cannot list containers"
    echo ""
    echo "🔄 To retry the fix:"
    echo "  bash fix-prisma-openssl-docker.sh"
    
    exit 1
}

# Set up error handling
trap handle_error ERR

# Main execution
main() {
    echo "This script will fix the Prisma OpenSSL compatibility issues."
    echo "It will stop existing containers, clean up, and rebuild with Debian-based images."
    echo ""
    
    read -p "Continue? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
    
    echo ""
    
    cleanup_containers
    verify_environment_files
    build_and_start
    wait_for_services
    test_prisma_operations
    verify_application
    show_final_status
}

main "$@"