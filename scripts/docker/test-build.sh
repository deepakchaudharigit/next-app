#!/bin/bash

# NPCL Dashboard Docker Build and Test Script
# This script builds and tests the Docker container to ensure everything works

set -e

echo "🐳 NPCL Dashboard Docker Build & Test"
echo "====================================="

# Function to cleanup on exit
cleanup() {
    echo "🧹 Cleaning up..."
    docker-compose down -v 2>/dev/null || true
}

# Set up cleanup trap
trap cleanup EXIT

# Step 1: Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose down -v 2>/dev/null || true
docker system prune -f 2>/dev/null || true

# Step 2: Build the application
echo "🔨 Building Docker containers..."
if ! docker-compose build --no-cache; then
    echo "❌ Docker build failed!"
    exit 1
fi

echo "✅ Docker build completed successfully!"

# Step 3: Start the services
echo "🚀 Starting services..."
if ! docker-compose up -d; then
    echo "❌ Failed to start services!"
    exit 1
fi

# Step 4: Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Step 5: Check service health
echo "🔍 Checking service health..."

# Check PostgreSQL
if ! docker-compose exec -T postgres pg_isready -U postgres -d npcl-auth-db-dev; then
    echo "❌ PostgreSQL is not ready!"
    docker-compose logs postgres
    exit 1
fi
echo "✅ PostgreSQL is healthy"

# Check Redis
if ! docker-compose exec -T redis redis-cli ping; then
    echo "❌ Redis is not ready!"
    docker-compose logs redis
    exit 1
fi
echo "✅ Redis is healthy"

# Step 6: Check application logs
echo "📋 Checking application startup logs..."
docker-compose logs app

# Step 7: Test application health endpoint
echo "🔍 Testing application health endpoint..."
sleep 30  # Give the app more time to start

max_attempts=10
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:3000/api/health 2>/dev/null; then
        echo "✅ Application health check passed!"
        break
    fi
    
    echo "   Attempt $attempt/$max_attempts: Health check failed, retrying..."
    sleep 10
    attempt=$((attempt + 1))
    
    if [ $attempt -gt $max_attempts ]; then
        echo "❌ Application health check failed after $max_attempts attempts!"
        echo "📋 Application logs:"
        docker-compose logs app
        exit 1
    fi
done

# Step 8: Test database connection
echo "🔍 Testing database connection from application..."
if ! docker-compose exec -T app npm run db:test-connection; then
    echo "❌ Database connection test failed!"
    docker-compose logs app
    exit 1
fi

echo "✅ Database connection test passed!"

# Step 9: Show final status
echo ""
echo "🎉 All tests passed successfully!"
echo "====================================="
echo "Services are running:"
echo "  - Application: http://localhost:3000"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop services: docker-compose down"
echo "To stop and clean: docker-compose down -v"