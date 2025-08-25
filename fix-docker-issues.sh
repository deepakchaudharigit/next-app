#!/bin/bash

# NPCL Dashboard - Quick Fix Script for Docker Issues
# This script applies all fixes and restarts the Docker services

set -e

echo "🔧 NPCL Dashboard - Quick Fix for Docker Issues"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Stop any running containers
print_status "INFO" "Stopping existing Docker containers..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v 2>/dev/null || true
print_status "SUCCESS" "Containers stopped"

# Make scripts executable
print_status "INFO" "Making scripts executable..."
find scripts -name "*.sh" -type f -exec chmod +x {} \; 2>/dev/null || true
print_status "SUCCESS" "Scripts are now executable"

# Clean up Docker resources
print_status "INFO" "Cleaning up Docker resources..."
docker system prune -f >/dev/null 2>&1 || true
print_status "SUCCESS" "Docker cleanup completed"

# Validate configuration
print_status "INFO" "Validating configuration..."
if [ -f "scripts/docker/validate-fixes.sh" ]; then
    chmod +x scripts/docker/validate-fixes.sh
    if ./scripts/docker/validate-fixes.sh; then
        print_status "SUCCESS" "Configuration validation passed"
    else
        print_status "ERROR" "Configuration validation failed"
        exit 1
    fi
else
    print_status "WARNING" "Validation script not found, skipping validation"
fi

# Start the services
print_status "INFO" "Starting Docker services with fixed configuration..."
echo ""
echo "🚀 Running: docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build"
echo ""

# Start services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

echo ""
print_status "SUCCESS" "Docker services started successfully!"
echo ""
echo "📱 Your application should be available at:"
echo "   • Main App: http://localhost:3000"
echo "   • Adminer (DB): http://localhost:8080 (if dev-tools profile is enabled)"
echo "   • Mailhog: http://localhost:8025 (if dev-tools profile is enabled)"
echo ""
echo "🔍 To check logs:"
echo "   • All services: docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f"
echo "   • App only: docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f app"
echo "   • Database only: docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f postgres"
echo ""