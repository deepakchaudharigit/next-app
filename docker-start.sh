#!/bin/bash

# NPCL Dashboard Docker Quick Start Script
# This script helps you get started with Docker quickly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    print_status "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    print_success "Docker is ready!"
}

# Function to setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    if [ ! -f ".env.docker" ]; then
        if [ -f ".env.docker.example" ]; then
            print_status "Copying .env.docker.example to .env.docker..."
            cp .env.docker.example .env.docker
            print_warning "Please edit .env.docker with your configuration before running again."
            print_warning "At minimum, update NEXTAUTH_SECRET and POSTGRES_PASSWORD"
            exit 1
        else
            print_error ".env.docker.example not found. Please create environment configuration."
            exit 1
        fi
    fi
    
    print_success "Environment configuration found!"
}

# Function to start services
start_services() {
    local mode=$1
    
    print_status "Starting NPCL Dashboard in $mode mode..."
    
    case $mode in
        "development")
            print_status "Starting development environment with hot reloading..."
            docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
            ;;
        "production")
            print_status "Starting production environment..."
            docker-compose up --build -d
            ;;
        "dev-tools")
            print_status "Starting development environment with additional tools..."
            docker-compose -f docker-compose.yml -f docker-compose.dev.yml --profile dev-tools up --build
            ;;
        *)
            print_error "Invalid mode: $mode"
            show_usage
            exit 1
            ;;
    esac
}

# Function to stop services
stop_services() {
    print_status "Stopping all services..."
    docker-compose down
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
    print_success "All services stopped!"
}

# Function to show logs
show_logs() {
    local service=$1
    
    if [ -z "$service" ]; then
        print_status "Showing logs for all services..."
        docker-compose logs -f
    else
        print_status "Showing logs for $service..."
        docker-compose logs -f "$service"
    fi
}

# Function to show status
show_status() {
    print_status "Service status:"
    docker-compose ps
    
    echo ""
    print_status "Service URLs:"
    echo "  🌐 Application: http://localhost:3000"
    echo "  🗄️  Database: localhost:5432"
    echo "  🔴 Redis: localhost:6379"
    echo "  ❤️  Health Check: http://localhost:3000/api/health"
    echo "  🛠️  Adminer (dev-tools): http://localhost:8080"
    echo "  📧 MailHog (dev-tools): http://localhost:8025"
}

# Function to clean up
cleanup() {
    print_status "Cleaning up Docker resources..."
    docker-compose down -v
    docker system prune -f
    print_success "Cleanup completed!"
}

# Function to show usage
show_usage() {
    echo "NPCL Dashboard Docker Quick Start"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start [MODE]     Start services (development|production|dev-tools)"
    echo "  stop             Stop all services"
    echo "  restart [MODE]   Restart services"
    echo "  logs [SERVICE]   Show logs (optional: specify service name)"
    echo "  status           Show service status and URLs"
    echo "  clean            Clean up Docker resources"
    echo "  shell            Access application container shell"
    echo "  db-shell         Access database shell"
    echo "  help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start development     # Start in development mode"
    echo "  $0 start production      # Start in production mode"
    echo "  $0 start dev-tools       # Start with additional dev tools"
    echo "  $0 logs app              # Show application logs"
    echo "  $0 status                # Show service status"
}

# Function to access shell
access_shell() {
    local container=$1
    
    case $container in
        "app"|"")
            print_status "Accessing application container shell..."
            docker-compose exec app bash
            ;;
        "db"|"database")
            print_status "Accessing database shell..."
            docker-compose exec postgres psql -U postgres -d npcl-auth-db-dev
            ;;
        *)
            print_error "Unknown container: $container"
            echo "Available containers: app, db"
            exit 1
            ;;
    esac
}

# Main script logic
main() {
    local command=${1:-help}
    local arg2=$2
    
    case $command in
        "start")
            check_docker
            setup_environment
            start_services ${arg2:-development}
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            check_docker
            setup_environment
            start_services ${arg2:-development}
            ;;
        "logs")
            show_logs $arg2
            ;;
        "status")
            show_status
            ;;
        "clean")
            cleanup
            ;;
        "shell")
            access_shell $arg2
            ;;
        "db-shell")
            access_shell "db"
            ;;
        "help"|"--help"|"-h")
            show_usage
            ;;
        *)
            print_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"