#!/bin/bash

echo "Starting NPCL Dashboard with Docker..."
echo ""
echo "This will start:"
echo "- PostgreSQL database"
echo "- Redis cache"
echo "- Next.js application"
echo ""

# Stop any existing containers
docker-compose down

# Start the services
docker-compose up --build

echo ""
echo "Application should be available at: http://localhost:3000"
echo "Prisma Studio available at: http://localhost:5555"