#!/bin/bash

# ProfitOptima Development Mode
# Starts all services with live output (no log files)

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

cd "$(dirname "$0")"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ProfitOptima - Development Mode      ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Load environment
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Set Firebase service account from file if not already set
if [ -z "$FIREBASE_SERVICE_ACCOUNT_KEY" ] && [ -f "server/service-account.json" ]; then
    export FIREBASE_SERVICE_ACCOUNT_KEY=$(cat server/service-account.json | tr -d '\n')
fi

# Cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping all services...${NC}"
    pkill -f "node dist/index.js" 2>/dev/null || true
    pkill -f "pricingWorker.js" 2>/dev/null || true
    pkill -f "worker.py" 2>/dev/null || true
    pkill -f "react-scripts start" 2>/dev/null || true
    kill 0 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

# Kill any existing processes on our ports BEFORE starting
echo -e "${CYAN}Cleaning up existing processes...${NC}"
pkill -f "node dist/index.js" 2>/dev/null || true
pkill -f "pricingWorker.js" 2>/dev/null || true
pkill -f "worker.py" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true

# Kill processes on ports (including system processes like AirPlay)
if lsof -ti:4000 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 4000 in use, attempting to free...${NC}"
    # Try regular kill first
    lsof -ti:4000 | xargs kill -9 2>/dev/null || {
        # If that fails, may be a system process - try sudo
        echo -e "${YELLOW}Trying with sudo...${NC}"
        sudo lsof -ti:4000 | xargs sudo kill -9 2>/dev/null || true
    }
fi

if lsof -ti:3000 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 3000 in use, freeing...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
fi

sleep 2
echo -e "${GREEN}✅ Ports cleared${NC}"
echo ""

# Ensure backend is built
if [ ! -d "server/dist" ]; then
    echo -e "${YELLOW}Building backend...${NC}"
    cd server && npm run build && cd ..
    echo ""
fi

echo -e "${GREEN}Starting all services...${NC}"
echo -e "${CYAN}All output will be displayed here${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# Function to prefix output
prefix_output() {
    local prefix=$1
    local color=$2
    while IFS= read -r line; do
        echo -e "${color}[${prefix}]${NC} $line"
    done
}

# Start all services with prefixed output
(cd server && PORT=${PORT:-4000} FIREBASE_SERVICE_ACCOUNT_KEY="$FIREBASE_SERVICE_ACCOUNT_KEY" node dist/index.js 2>&1 | prefix_output "BACKEND" "$GREEN") &
sleep 2

(cd server && FIREBASE_SERVICE_ACCOUNT_KEY="$FIREBASE_SERVICE_ACCOUNT_KEY" node dist/workers/pricingWorker.js 2>&1 | prefix_output "PRICING" "$BLUE") &
sleep 1

(python3 server/workers/scraper_worker/worker.py 2>&1 | prefix_output "SCRAPER" "$YELLOW") &
sleep 1

(PORT=3000 BROWSER=none npm start 2>&1 | prefix_output "FRONTEND" "$CYAN") &

# Wait for all processes
wait
