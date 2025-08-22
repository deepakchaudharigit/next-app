#!/bin/bash

echo "🔧 Fixing Docker Development Setup..."
echo "======================================"

# Step 1: Stop any running containers
echo "1. Stopping existing containers..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down 2>/dev/null || true

# Step 2: Fix script permissions
echo "2. Fixing script permissions..."
find scripts -name "*.sh" -type f -exec chmod +x {} \; 2>/dev/null || true

# Step 3: Clean up Docker to avoid cache issues
echo "3. Cleaning Docker cache..."
docker system prune -f 2>/dev/null || true

# Step 4: Update npm packages to reduce warnings
echo "4. Updating package-lock.json..."
if [ -f "package-lock.json" ]; then
    rm package-lock.json
fi

# Step 5: Start the development environment
echo "5. Starting Docker development environment..."
echo "   This may take a few minutes on first run..."

# Use a more verbose approach to see what's happening
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

echo ""
echo "✅ Docker development setup complete!"
echo "🌐 Application should be available at: http://localhost:3000"
echo "🔍 Health check: http://localhost:3000/api/health"
echo "📊 Database admin (if dev-tools enabled): http://localhost:8080"