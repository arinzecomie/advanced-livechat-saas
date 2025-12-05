/**
 * Smoke Test Script
 * Basic functionality verification
 */
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Advanced Live Chat SaaS - Smoke Test"
echo "========================================"

# Configuration
API_BASE="http://localhost:3000/api"
DEMO_SITE_ID="demo-site-id"
SUSPENDED_SITE_ID="suspended-site-id"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Function to make HTTP requests
call_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -n "Testing: $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$API_BASE$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_BASE$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ PASSED${NC} (HTTP $http_code)"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC} (HTTP $http_code)"
        echo "Response: $body"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Test health endpoint
echo -e "\n${YELLOW}Health Check${NC}"
call_api "GET" "/health" "" "Health endpoint"

# Test widget endpoints
echo -e "\n${YELLOW}Widget API Tests${NC}"

# Test active site visit
call_api "POST" "/widget/visit" \
    '{"siteId":"'$DEMO_SITE_ID'","fingerprint":"test-fp-123","page":"/test"}' \
    "Active site visit"

# Test suspended site visit
call_api "POST" "/widget/visit" \
    '{"siteId":"'$SUSPENDED_SITE_ID'","fingerprint":"test-fp-456","page":"/test"}' \
    "Suspended site visit"

# Test widget status
call_api "GET" "/widget/status/$DEMO_SITE_ID" "" "Active site status"
call_api "GET" "/widget/status/$SUSPENDED_SITE_ID" "" "Suspended site status"

# Test static files
echo -e "\n${YELLOW}Static Files${NC}"
call_api "GET" "/demo.html" "" "Demo page"

# Test authentication endpoints
echo -e "\n${YELLOW}Authentication Tests${NC}"

# Test registration
call_api "POST" "/auth/register" \
    '{"name":"Test User","email":"test@example.com","password":"test123123"}' \
    "User registration"

# Test login
call_api "POST" "/auth/login" \
    '{"email":"demo@example.com","password":"user123"}' \
    "User login"

# Test protected endpoint without token
echo -e "\n${YELLOW}Authorization Tests${NC}"
call_api "GET" "/dashboard" "" "Protected endpoint (no token) - should fail"

# Summary
echo -e "\n========================================"
echo "📊 Test Results:"
echo -e "✅ Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "❌ Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "📈 Total: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed.${NC}"
    exit 1
fi