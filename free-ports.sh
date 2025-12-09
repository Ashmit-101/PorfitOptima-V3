#!/bin/bash

# Port cleanup script for ProfitOptima
# Ensures ports 3000 and 4000 are free

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔍 Checking ports 3000 and 4000..."
echo ""

# Check port 3000
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 3000 is in use${NC}"
    echo "Process details:"
    lsof -i :3000 | head -2
    echo ""
    read -p "Kill process on port 3000? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti:3000 | xargs kill -9 2>/dev/null && echo -e "${GREEN}✅ Killed process on port 3000${NC}" || echo -e "${RED}❌ Failed to kill${NC}"
    fi
else
    echo -e "${GREEN}✅ Port 3000 is free${NC}"
fi

echo ""

# Check port 5000
if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 5000 is in use${NC}"
    echo "Process details:"
    lsof -i :4000 | head -2
    echo ""
    
    # Check if it's macOS AirPlay/Control Center
    if lsof -i :4000 | grep -q "ControlCe"; then
        echo -e "${YELLOW}Note: This is macOS AirPlay Receiver (Control Center)${NC}"
        echo "You can disable it in System Settings > General > AirDrop & Handoff > AirPlay Receiver"
        echo ""
    fi
    
    read -p "Kill process on port 4000? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Try regular kill first
        if lsof -ti:4000 | xargs kill -9 2>/dev/null; then
            echo -e "${GREEN}✅ Killed process on port 4000${NC}"
        else
            # May need sudo for system processes
            echo "Trying with sudo..."
            sudo lsof -ti:4000 | xargs sudo kill -9 2>/dev/null && echo -e "${GREEN}✅ Killed process on port 4000${NC}" || echo -e "${RED}❌ Failed to kill${NC}"
        fi
    fi
else
    echo -e "${GREEN}✅ Port 4000 is free${NC}"
fi

echo ""
echo "✅ Port check complete"
