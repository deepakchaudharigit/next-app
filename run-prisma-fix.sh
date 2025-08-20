#!/bin/bash

# Simple script to make the fix script executable and run it

echo "🔧 Making fix script executable..."
chmod +x fix-prisma-openssl-docker.sh

echo "🚀 Running Prisma OpenSSL Docker fix..."
./fix-prisma-openssl-docker.sh