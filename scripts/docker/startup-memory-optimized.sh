#!/bin/bash
# Make this script executable: chmod +x scripts/docker/startup-memory-optimized.sh

# Memory-optimized development startup script for Docker
# Reduces memory usage and optimizes file watching

set -e

echo "🚀 Starting NPCL Dashboard in memory-optimized development mode..."
echo "Environment: $NODE_ENV"
echo "Node Memory Limit: $NODE_OPTIONS"
echo "Database URL: $DATABASE_URL"
echo ""

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if pg_isready -h postgres -p 5432 -U postgres >/dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    
    echo "   Attempt $attempt/$max_attempts: PostgreSQL not ready yet..."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ PostgreSQL failed to become ready after $max_attempts attempts"
    exit 1
fi

# Clean up any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "next-dev" || true
pkill -f "next dev" || true

# Generate Prisma client with memory optimization
echo "🔧 Generating Prisma client..."
NODE_OPTIONS="--max-old-space-size=1024" npx prisma generate

# Test database connection
echo "🔍 Testing database connection..."
if NODE_OPTIONS="--max-old-space-size=512" npx prisma db pull --schema=prisma/schema.prisma >/dev/null 2>&1; then
    echo "✅ Database connection successful!"
else
    echo "⚠️ Database connection test failed, but continuing..."
fi

# Push database schema if needed
echo "📊 Pushing database schema..."
NODE_OPTIONS="--max-old-space-size=512" npx prisma db push --accept-data-loss || echo "⚠️ Schema push failed, continuing..."

# Set memory-optimized environment variables
export NODE_OPTIONS="--max-old-space-size=3072 --max-semi-space-size=256 --optimize-for-size"
export UV_THREADPOOL_SIZE=4
export CHOKIDAR_USEPOLLING=false
export CHOKIDAR_INTERVAL=1000
export WATCHPACK_POLLING=false

# Start development server with memory optimization
echo "🎯 Starting Next.js development server with memory optimization..."
echo "📱 App will be available at: http://localhost:3000"
echo "💾 Memory limit: 2GB"
echo ""

exec npm run dev