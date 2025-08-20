#!/bin/bash

echo "🏥 NPCL Dashboard Health Check"
echo "============================="

# Check if containers are running
echo "1. Container Status:"
if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(npcl-postgres|npcl-dashboard-dkch|npcl-redis)"; then
    echo "✅ Containers are running"
else
    echo "❌ Some containers are not running"
    echo "Run: docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps"
fi

echo ""
echo "2. Network Connectivity:"

# Test PostgreSQL
if docker exec npcl-dashboard-dkch pg_isready -h postgres -p 5432 >/dev/null 2>&1; then
    echo "✅ PostgreSQL is reachable"
else
    echo "❌ PostgreSQL is not reachable"
fi

# Test Redis
if docker exec npcl-dashboard-dkch nc -z redis 6379 >/dev/null 2>&1; then
    echo "✅ Redis is reachable"
else
    echo "❌ Redis is not reachable"
fi

echo ""
echo "3. Application Health:"

# Test app health endpoint
if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "✅ Application health endpoint is responding"
else
    echo "❌ Application health endpoint is not responding"
    echo "   App might still be starting up..."
fi

echo ""
echo "4. Database Connection:"

# Test database connection
if docker exec npcl-dashboard-dkch npx prisma db execute --stdin <<< "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Database connection is working"
else
    echo "❌ Database connection failed"
fi

echo ""
echo "5. Port Accessibility:"

# Check if ports are accessible from host
for port in 3000 5432 6379; do
    if nc -z localhost $port 2>/dev/null; then
        echo "✅ Port $port is accessible"
    else
        echo "❌ Port $port is not accessible"
    fi
done

echo ""
echo "🎯 Quick Access URLs:"
echo "   Application: http://localhost:3000"
echo "   Adminer (if enabled): http://localhost:8080"
echo "   Mailhog (if enabled): http://localhost:8025"

echo ""
echo "Health check completed!"