#!/bin/bash

echo "🔧 NPCL Dashboard Docker Fix and Restart"
echo "========================================"

# Stop all containers
echo "1. Stopping all containers..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# Remove volumes to start fresh
echo "2. Removing volumes for fresh start..."
docker volume rm npcl_postgres_dev_data 2>/dev/null || echo "   Volume already removed or doesn't exist"

# Rebuild containers
echo "3. Rebuilding containers..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache

# Start with debug enabled
echo "4. Starting containers with debug enabled..."
DEBUG=true docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

echo ""
echo "🎉 Restart completed!"
echo ""
echo "If you still have issues, check:"
echo "1. Docker Desktop is running"
echo "2. No other services are using port 5432"
echo "3. .env.docker file exists and has correct values"