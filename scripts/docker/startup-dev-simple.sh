#!/bin/bash

# Simple development startup script for Docker
# Skips complex initialization and just starts the dev server

set -e

echo "🚀 Starting NPCL Dashboard in development mode..."
echo "Environment: $NODE_ENV"
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

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Test database connection
echo "🔍 Testing database connection..."
if npx prisma db pull --schema=prisma/schema.prisma >/dev/null 2>&1; then
    echo "✅ Database connection successful!"
else
    echo "⚠️ Database connection test failed, but continuing..."
fi

# Start development server
echo "🎯 Starting Next.js development server..."
echo "📱 App will be available at: http://localhost:3000"
echo ""
exec npm run dev