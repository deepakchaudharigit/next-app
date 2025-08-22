#!/bin/bash

# NPCL Dashboard Docker Startup Script
# Handles database initialization, migrations, and application startup

set -e

echo "🚀 Starting NPCL Dashboard initialization..."

# Function to wait for PostgreSQL to be ready
wait_for_postgres() {
    echo "⏳ Waiting for PostgreSQL to be ready..."
    
    # Extract database connection details from DATABASE_URL
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    echo "📊 Database connection details:"
    echo "   Host: $DB_HOST"
    echo "   Port: $DB_PORT"
    echo "   User: $DB_USER"
    echo "   Database: $DB_NAME"
    
    # Wait for PostgreSQL to accept connections
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
            echo "✅ PostgreSQL is ready!"
            return 0
        fi
        
        echo "   Attempt $attempt/$max_attempts: PostgreSQL not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ PostgreSQL failed to become ready after $max_attempts attempts"
    exit 1
}

# Function to test Prisma connection
test_prisma_connection() {
    echo "🔍 Testing Prisma client connection..."
    
    if node scripts/test-prisma-connection.js; then
        echo "✅ Prisma connection test passed!"
        return 0
    else
        echo "❌ Prisma connection test failed!"
        return 1
    fi
}

# Function to run database migrations
run_migrations() {
    echo "🔄 Setting up database schema..."
    
    # Generate Prisma client first
    echo "   Generating Prisma client..."
    npx prisma generate
    
    # Test Prisma connection
    echo "   Testing Prisma connection..."
    test_prisma_connection || return 1
    
    # Push schema to database (for development/docker setup)
    echo "   Pushing database schema..."
    max_attempts=3
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "     Attempt $attempt/$max_attempts..."
        if npx prisma db push --force-reset; then
            echo "✅ Database schema pushed successfully!"
            return 0
        fi
        
        echo "     Schema push failed, retrying..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo "❌ Failed to push schema after $max_attempts attempts"
    return 1
}

# Function to seed database if needed
seed_database() {
    echo "🌱 Seeding database..."
    
    # Always run seed script - it uses upsert so it's safe
    echo "   Running seed script..."
    if npm run db:seed; then
        echo "✅ Database seeded successfully!"
        return 0
    else
        echo "❌ Database seeding failed."
        return 1
    fi
}

# Function to start the application
start_application() {
    echo "🎯 Starting NPCL Dashboard application..."
    
    # Ensure .next directory exists with proper permissions
    echo "   Setting up .next directory permissions..."
    mkdir -p ./.next/cache ./.next/server ./.next/static
    chmod -R 777 ./.next
    
    # Run permission test
    if [ -f "./scripts/docker/test-permissions.sh" ]; then
        echo "   Running permission test..."
        bash ./scripts/docker/test-permissions.sh
    fi
    
    if [ "$NODE_ENV" = "development" ]; then
        echo "   Starting in development mode..."
        exec npm run dev
    else
        echo "   Starting in production mode..."
        exec node server.js
    fi
}

# Function to handle errors
handle_error() {
    echo "❌ Error occurred during startup: $1"
    echo "🔍 Troubleshooting tips:"
    echo "   1. Check if PostgreSQL container is running: docker-compose ps"
    echo "   2. Check PostgreSQL logs: docker-compose logs postgres"
    echo "   3. Verify environment variables are set correctly"
    echo "   4. Ensure DATABASE_URL points to the postgres service"
    exit 1
}

# Set up error handling
trap 'handle_error "Unexpected error"' ERR

# Main startup sequence
main() {
    echo "🏗️  NPCL Dashboard Docker Startup"
    echo "=================================="
    echo "Environment: $NODE_ENV"
    echo "Database URL: $DATABASE_URL"
    echo ""
    
    # Wait for PostgreSQL
    wait_for_postgres || handle_error "PostgreSQL connection failed"
    
    # Run migrations
    run_migrations || handle_error "Database migration failed"
    
    # Seed database if needed
    seed_database || handle_error "Database seeding failed"
    
    echo ""
    echo "🎉 Initialization completed successfully!"
    echo "=================================="
    echo ""
    
    # Start the application
    start_application
}

# Run main function
main "$@"