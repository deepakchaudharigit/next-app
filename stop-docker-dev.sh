#!/bin/bash

echo "🛑 Stopping development containers..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

echo "✅ Development containers stopped!"