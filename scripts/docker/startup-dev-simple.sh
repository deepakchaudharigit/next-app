#!/bin/bash

# NPCL Dashboard Development Startup Script
# Simplified version for development with hot reloading

set -e

echo "🚀 Starting NPCL Dashboard in development mode..."

# Function to wait for PostgreSQL
wait_for_postgres() {
    echo "⏳ Waiting for PostgreSQL..."
    
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
            echo "✅ PostgreSQL is ready!"
            return 0
        fi
        
        echo "   Attempt $attempt/$max_attempts: Waiting for PostgreSQL..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ PostgreSQL failed to become ready"
    exit 1
}

# Function to setup database
setup_database() {
    echo "🔄 Setting up database..."
    
    # Generate Prisma client
    echo "   Generating Prisma client..."
    npx prisma generate
    
    # Push schema (development mode)
    echo "   Pushing database schema..."
    npx prisma db push --force-reset
    
    # Seed database
    echo "   Seeding database..."
    npm run db:seed || echo "⚠️  Seeding failed, continuing..."
    
    echo "✅ Database setup complete!"
}

# Main function
main() {
    echo "🏗️  NPCL Dashboard Development Startup"
    echo "====================================="
    echo "Environment: $NODE_ENV"
    echo "Database URL: $DATABASE_URL"
    echo ""
    
    # Wait for dependencies
    wait_for_postgres
    
    # Setup database
    setup_database
    
    echo ""
    echo "🎉 Starting development server..."
    echo "================================="
    echo ""
    
    # Start development server with hot reloading
    exec npm run dev
}

# Run main function
main "$@"