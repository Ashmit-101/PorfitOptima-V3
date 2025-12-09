#!/bin/bash

# ProfitOptima Health Check
# Verifies all dependencies and services status

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ProfitOptima - Health Check          ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Check Node.js
echo -e "${YELLOW}Node.js:${NC}"
if command -v node &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} $(node -v)"
else
    echo -e "  ${RED}✗${NC} Not installed"
fi

# Check npm
if command -v npm &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} npm $(npm -v)"
else
    echo -e "  ${RED}✗${NC} npm not installed"
fi
echo ""

# Check Python
echo -e "${YELLOW}Python:${NC}"
if command -v python3 &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} $(python3 --version)"
else
    echo -e "  ${RED}✗${NC} Not installed"
fi
echo ""

# Check Frontend dependencies
echo -e "${YELLOW}Frontend Dependencies:${NC}"
if [ -d "node_modules" ]; then
    echo -e "  ${GREEN}✓${NC} Installed"
else
    echo -e "  ${RED}✗${NC} Not installed - run ./setup.sh"
fi
echo ""

# Check Backend dependencies
echo -e "${YELLOW}Backend Dependencies:${NC}"
if [ -d "server/node_modules" ]; then
    echo -e "  ${GREEN}✓${NC} Installed"
else
    echo -e "  ${RED}✗${NC} Not installed - run ./setup.sh"
fi
echo ""

# Check Backend build
echo -e "${YELLOW}Backend Build:${NC}"
if [ -d "server/dist" ] && [ -f "server/dist/index.js" ]; then
    echo -e "  ${GREEN}✓${NC} Built"
else
    echo -e "  ${RED}✗${NC} Not built - run: cd server && npm run build"
fi
echo ""

# Check Python packages
echo -e "${YELLOW}Python Packages:${NC}"
packages=("playwright" "google-cloud-firestore" "httpx" "python-dotenv")
all_installed=true
for pkg in "${packages[@]}"; do
    if python3 -m pip list 2>/dev/null | grep -q "^$pkg "; then
        version=$(python3 -m pip list 2>/dev/null | grep "^$pkg " | awk '{print $2}')
        echo -e "  ${GREEN}✓${NC} $pkg ($version)"
    else
        echo -e "  ${RED}✗${NC} $pkg not installed"
        all_installed=false
    fi
done
echo ""

# Check environment file
echo -e "${YELLOW}Configuration:${NC}"
if [ -f ".env" ]; then
    echo -e "  ${GREEN}✓${NC} .env file exists"
    
    if grep -q "OPENAI_API_KEY=your_openai_api_key" .env 2>/dev/null; then
        echo -e "  ${YELLOW}⚠${NC}  OPENAI_API_KEY not configured"
    else
        echo -e "  ${GREEN}✓${NC} OPENAI_API_KEY configured"
    fi
    
    if [ -f "server/service-account.json" ]; then
        echo -e "  ${GREEN}✓${NC} service-account.json exists"
    else
        echo -e "  ${YELLOW}⚠${NC}  service-account.json not found"
    fi
else
    echo -e "  ${RED}✗${NC} .env file not found - run ./setup.sh"
fi
echo ""

# Check running services
echo -e "${YELLOW}Running Services:${NC}"
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Frontend (port 3000)"
else
    echo -e "  ${BLUE}○${NC} Frontend not running"
fi

if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Backend (port 4000)"
elif lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Backend (port 3001)"
else
    echo -e "  ${BLUE}○${NC} Backend not running"
fi

if pgrep -f "pricingWorker.js" >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Pricing Worker"
else
    echo -e "  ${BLUE}○${NC} Pricing Worker not running"
fi

if pgrep -f "scraper_worker/worker.py" >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Scraper Worker"
else
    echo -e "  ${BLUE}○${NC} Scraper Worker not running"
fi
echo ""

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Health Check Complete                 ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
