#!/bin/bash

# Fix Docker script permissions
echo "🔧 Fixing Docker script permissions..."

# Make all shell scripts in scripts/docker executable
find scripts/docker -name "*.sh" -type f -exec chmod +x {} \;

echo "✅ Script permissions fixed!"

# List the permissions to verify
echo "📋 Current script permissions:"
ls -la scripts/docker/*.sh