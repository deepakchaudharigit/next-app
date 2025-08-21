#!/bin/bash

# NPCL Dashboard Development Startup Script
# Simplified version for development with hot reloading

set -e

echo "🚀 Starting NPCL Dashboard in development mode..."

# Function to wait for PostgreSQL
wait_for_postgres() {
    echo "⏳ Waiting for PostgreSQL..."
    
    # Extract database connection details from DATABASE_URL
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    # Fallback to environment variables if parsing fails
    DB_HOST=${DB_HOST:-postgres}
    DB_PORT=${DB_PORT:-5432}
    DB_USER=${DB_USER:-postgres}
    DB_NAME=${DB_NAME:-npcl-auth-db-dev}
    
    echo "   Connecting to: $DB_HOST:$DB_PORT as $DB_USER to database $DB_NAME"
    
    max_attempts=60  # Increased timeout
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
            echo "✅ PostgreSQL is ready!"
            return 0
        fi
        
        echo "   Attempt $attempt/$max_attempts: Waiting for PostgreSQL..."
        sleep 3
        attempt=$((attempt + 1))
    done
    
    echo "❌ PostgreSQL failed to become ready after $max_attempts attempts"
    echo "   Database URL: $DATABASE_URL"
    exit 1
}

# Function to setup database
setup_database() {
    echo "🔄 Setting up database..."
    
    # Generate Prisma client
    echo "   Generating Prisma client..."
    if ! npx prisma generate; then
        echo "❌ Failed to generate Prisma client"
        exit 1
    fi
    
    # Check if database exists and has tables
    echo "   Checking database state..."
    if npx prisma db push --accept-data-loss >/dev/null 2>&1; then
        echo "   ✅ Database schema updated"
    else
        echo "   ⚠️  Database push failed, trying reset..."
        npx prisma db push --force-reset --accept-data-loss || {
            echo "   ❌ Database reset failed"
            exit 1
        }
    fi
    
    # Seed database
    echo "   Seeding database..."
    if npm run db:seed; then
        echo "   ✅ Database seeded successfully"
    else
        echo "   ⚠️  Seeding failed, continuing without seed data..."
    fi
    
    echo "✅ Database setup complete!"
}

# Function to check Node.js and npm
check_environment() {
    echo "🔍 Checking environment..."
    echo "   Node.js version: $(node --version)"
    echo "   npm version: $(npm --version)"
    echo "   Working directory: $(pwd)"
    echo "   User: $(whoami)"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        echo "❌ package.json not found in $(pwd)"
        exit 1
    fi
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "⚠️  node_modules not found, running npm install..."
        npm install
    fi
}

# Main function
main() {
    echo "🏗️  NPCL Dashboard Development Startup"
    echo "====================================="
    echo "Environment: $NODE_ENV"
    echo "Database URL: $DATABASE_URL"
    echo "NextAuth URL: $NEXTAUTH_URL"
    echo ""
    
    # Check environment
    check_environment
    
    # Wait for dependencies
    wait_for_postgres
    
    # Setup database
    setup_database
    
    echo ""
    echo "🎉 Starting development server..."
    echo "================================="
    echo "Server will be available at: http://localhost:3000"
    echo "Health check endpoint: http://localhost:3000/api/health"
    echo ""
    
    # Start development server with hot reloading
    exec npm run dev
}

# Handle signals gracefully
trap 'echo "\n🛑 Shutting down gracefully..."; exit 0' SIGTERM SIGINT

# Run main function
main "$@"