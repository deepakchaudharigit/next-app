#!/bin/bash

# Script to run Prisma Studio from host machine pointing to Docker database
# This script temporarily uses the Docker database connection

echo "🎯 Starting Prisma Studio from host machine..."
echo "📊 Connecting to Docker PostgreSQL database..."

# Check if Docker containers are running
if ! docker ps | grep -q "npcl-postgres"; then
    echo "❌ PostgreSQL Docker container is not running!"
    echo "Please start your Docker containers first:"
    echo "   docker-compose up -d"
    exit 1
fi

# Backup current .env if it exists
if [ -f ".env" ]; then
    echo "📦 Backing up current .env to .env.backup"
    cp .env .env.backup
fi

# Create temporary .env with Docker database connection (using localhost since we're on host)
echo "🔄 Setting up temporary environment for host connection..."
cat > .env << EOF
# Temporary environment for Prisma Studio from host
DATABASE_URL="postgresql://postgres:SecurePassword2025@localhost:5432/npcl-auth-db-dev?schema=public"
NEXTAUTH_SECRET="npcl-dashboard-super-secret-jwt-key-2024-production-ready-secure-random-string-ba52b3778b35aa7e8dc32e68cac112403ae85635a43eeec0e8048e7289237042"
NEXTAUTH_URL="http://localhost:3000"
EOF

# Function to restore .env on exit
cleanup() {
    echo ""
    echo "🔄 Restoring original environment..."
    if [ -f ".env.backup" ]; then
        mv .env.backup .env
        echo "✅ Original .env restored"
    else
        rm -f .env
        echo "✅ Temporary .env removed"
    fi
}

# Set trap to restore .env on script exit
trap cleanup EXIT INT TERM

# Test database connection
echo "🔍 Testing database connection..."
if npx prisma db pull --schema=prisma/schema.prisma > /dev/null 2>&1; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed!"
    echo "Please ensure:"
    echo "   1. Docker containers are running: docker-compose ps"
    echo "   2. PostgreSQL port 5432 is accessible: docker-compose logs postgres"
    cleanup
    exit 1
fi

# Start Prisma Studio
echo "🚀 Starting Prisma Studio on http://localhost:5555"
echo "📱 Studio will open in your default browser"
echo "Press Ctrl+C to stop..."
echo ""

npx prisma studio --schema=prisma/schema.prisma --hostname 0.0.0.0 --port 5555