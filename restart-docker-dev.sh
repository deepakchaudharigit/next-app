#!/bin/bash

echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

echo "🧹 Cleaning up containers and images..."
docker container prune -f
docker image prune -f

echo "🏗️ Building and starting development containers..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

echo "✅ Development environment restarted!"