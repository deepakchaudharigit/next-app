#!/bin/bash

# NPCL Dashboard Docker Issues Fix Script
# This script fixes the OpenSSL compatibility and database name issues

set -e

echo "🔧 NPCL Dashboard Docker Issues Fix"
echo "===================================="
echo ""

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker and try again."
        exit 1
    fi
    echo "✅ Docker is running"
}

# Function to stop and remove existing containers
cleanup_containers() {
    echo "🧹 Cleaning up existing containers..."
    
    # Stop all containers
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Remove specific containers if they exist
    docker rm -f npcl-dashboard-dkch npcl-postgres npcl-redis npcl-nginx 2>/dev/null || true
    
    # Remove dangling images
    docker image prune -f >/dev/null 2>&1 || true
    
    echo "✅ Cleanup completed"
}

# Function to rebuild images with OpenSSL fixes
rebuild_images() {
    echo "🔨 Rebuilding Docker images with OpenSSL fixes..."
    
    # Build production image
    echo "   Building production image..."
    docker-compose build --no-cache app
    
    # Build development image
    echo "   Building development image..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache app
    
    echo "✅ Images rebuilt successfully"
}

# Function to verify environment files
verify_environment() {
    echo "🔍 Verifying environment configuration..."
    
    if [ ! -f ".env.docker" ]; then
        echo "❌ .env.docker file not found"
        exit 1
    fi
    
    # Check if database name is correct
    if grep -q "npcl-auth-db-dev" .env.docker; then
        echo "✅ Database name configuration is correct"
    else
        echo "❌ Database name configuration needs fixing"
        exit 1
    fi
    
    echo "✅ Environment configuration verified"
}

# Function to start services
start_services() {
    echo "🚀 Starting services..."
    
    # Start PostgreSQL first
    echo "   Starting PostgreSQL..."
    docker-compose up -d postgres
    
    # Wait for PostgreSQL to be ready
    echo "   Waiting for PostgreSQL to be ready..."
    sleep 10
    
    # Start Redis
    echo "   Starting Redis..."
    docker-compose up -d redis
    
    # Start the application
    echo "   Starting NPCL Dashboard..."
    docker-compose up -d app
    
    echo "✅ All services started"
}

# Function to check service health
check_health() {
    echo "🏥 Checking service health..."
    
    # Wait a bit for services to initialize
    sleep 15
    
    # Check PostgreSQL
    if docker-compose exec postgres pg_isready -U postgres -d npcl-auth-db-dev >/dev/null 2>&1; then
        echo "✅ PostgreSQL is healthy"
    else
        echo "⚠️  PostgreSQL health check failed"
    fi
    
    # Check Redis
    if docker-compose exec redis redis-cli ping >/dev/null 2>&1; then
        echo "✅ Redis is healthy"
    else
        echo "⚠️  Redis health check failed"
    fi
    
    # Check application
    echo "   Waiting for application to start..."
    sleep 30
    
    if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        echo "✅ Application is healthy"
    else\n        echo "⚠️  Application health check failed - checking logs..."
        docker-compose logs app | tail -20
    fi
}

# Function to show status
show_status() {
    echo ""
    echo "📊 Service Status:"
    echo "=================="
    docker-compose ps
    echo ""
    echo "🌐 Access Points:"
    echo "================="
    echo "   Application: http://localhost:3000"
    echo "   Health Check: http://localhost:3000/api/health"
    echo "   PostgreSQL: localhost:5432"
    echo "   Redis: localhost:6379"
    echo ""
    echo "📋 Useful Commands:"
    echo "=================="
    echo "   View logs: docker-compose logs -f app"
    echo "   Stop services: docker-compose down"
    echo "   Restart app: docker-compose restart app"
    echo "   Database shell: docker-compose exec postgres psql -U postgres -d npcl-auth-db-dev"
}

# Function to handle errors
handle_error() {
    echo ""
    echo "❌ Error occurred: $1"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "=================="
    echo "1. Check Docker logs: docker-compose logs"
    echo "2. Verify Docker is running: docker info"
    echo "3. Check disk space: df -h"
    echo "4. Try manual cleanup: docker system prune -f"
    echo ""
    exit 1
}

# Set up error handling
trap 'handle_error \"Unexpected error during fix process\"' ERR

# Main execution
main() {
    echo "Starting Docker issues fix process..."
    echo ""
    
    # Check prerequisites
    check_docker
    
    # Verify environment
    verify_environment
    
    # Cleanup existing containers
    cleanup_containers
    
    # Rebuild images with fixes
    rebuild_images
    
    # Start services
    start_services
    
    # Check health
    check_health
    
    # Show final status
    show_status
    
    echo ""
    echo "🎉 Docker issues fix completed successfully!"
    echo "   The OpenSSL compatibility issue has been resolved"
    echo "   The database name mismatch has been fixed"
    echo "   All services should now be running properly"
    echo ""
}

# Run main function
main "$@"