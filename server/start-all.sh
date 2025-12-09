#!/bin/bash

# Start all backend services (API, Scraper Worker, Pricing Worker)
# Press Ctrl+C to stop all services

set -e

# Color output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  ProfitOptima Backend Services${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Check environment variables
echo -e "${YELLOW}Checking environment...${NC}"
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  Warning: OPENAI_API_KEY not set"
fi
if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "⚠️  Warning: GOOGLE_APPLICATION_CREDENTIALS not set"
fi
echo ""

# Ensure we're in the server directory
cd "$(dirname "$0")"

# Build TypeScript
echo -e "${GREEN}Building TypeScript...${NC}"
npm run build
echo ""

# Trap SIGINT and SIGTERM to kill all background processes
trap 'echo -e "\n${YELLOW}Stopping all services...${NC}"; kill 0' SIGINT SIGTERM

# Start API server
echo -e "${GREEN}Starting API server on port 4000...${NC}"
node dist/index.js &
API_PID=$!

# Wait a moment for API to start
sleep 2

# Start Pricing Worker
echo -e "${GREEN}Starting Pricing Worker...${NC}"
npm run pricing-worker &
PRICING_PID=$!

# Wait a moment
sleep 2

# Start Scraper Worker (Python)
echo -e "${GREEN}Starting Scraper Worker (Python)...${NC}"
cd workers/scraper_worker
python3 worker.py &
SCRAPER_PID=$!
cd ../..

echo ""
echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}✅ All services started!${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo "  API Server:      http://localhost:4000"
echo "  Pricing Worker:  Running (PID: $PRICING_PID)"
echo "  Scraper Worker:  Running (PID: $SCRAPER_PID)"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for all background processes
wait
