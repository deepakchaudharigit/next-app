#!/bin/bash

# NPCL Dashboard Docker Setup Script
# Helps with initial Docker environment setup

set -e

echo "🐳 NPCL Dashboard Docker Setup"
echo "=============================="

# Function to check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker first."
        echo "   Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose is not installed. Please install Docker Compose first."
        echo "   Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    echo "✅ Docker and Docker Compose are installed"
}

# Function to setup environment files
setup_env_files() {
    echo "📝 Setting up environment files..."
    
    if [ ! -f ".env.docker" ]; then
        if [ -f ".env.docker.example" ]; then
            cp .env.docker.example .env.docker
            echo "   Created .env.docker from example"
        else
            echo "❌ .env.docker.example not found"
            exit 1
        fi
    else
        echo "   .env.docker already exists"
    fi
    
    echo "⚠️  Please review and update .env.docker with your configuration"
}

# Function to create necessary directories
create_directories() {
    echo "📁 Creating necessary directories..."
    
    mkdir -p uploads
    mkdir -p scripts/db
    
    echo "   Created uploads directory"
    echo "   Created scripts/db directory"
}

# Function to build Docker images
build_images() {
    echo "🔨 Building Docker images..."
    
    echo "   Building production image..."
    docker build -t npcl-dashboard:latest .
    
    echo "   Building development image..."
    docker build -f Dockerfile.dev -t npcl-dashboard:dev .
    
    echo "✅ Docker images built successfully"
}

# Function to start services
start_services() {
    local mode=$1
    
    if [ "$mode" = "dev" ]; then
        echo "🚀 Starting development environment..."
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
        
        echo ""
        echo "🎉 Development environment started!"
        echo "   Application: http://localhost:3000"
        echo "   Database: localhost:5433"
        echo "   Adminer: http://localhost:8080 (with --profile dev-tools)"
        echo "   Mailhog: http://localhost:8025 (with --profile dev-tools)"
    else
        echo "🚀 Starting production environment..."
        docker-compose up -d
        
        echo ""
        echo "🎉 Production environment started!"
        echo "   Application: http://localhost:3000"
        echo "   Database: localhost:5432"
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [dev|prod|build|help]"
    echo ""
    echo "Commands:"
    echo "  dev     - Setup and start development environment"
    echo "  prod    - Setup and start production environment"
    echo "  build   - Only build Docker images"
    echo "  help    - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev      # Setup and start development"
    echo "  $0 prod     # Setup and start production"
    echo "  $0 build    # Only build images"
}

# Main function
main() {
    local command=${1:-help}
    
    case $command in
        "dev")
            check_docker
            setup_env_files
            create_directories
            build_images
            start_services "dev"
            ;;
        "prod")
            check_docker
            setup_env_files
            create_directories
            build_images
            start_services "prod"
            ;;
        "build")
            check_docker
            setup_env_files
            create_directories
            build_images
            ;;
        "help"|*)
            show_usage
            ;;
    esac
}

# Run main function
main "$@"