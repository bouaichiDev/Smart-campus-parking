#!/bin/bash
# Smart Campus Parking Run Utility
echo "=========================================================="
echo "⚡ Starting Smart Campus Parking Infrastructure"
echo "=========================================================="

# Spin up containers in daemon mode
docker-compose up -d

echo "----------------------------------------------------------"
echo "📊 Current Container Status:"
docker-compose ps
echo "=========================================================="
echo "🎯 System launched. Access Frontend at http://localhost:3000"
echo "=========================================================="
