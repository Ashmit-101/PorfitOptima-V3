#!/bin/bash

# ProfitOptima Startup Script
# Starts all services: Frontend, Backend API, Pricing Worker, Scraper Worker

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Change to script directory
cd "$(dirname "$0")"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ProfitOptima - Starting Services     ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies not found. Running setup first...${NC}"
    ./setup.sh
    echo ""
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Set Firebase service account from file if not already set
if [ -z "$FIREBASE_SERVICE_ACCOUNT_KEY" ] && [ -f "server/service-account.json" ]; then
    export FIREBASE_SERVICE_ACCOUNT_KEY=$(cat server/service-account.json | tr -d '\n')
fi

# Trap to kill all processes on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping all services...${NC}"
    kill 0
    exit 0
}
trap cleanup SIGINT SIGTERM

# Create logs directory if it doesn't exist
mkdir -p logs

# Build backend if needed
if [ ! -d "server/dist" ]; then
    echo -e "${YELLOW}Building backend...${NC}"
    cd server
    npm run build
    cd ..
    echo ""
fi

# Start Backend API
echo -e "${GREEN}[1/4] Starting Backend API on port ${PORT:-4000}...${NC}"
cd server
PORT=${PORT:-4000} node dist/index.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..
sleep 2

# Start Pricing Worker
echo -e "${GREEN}[2/4] Starting Pricing Worker...${NC}"
cd server
FIREBASE_SERVICE_ACCOUNT_KEY="$FIREBASE_SERVICE_ACCOUNT_KEY" node dist/workers/pricingWorker.js > ../logs/pricing-worker.log 2>&1 &
PRICING_PID=$!
cd ..
sleep 1

# Start Scraper Worker
echo -e "${GREEN}[3/4] Starting Scraper Worker (Python)...${NC}"
python3 server/workers/scraper_worker/worker.py > logs/scraper-worker.log 2>&1 &
SCRAPER_PID=$!
sleep 1

# Start Frontend
echo -e "${GREEN}[4/4] Starting Frontend on port 3000...${NC}"
PORT=3000 BROWSER=none npm start > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 3

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ All Services Running!               ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""
echo -e "${BLUE}Services:${NC}"
echo -e "  ${GREEN}•${NC} Frontend:         http://localhost:3000"
echo -e "  ${GREEN}•${NC} Backend API:      http://localhost:${PORT:-4000}"
echo -e "  ${GREEN}•${NC} Pricing Worker:   Running (PID: $PRICING_PID)"
echo -e "  ${GREEN}•${NC} Scraper Worker:   Running (PID: $SCRAPER_PID)"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo -e "  ${YELLOW}•${NC} Backend:     tail -f logs/backend.log"
echo -e "  ${YELLOW}•${NC} Pricing:     tail -f logs/pricing-worker.log"
echo -e "  ${YELLOW}•${NC} Scraper:     tail -f logs/scraper-worker.log"
echo -e "  ${YELLOW}•${NC} Frontend:    tail -f logs/frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for all background processes
wait
