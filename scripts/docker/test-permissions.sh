#!/bin/bash

# Make script executable
chmod +x "$0"

# Test script to verify Docker permissions are working correctly

echo "🔍 Testing Docker permissions for NPCL Dashboard..."

# Test .next directory permissions
echo "📁 Testing .next directory permissions..."
if [ -d ".next" ]; then
    echo "   .next directory exists"
    ls -la .next/ || echo "   Cannot list .next directory contents"
    
    # Test if we can create a test file
    if touch .next/test-permission-file 2>/dev/null; then
        echo "   ✅ Can write to .next directory"
        rm -f .next/test-permission-file
    else
        echo "   ❌ Cannot write to .next directory"
    fi
else
    echo "   .next directory does not exist, creating..."
    mkdir -p .next/cache .next/server .next/static
    chmod -R 777 .next
    echo "   ✅ Created .next directory with proper permissions"
fi

# Test current user and permissions
echo "👤 Current user: $(whoami)"
echo "📊 Current working directory: $(pwd)"
echo "🔐 Directory permissions:"
ls -la | grep -E "(\.next|uploads|logs|node_modules)"

# Test Node.js and npm
echo "🟢 Node.js version: $(node --version)"
echo "📦 npm version: $(npm --version)"

# Test environment variables
echo "🌍 Environment variables:"
echo "   NODE_ENV: $NODE_ENV"
echo "   NEXT_TELEMETRY_DISABLED: $NEXT_TELEMETRY_DISABLED"

echo "✅ Permission test completed!"