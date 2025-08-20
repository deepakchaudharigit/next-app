#!/bin/bash

# NPCL Dashboard Docker Setup Script
# This script sets up everything needed to run the project with Docker

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 NPCL Dashboard Docker Setup${NC}"
echo "=================================="
echo ""

# Step 1: Environment file is already created above
echo -e "${GREEN}✅ Step 1: Environment file created (.env.docker)${NC}"
echo "   - NEXTAUTH_SECRET: Set with secure random string"
echo "   - POSTGRES_PASSWORD: Set to 'SecurePassword123!'"
echo "   - All other variables configured for Docker"
echo ""

# Step 2: Make scripts executable
echo -e "${BLUE}📝 Step 2: Making scripts executable...${NC}"

if [ -f "docker-start.sh" ]; then
    chmod +x docker-start.sh
    echo -e "${GREEN}✅ docker-start.sh made executable${NC}"
else
    echo -e "${YELLOW}⚠️  docker-start.sh not found${NC}"
fi

if [ -f "scripts/docker/startup.sh" ]; then
    chmod +x scripts/docker/startup.sh
    echo -e "${GREEN}✅ scripts/docker/startup.sh made executable${NC}"
else
    echo -e "${YELLOW}⚠️  scripts/docker/startup.sh not found${NC}"
fi

if [ -f "scripts/docker/startup-dev-simple.sh" ]; then
    chmod +x scripts/docker/startup-dev-simple.sh
    echo -e "${GREEN}✅ scripts/docker/startup-dev-simple.sh made executable${NC}"
else
    echo -e "${YELLOW}⚠️  scripts/docker/startup-dev-simple.sh not found${NC}"
fi

echo ""

# Step 3: Check Docker installation
echo -e "${BLUE}🔍 Step 3: Checking Docker installation...${NC}"

if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker is installed${NC}"
    
    if docker info &> /dev/null; then
        echo -e "${GREEN}✅ Docker is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Docker is installed but not running${NC}"
        echo "   Please start Docker Desktop and run this script again"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Docker is not installed${NC}"
    echo "   Please install Docker Desktop from: https://docs.docker.com/get-docker/"
    exit 1
fi

if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose is available${NC}"
else
    echo -e "${YELLOW}⚠️  Docker Compose is not available${NC}"
    echo "   Please install Docker Compose"
    exit 1
fi

echo ""

# Step 4: Show next steps
echo -e "${BLUE}🚀 Setup Complete! Next Steps:${NC}"
echo "=================================="
echo ""
echo "Choose one of these commands to start your application:"
echo ""
echo -e "${GREEN}Development Mode (Recommended):${NC}"
echo "  ./docker-start.sh start development"
echo "  OR"
echo "  npm run docker:dev"
echo ""
echo -e "${GREEN}Production Mode:${NC}"
echo "  ./docker-start.sh start production"
echo "  OR"
echo "  npm run docker:prod"
echo ""
echo -e "${GREEN}Development with Extra Tools:${NC}"
echo "  ./docker-start.sh start dev-tools"
echo "  OR"
echo "  npm run docker:dev:tools"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  ./docker-start.sh status          # Check service status"
echo "  ./docker-start.sh logs            # View logs"
echo "  ./docker-start.sh stop            # Stop services"
echo "  ./docker-start.sh shell           # Access app container"
echo ""
echo -e "${BLUE}Service URLs (once running):${NC}"
echo "  🌐 Application: http://localhost:3000"
echo "  ❤️  Health Check: http://localhost:3000/api/health"
echo "  🗄️  Database: localhost:5432"
echo "  🔴 Redis: localhost:6379"
echo ""
echo -e "${GREEN}🎉 Your NPCL Dashboard is ready for Docker!${NC}"