#!/bin/bash

# ProfitOptima Stop Script
# Stops all running services

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Stopping ProfitOptima services...${NC}"
echo ""

# Stop backend (port 4000 or 3001)
if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}Stopping Backend (port 4000)...${NC}"
    kill $(lsof -t -i:4000) 2>/dev/null
    echo -e "${GREEN}✓ Backend stopped${NC}"
fi

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}Stopping Backend (port 3001)...${NC}"
    kill $(lsof -t -i:3001) 2>/dev/null
    echo -e "${GREEN}✓ Backend stopped${NC}"
fi

# Stop frontend (port 3000)
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}Stopping Frontend (port 3000)...${NC}"
    kill $(lsof -t -i:3000) 2>/dev/null
    echo -e "${GREEN}✓ Frontend stopped${NC}"
fi

# Stop pricing worker
if pgrep -f "pricingWorker.js" >/dev/null 2>&1; then
    echo -e "${YELLOW}Stopping Pricing Worker...${NC}"
    pkill -f "pricingWorker.js"
    echo -e "${GREEN}✓ Pricing Worker stopped${NC}"
fi

# Stop scraper worker
if pgrep -f "scraper_worker/worker.py" >/dev/null 2>&1; then
    echo -e "${YELLOW}Stopping Scraper Worker...${NC}"
    pkill -f "scraper_worker/worker.py"
    echo -e "${GREEN}✓ Scraper Worker stopped${NC}"
fi

# Stop any react-scripts
if pgrep -f "react-scripts" >/dev/null 2>&1; then
    pkill -f "react-scripts"
fi

echo ""
echo -e "${GREEN}All services stopped!${NC}"
