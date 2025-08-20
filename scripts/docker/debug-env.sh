#!/bin/bash

echo "🔍 Environment Variables Debug"
echo "=============================="

echo "DATABASE_URL: ${DATABASE_URL:-'NOT SET'}"
echo "NODE_ENV: ${NODE_ENV:-'NOT SET'}"
echo "NEXTAUTH_URL: ${NEXTAUTH_URL:-'NOT SET'}"
echo "NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:0:10}... (truncated)"

echo ""
echo "PostgreSQL Environment Variables:"
echo "POSTGRES_DB: ${POSTGRES_DB:-'NOT SET'}"
echo "POSTGRES_USER: ${POSTGRES_USER:-'NOT SET'}"
echo "POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:0:3}... (truncated)"

echo ""
echo "Container Information:"
echo "Hostname: $(hostname)"
echo "Container IP: $(hostname -i 2>/dev/null || echo 'unknown')"

echo ""
echo "Network Connectivity Test:"
echo "Ping postgres container:"
ping -c 1 postgres 2>/dev/null && echo "✅ Can reach postgres container" || echo "❌ Cannot reach postgres container"

echo ""
echo "DNS Resolution:"
nslookup postgres 2>/dev/null || echo "❌ Cannot resolve postgres hostname"