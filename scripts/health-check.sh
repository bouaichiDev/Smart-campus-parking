#!/bin/bash
# Smart Campus Parking Health Check Utility
echo "=========================================================="
echo "🩺 Performing Smart Campus Parking Health Diagnostic"
echo "=========================================================="

# 1. Check database connectivity
echo "🔍 Testing Database Port Response..."
if nc -z localhost 3306 2>/dev/null; then
    echo "✅ Database Port (3306) is ACTIVE"
else
    echo "❌ Error: Database Port (3306) is UNREACHABLE"
fi

# 2. Check Backend Spring Boot HTTP Response
echo -e "\n🔍 Testing Backend Spring Boot Server..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8082/v3/api-docs)
if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 401 ] || [ "$HTTP_STATUS" -eq 403 ]; then
    echo "✅ Backend Service is ACTIVE (HTTP Status: $HTTP_STATUS)"
else
    echo "❌ Error: Backend Service is UNRESPONSIVE (HTTP Status: $HTTP_STATUS)"
fi

# 3. Check Frontend Nginx Response
echo -e "\n🔍 Testing Frontend Nginx Server..."
FRONT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONT_STATUS" -eq 200 ]; then
    echo "✅ Frontend Service is ACTIVE (HTTP Status: 200)"
else
    echo "❌ Error: Frontend Service is UNRESPONSIVE (HTTP Status: $FRONT_STATUS)"
fi

echo "=========================================================="
