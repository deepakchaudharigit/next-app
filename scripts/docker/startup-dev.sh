#!/bin/bash

# ======================================
# NPCL Dashboard Docker Development Startup Script
#
# This script handles database initialization and development server startup.
# It waits for the PostgreSQL container to be ready, applies the Prisma schema,
# and seeds the database before starting the Next.js development server.
# ======================================

# Enable error handling but don't exit immediately
set +e

# Function to wait for PostgreSQL to be ready
wait_for_postgres() {
  echo "⏳ Waiting for PostgreSQL to be ready..."

  # Parse DATABASE_URL more reliably
  # Format: postgresql://user:password@host:port/database?schema=public
  local DB_URL="$DATABASE_URL"
  local DB_HOST=$(echo "$DB_URL" | sed -E 's/.*@([^:]+):.*/\1/')
  local DB_PORT=$(echo "$DB_URL" | sed -E 's/.*:([0-9]+)\/.*/\1/')
  local DB_USER=$(echo "$DB_URL" | sed -E 's/.*:\/\/([^:]+):.*/\1/')
  local DB_NAME=$(echo "$DB_URL" | sed -E 's/.*\/([^?]+).*/\1/')

  echo "📊 Database connection details:"
  echo "   Host: $DB_HOST"
  echo "   Port: $DB_PORT"
  echo "   User: $DB_USER"
  echo "   Database: $DB_NAME"
  echo "   Full URL: $DATABASE_URL"

  # Wait loop with clear retry count and timeout
  max_attempts=30
  attempt=1

  # Check if PostgreSQL server is ready (not specific database)
  until pg_isready -h "$DB_HOST" -p "$DB_PORT" >/dev/null 2>&1; do
    echo "   Attempt $attempt/$max_attempts: PostgreSQL not ready yet..."
    
    # Add more detailed debugging on every 5th attempt
    if [ $((attempt % 5)) -eq 0 ]; then
      echo "   🔍 Debug info:"
      echo "      - Checking if host $DB_HOST is reachable..."
      nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null && echo "      ✅ Port $DB_PORT is open" || echo "      ❌ Port $DB_PORT is not reachable"
      echo "      - PostgreSQL container logs (last 5 lines):"
      docker logs npcl-postgres --tail 5 2>/dev/null || echo "      Could not fetch container logs"
    fi
    
    sleep 2
    attempt=$((attempt + 1))
    if [ $attempt -gt $max_attempts ]; then
      echo "❌ PostgreSQL failed to become ready after $max_attempts attempts"
      echo "🔍 Final debug information:"
      echo "   - DATABASE_URL: $DATABASE_URL"
      echo "   - Parsed host: $DB_HOST"
      echo "   - Parsed port: $DB_PORT"
      echo "   - Container network: $(hostname -i 2>/dev/null || echo 'unknown')"
      exit 1
    fi
  done

  echo "✅ PostgreSQL is ready!"
  return 0
}

# Function to setup development database
setup_dev_database() {
  echo "🔄 Setting up development database..."

  # Set Prisma environment variables for better OpenSSL detection
  export PRISMA_QUERY_ENGINE_LIBRARY=/app/node_modules/.prisma/client/libquery_engine-linux-musl.so.node
  export PRISMA_QUERY_ENGINE_BINARY=/app/node_modules/.prisma/client/query-engine-linux-musl
  export OPENSSL_CONF=/dev/null

  # Generate Prisma client
  echo "  Generating Prisma client..."
  if ! npx prisma generate; then
    echo "❌ Prisma client generation failed."
    echo "⚠️  This might cause issues with the application."
  else
    echo "✅ Prisma client generated successfully!"
  fi

  # Push database schema with retries (for development)
  echo "  Pushing database schema..."
  for i in 1 2 3; do
    echo "    Attempt $i/3..."
    if npx prisma db push --force-reset; then
      echo "✅ Database schema pushed successfully!"
      break
    else
      echo "❌ Attempt $i failed, retrying..."
      sleep 5
    fi
    
    if [ $i -eq 3 ]; then
      echo "❌ All attempts failed. Continuing without DB push..."
      echo "🔍 Debug: Checking Prisma engine files..."
      ls -la /app/node_modules/.prisma/client/ || echo "Prisma client directory not found"
      echo "⚠️  Database schema push failed - the application might not work correctly."
      break
    fi
  done

  # Seed database
  echo "  Seeding database..."
  if ! npx tsx prisma/seed.ts; then
    echo "❌ Database seeding failed. Trying alternative method..."
    # Try with ts-node as fallback
    if ! npx ts-node --esm prisma/seed.ts; then
      echo "❌ Database seeding failed with both tsx and ts-node."
      echo "⚠️  Continuing without seeding - you can seed manually later."
    else
      echo "✅ Database seeded successfully with ts-node!"
    fi
  else
    echo "✅ Database seeded successfully with tsx!"
  fi

  echo "✅ Development database setup completed"
}

# Function to start development server
start_dev_server() {
  echo "🎯 Starting development server..."
  echo "  Hot reloading enabled"
  echo "  Access the application at: http://localhost:3000"
  echo ""

  # The 'exec' command replaces the current process with the next one,
  # ensuring that signals (like Ctrl+C) are correctly handled by npm.
  exec npm run dev
}

# Function to handle errors and provide troubleshooting tips
handle_error() {
  echo ""
  echo "❌ Error occurred during development startup: $1"
  echo "======================================"
  echo "🔍 Troubleshooting tips:"
  echo "  1. Verify the DATABASE_URL in your .env.docker file."
  echo "  2. Ensure the postgres service is defined correctly in docker-compose.yml."
  echo "  3. Check the logs for the postgres container: 'docker logs npcl-postgres'."
  echo "  4. Try a clean rebuild and restart: 'docker compose down -v && npm run docker:dev'."
  exit 1
}

# Main startup sequence
main() {
  echo "🏗️  NPCL Dashboard Development Startup"
  echo "======================================"
  echo "Environment: development"
  echo "Database URL: $DATABASE_URL"
  echo ""
  
  # Run environment debug if needed
  if [ "$DEBUG" = "true" ]; then
    echo "🔍 Running environment debug..."
    chmod +x ./scripts/docker/debug-env.sh
    ./scripts/docker/debug-env.sh
    echo ""
  fi
  
  # Wait for PostgreSQL
  wait_for_postgres
  
  # Setup development database
  setup_dev_database
  
  echo ""
  echo "🎉 Development initialization completed!"
  echo "======================================"
  echo ""
  
  # Start development server
  start_dev_server
}

# Run the main function
main
