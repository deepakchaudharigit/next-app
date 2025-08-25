#!/bin/bash

# Script to run Prisma Studio with Docker environment variables
# This ensures the correct environment file is used inside the container

echo "🎯 Starting Prisma Studio with Docker environment..."

# Check if .env.docker exists
if [ ! -f ".env.docker" ]; then
    echo "❌ .env.docker file not found!"
    echo "Please ensure .env.docker exists in the project root."
    exit 1
fi

# Backup current .env if it exists
if [ -f ".env" ]; then
    echo "📦 Backing up current .env to .env.backup"
    cp .env .env.backup
fi

# Copy .env.docker to .env temporarily
echo "🔄 Using .env.docker as environment source"
cp .env.docker .env

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

# Start Prisma Studio
echo "🚀 Starting Prisma Studio on http://0.0.0.0:5555"
echo "📱 Access it at: http://localhost:5555"
echo "Press Ctrl+C to stop..."
echo ""

npx prisma studio --schema=prisma/schema.prisma --hostname 0.0.0.0 --port 5555