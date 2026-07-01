#!/bin/bash
# Smart Campus Parking Status Utility
echo "=========================================================="
echo "📊 Smart Campus Parking Status Report"
echo "=========================================================="

# Check docker daemon status
if ! docker info &> /dev/null; then
    echo "❌ Error: Docker daemon is not running."
    exit 1
fi

echo "Containers Status:"
docker-compose ps

echo -e "\nNetwork Port Bindings:"
docker-compose port parking-frontend 80 2>/dev/null || echo "Frontend: Stopped"
docker-compose port parking-backend 8082 2>/dev/null || echo "Backend: Stopped"
docker-compose port parking-db 3306 2>/dev/null || echo "Database: Stopped"

echo "=========================================================="
