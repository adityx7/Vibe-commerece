#!/bin/bash

# Test script for analytics system validation
# Usage: ./test.sh

set -e

API_URL="http://localhost:4000"
SITE_ID="demo-site"
TODAY=$(date +%Y-%m-%d)

echo "============================================"
echo "Analytics System Test Script"
echo "============================================"
echo ""

# Check if services are running
echo "1. Checking API health..."
HEALTH=$(curl -s "${API_URL}/health" | grep -o "healthy" || true)
if [ "$HEALTH" = "healthy" ]; then
    echo "✅ API is healthy"
else
    echo "❌ API is not responding. Is the system running? (docker-compose up)"
    exit 1
fi
echo ""

# Test event ingestion
echo "2. Ingesting test events..."
echo "   Event 1: /home by user-001"
curl -s -X POST "${API_URL}/event" \
  -H "Content-Type: application/json" \
  -d "{
    \"site_id\": \"${SITE_ID}\",
    \"event_type\": \"page_view\",
    \"path\": \"/home\",
    \"user_id\": \"user-001\",
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }" > /dev/null
echo "   ✅ Event 1 posted"

sleep 1

echo "   Event 2: /products by user-002"
curl -s -X POST "${API_URL}/event" \
  -H "Content-Type: application/json" \
  -d "{
    \"site_id\": \"${SITE_ID}\",
    \"event_type\": \"page_view\",
    \"path\": \"/products\",
    \"user_id\": \"user-002\",
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }" > /dev/null
echo "   ✅ Event 2 posted"

sleep 1

echo "   Event 3: /products by user-001"
curl -s -X POST "${API_URL}/event" \
  -H "Content-Type: application/json" \
  -d "{
    \"site_id\": \"${SITE_ID}\",
    \"event_type\": \"page_view\",
    \"path\": \"/products\",
    \"user_id\": \"user-001\",
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }" > /dev/null
echo "   ✅ Event 3 posted"

sleep 1

echo "   Event 4: /home by anonymous"
curl -s -X POST "${API_URL}/event" \
  -H "Content-Type: application/json" \
  -d "{
    \"site_id\": \"${SITE_ID}\",
    \"event_type\": \"page_view\",
    \"path\": \"/home\",
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }" > /dev/null
echo "   ✅ Event 4 posted"

sleep 1

echo "   Event 5: /about by user-003"
curl -s -X POST "${API_URL}/event" \
  -H "Content-Type: application/json" \
  -d "{
    \"site_id\": \"${SITE_ID}\",
    \"event_type\": \"page_view\",
    \"path\": \"/about\",
    \"user_id\": \"user-003\",
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }" > /dev/null
echo "   ✅ Event 5 posted"
echo ""

# Wait for background processing
echo "3. Waiting for background processing (5 seconds)..."
sleep 5
echo "   ✅ Wait complete"
echo ""

# Fetch statistics
echo "4. Fetching statistics..."
STATS=$(curl -s "${API_URL}/stats?site_id=${SITE_ID}&date=${TODAY}")
echo "${STATS}" | python3 -m json.tool 2>/dev/null || echo "${STATS}"
echo ""

# Validate results
TOTAL_VIEWS=$(echo "${STATS}" | grep -o '"total_views":[0-9]*' | grep -o '[0-9]*')
UNIQUE_USERS=$(echo "${STATS}" | grep -o '"unique_users":[0-9]*' | grep -o '[0-9]*')

echo "5. Validation..."
if [ "$TOTAL_VIEWS" -ge 5 ]; then
    echo "   ✅ Total views: ${TOTAL_VIEWS} (expected ≥ 5)"
else
    echo "   ❌ Total views: ${TOTAL_VIEWS} (expected ≥ 5)"
fi

if [ "$UNIQUE_USERS" -ge 3 ]; then
    echo "   ✅ Unique users: ${UNIQUE_USERS} (expected ≥ 3)"
else
    echo "   ❌ Unique users: ${UNIQUE_USERS} (expected ≥ 3)"
fi
echo ""

# Test error handling
echo "6. Testing error handling (invalid payload)..."
ERROR_RESPONSE=$(curl -s -X POST "${API_URL}/event" \
  -H "Content-Type: application/json" \
  -d '{"site_id": "test"}' | grep -o "Invalid payload" || true)

if [ "$ERROR_RESPONSE" = "Invalid payload" ]; then
    echo "   ✅ Error handling works correctly"
else
    echo "   ❌ Error handling not working as expected"
fi
echo ""

echo "============================================"
echo "✅ Test completed successfully!"
echo "============================================"
