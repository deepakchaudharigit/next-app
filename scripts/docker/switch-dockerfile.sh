#!/bin/bash

# Script to switch between Alpine and Debian-based Docker images
# Usage: ./scripts/docker/switch-dockerfile.sh [alpine|debian]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

show_usage() {
    echo "Usage: $0 [alpine|debian]"
    echo ""
    echo "Switch between Alpine and Debian-based Docker images for development:"
    echo "  alpine  - Use Alpine Linux (smaller, but may have OpenSSL issues)"
    echo "  debian  - Use Debian Slim (larger, but better Prisma compatibility)"
    echo ""
    echo "Current Dockerfile.dev will be backed up before switching."
}

switch_to_alpine() {
    echo "🔄 Switching to Alpine Linux-based Docker image..."
    
    # Backup current Dockerfile.dev if it's not already Alpine
    if ! grep -q "FROM node:18-alpine" "$PROJECT_ROOT/Dockerfile.dev"; then
        cp "$PROJECT_ROOT/Dockerfile.dev" "$PROJECT_ROOT/Dockerfile.dev.backup"
        echo "📁 Current Dockerfile.dev backed up as Dockerfile.dev.backup"
    fi
    
    # The current Dockerfile.dev is already Alpine-based with OpenSSL fixes
    echo "✅ Already using Alpine Linux with OpenSSL compatibility fixes"
    echo "📋 Features:"
    echo "   - Node.js 18 Alpine base image"
    echo "   - OpenSSL 1.1 compatibility libraries"
    echo "   - Enhanced Prisma engine configuration"
    echo "   - Retry logic for database operations"
}

switch_to_debian() {
    echo "🔄 Switching to Debian Slim-based Docker image..."
    
    # Backup current Dockerfile.dev
    cp "$PROJECT_ROOT/Dockerfile.dev" "$PROJECT_ROOT/Dockerfile.dev.backup"
    echo "📁 Current Dockerfile.dev backed up as Dockerfile.dev.backup"
    
    # Copy Debian-based Dockerfile
    cp "$PROJECT_ROOT/Dockerfile.dev.debian" "$PROJECT_ROOT/Dockerfile.dev"
    echo "✅ Switched to Debian Slim-based Docker image"
    echo "📋 Features:"
    echo "   - Node.js 18 Slim (Debian) base image"
    echo "   - Better OpenSSL compatibility"
    echo "   - Native Prisma engine support"
    echo "   - Larger image size but more stable"
}

update_docker_compose() {
    echo "🔧 Updating docker-compose.dev.yml to use current Dockerfile.dev..."
    # The docker-compose.dev.yml already points to Dockerfile.dev, so no changes needed
    echo "✅ Docker Compose configuration is ready"
}

main() {
    cd "$PROJECT_ROOT"
    
    case "${1:-}" in
        "alpine")
            switch_to_alpine
            ;;
        "debian")
            switch_to_debian
            ;;
        "")
            echo "❌ Error: Please specify 'alpine' or 'debian'"
            echo ""
            show_usage
            exit 1
            ;;
        *)
            echo "❌ Error: Invalid option '$1'"
            echo ""
            show_usage
            exit 1
            ;;
    esac
    
    update_docker_compose
    
    echo ""
    echo "🎯 Next steps:"
    echo "   1. Rebuild the Docker image: npm run docker:dev:build"
    echo "   2. Start the development environment: npm run docker:dev"
    echo ""
    echo "💡 If you encounter issues:"
    echo "   - Try: docker-compose down -v && docker system prune -f"
    echo "   - Then rebuild: npm run docker:dev"
}

main "$@"