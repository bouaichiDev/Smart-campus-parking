#!/bin/bash
# Smart Campus Parking Stop Utility
echo "=========================================================="
echo "🛑 Shutting Down Smart Campus Parking Infrastructure"
echo "=========================================================="

# Safely spin down and preserve volumes
docker-compose down

echo "=========================================================="
echo "✅ Systems stopped successfully."
echo "=========================================================="
