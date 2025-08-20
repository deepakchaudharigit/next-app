#!/bin/bash

# Make script executable
chmod +x "$0"

# NPCL Dashboard - Clean Docker Build Script
# Removes build artifacts and rebuilds Docker containers

set -e

echo "🧹 Cleaning up build artifacts..."

# Remove Next.js build artifacts
echo "   Removing .next directory..."
rm -rf .next

# Remove SWC cache
echo "   Removing .swc cache..."
rm -rf .swc

# Remove node_modules cache (optional - uncomment if needed)
# echo "   Removing node_modules..."
# rm -rf node_modules

echo "🐳 Stopping and removing existing containers..."
docker-compose down --remove-orphans

echo "🗑️  Removing Docker images..."
docker-compose down --rmi all --volumes --remove-orphans 2>/dev/null || true

echo "🔨 Building fresh Docker images..."
docker-compose build --no-cache

echo "🚀 Starting services..."
docker-compose up -d

echo "📋 Checking service status..."
docker-compose ps

echo ""
echo "✅ Clean build completed!"
echo "🔍 To view logs: docker-compose logs -f app"
echo "🌐 Application should be available at: http://localhost:3000"