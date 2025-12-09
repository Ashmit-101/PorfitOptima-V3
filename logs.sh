#!/bin/bash

# ProfitOptima Log Viewer
# View logs from all services

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

cd "$(dirname "$0")"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ProfitOptima - Log Viewer            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Available logs:"
echo ""
echo -e "  ${GREEN}1${NC} - Backend API"
echo -e "  ${BLUE}2${NC} - Pricing Worker"
echo -e "  ${YELLOW}3${NC} - Scraper Worker"
echo -e "  ${CYAN}4${NC} - Frontend"
echo -e "  ${GREEN}5${NC} - All logs (combined)"
echo ""
read -p "Select log to view (1-5): " choice

case $choice in
    1)
        echo -e "${GREEN}[Backend API Log]${NC}"
        tail -f logs/backend.log
        ;;
    2)
        echo -e "${BLUE}[Pricing Worker Log]${NC}"
        tail -f logs/pricing-worker.log
        ;;
    3)
        echo -e "${YELLOW}[Scraper Worker Log]${NC}"
        tail -f logs/scraper-worker.log
        ;;
    4)
        echo -e "${CYAN}[Frontend Log]${NC}"
        tail -f logs/frontend.log
        ;;
    5)
        echo -e "${GREEN}[All Logs]${NC}"
        echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
        echo ""
        tail -f logs/*.log | while IFS= read -r line; do
            if [[ $line == ==>\ logs/backend.log\ <== ]]; then
                echo -e "${GREEN}[BACKEND]${NC}"
            elif [[ $line == ==>\ logs/pricing-worker.log\ <== ]]; then
                echo -e "${BLUE}[PRICING]${NC}"
            elif [[ $line == ==>\ logs/scraper-worker.log\ <== ]]; then
                echo -e "${YELLOW}[SCRAPER]${NC}"
            elif [[ $line == ==>\ logs/frontend.log\ <== ]]; then
                echo -e "${CYAN}[FRONTEND]${NC}"
            else
                echo "$line"
            fi
        done
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac
