#!/bin/bash
# Smart Campus Parking Build Utility
echo "=========================================================="
echo "🚀 Building Smart Campus Parking Project"
echo "=========================================================="

# Check for Docker installation
if ! command -v docker &> /dev/null; then
    echo "❌ Error: docker is not installed."
    exit 1
fi

# Build backend maven package locally if needed
echo "📦 Building Backend Spring Boot Service..."
cd backend-spring-boot
if [ -f "./mvnw" ]; then
    chmod +x ./mvnw
    ./mvnw clean package -DskipTests
else
    echo "⚠️ Maven Wrapper not found. Relying on Docker multi-stage build."
fi
cd ..

# Build Docker containers
echo "🐋 Building Docker Containers..."
docker-compose build

echo "=========================================================="
echo "✅ Build completed successfully."
echo "=========================================================="
