#!/bin/bash

# ProfitOptima Setup Script
# This script installs all dependencies for the entire project

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ProfitOptima - Setup Script          ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Check Node.js
echo -e "${YELLOW}[1/5] Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) found${NC}"
echo ""

# Check Python
echo -e "${YELLOW}[2/5] Checking Python...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3 first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python $(python3 --version) found${NC}"
echo ""

# Install Frontend dependencies
echo -e "${YELLOW}[3/5] Installing Frontend dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
echo ""

# Install Backend dependencies
echo -e "${YELLOW}[4/5] Installing Backend dependencies...${NC}"
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
echo ""
cd server
# Ensure icon library for dashboard enhancements
if ! npm list lucide-react >/dev/null 2>&1; then
  echo "Installing lucide-react for icons..."
  npm install lucide-react
fi

# Ensure Recharts library for Phase 3 charts
if ! npm list recharts >/dev/null 2>&1; then
    echo "Installing recharts for charts..."
    npm install recharts
fi
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
echo ""

# Build TypeScript
echo -e "${YELLOW}Building TypeScript...${NC}"
npm run build
echo -e "${GREEN}✓ TypeScript compiled${NC}"
cd ..
echo ""

# Install Python dependencies
echo -e "${YELLOW}[5/5] Installing Python dependencies for scraper...${NC}"
python3 -m pip install -q --upgrade pip
python3 -m pip install -q -r server/workers/scraper_worker/requirements.txt
python3 -m pip install -q -r server/backend_src/ML_model/requirement.txt

# Install Playwright browsers
echo -e "${YELLOW}Installing Playwright browsers...${NC}"
python3 -m playwright install chromium
echo -e "${GREEN}✓ Python dependencies installed${NC}"
echo ""

# Create .env template if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env template...${NC}"
    cat > .env << 'EOF'
# Firebase Configuration
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# Google Application Credentials (path to service account JSON)
GOOGLE_APPLICATION_CREDENTIALS=./server/service-account.json

# Backend Port
PROT=4000
PORT=4000
    echo -e "${GREEN}✓ .env template created - Please configure it${NC}"
fi
echo ""

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Setup Complete!                     ║${NC}"
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Configure your .env file with API keys"
echo "  2. Add your service-account.json to ./server/"
echo "  3. Run: ${GREEN}./start.sh${NC} to start all services"
echo ""
