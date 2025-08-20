#!/bin/bash

# Make script executable
chmod +x "$0"

# Test database connection script
# This script helps debug database connectivity issues

set -e

echo "🔍 Testing database connection..."
echo "=================================="

# Parse DATABASE_URL
DB_URL="${DATABASE_URL:-postgresql://postgres:password@postgres:5432/npcl-auth-db-dev?schema=public}"
DB_HOST=$(echo "$DB_URL" | sed -E 's/.*@([^:]+):.*/\1/')
DB_PORT=$(echo "$DB_URL" | sed -E 's/.*:([0-9]+)\/.*/\1/')
DB_USER=$(echo "$DB_URL" | sed -E 's/.*:\/\/([^:]+):.*/\1/')
DB_NAME=$(echo "$DB_URL" | sed -E 's/.*\/([^?]+).*/\1/')

echo "Database URL: $DB_URL"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "User: $DB_USER"
echo "Database: $DB_NAME"
echo ""

# Test 1: Check if PostgreSQL server is responding
echo "Test 1: PostgreSQL server connectivity"
if pg_isready -h "$DB_HOST" -p "$DB_PORT"; then
    echo "✅ PostgreSQL server is responding"
else
    echo "❌ PostgreSQL server is not responding"
    exit 1
fi

# Test 2: Check if we can connect to the database
echo ""
echo "Test 2: Database connection test"
if PGPASSWORD="password" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Can connect to database"
else
    echo "❌ Cannot connect to database"
    echo "Trying to connect to postgres database instead..."
    if PGPASSWORD="password" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "SELECT 1;" >/dev/null 2>&1; then
        echo "✅ Can connect to postgres database"
        echo "ℹ️  Target database '$DB_NAME' might not exist yet"
    else
        echo "❌ Cannot connect to any database"
        exit 1
    fi
fi

# Test 3: List available databases
echo ""
echo "Test 3: Available databases"
PGPASSWORD="password" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "\\l" 2>/dev/null || echo "Could not list databases"

echo ""
echo "🎉 Database connection test completed!"