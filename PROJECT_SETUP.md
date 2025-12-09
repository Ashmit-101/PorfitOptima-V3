# 📁 ProfitOptima - Complete Project Setup

## ✅ What's Been Set Up

Your project is now fully configured with automated scripts that handle all dependencies and services!

### 🎯 New Files Created

#### **Shell Scripts** (Executable)
- `setup.sh` - One-command installation of all dependencies
- `start.sh` - Starts all 4 services with logging
- `stop.sh` - Stops all running services  
- `dev.sh` - Development mode with live console output
- `check.sh` - System health check and diagnostics

#### **Documentation**
- `QUICKSTART.md` - Comprehensive getting started guide
- `CHEATSHEET.md` - Quick command reference
- `README.md` - Updated with quick start section

#### **Directories**
- `logs/` - Automatic logging for all services
- `server/backend_src/lib/` - Created with firebaseAdmin.ts module

#### **Configuration**
- Updated `.gitignore` - Excludes logs, builds, secrets
- Updated `package.json` - Added npm scripts for convenience
- Updated `server/package.json` - Added worker scripts

---

## 🚀 How to Use

### **First Time (One-Time Setup)**

```bash
# 1. Run setup
./setup.sh

# 2. Configure your API keys
nano .env  # or use any text editor

# Add these variables:
# OPENAI_API_KEY=your_key_here
# FIREBASE_API_KEY=your_key_here
# (see QUICKSTART.md for full list)

# 3. Add Firebase service account
# Place service-account.json in server/

# 4. Start everything!
./start.sh
```

### **Daily Development**

```bash
# Development mode (see all output live)
./dev.sh

# OR use npm scripts
npm run dev
```

### **Stop Everything**

```bash
./stop.sh
# OR
npm run stop:all
```

### **Check System Health**

```bash
./check.sh
# OR  
npm run check
```

---

## 📦 What Each Service Does

### 1. **Frontend** (React)
- Port: `3000`
- UI dashboard for products, competitors, pricing
- Auto-reloads on code changes

### 2. **Backend API** (Express + TypeScript)
- Port: `5000` (configurable in .env)
- REST API endpoints
- Firebase integration
- Compiled from `server/backend_src/` to `server/dist/`

### 3. **Pricing Worker** (Node.js)
- Processes price snapshots
- Calls OpenAI for AI-powered pricing
- Writes recommendations to Firebase

### 4. **Scraper Worker** (Python)
- Uses Playwright for web scraping
- Fetches competitor prices
- Creates snapshots in Firebase

All services communicate through **Firebase Firestore** collections:
- `scrapeJobs` - Queue of URLs to scrape
- `priceSnapshots` - Scraped competitor data
- `products` - Your product catalog

---

## 🛠️ NPM Scripts Available

### Root Package (`npm run <script>`)

```bash
setup        # Run ./setup.sh
start:all    # Run ./start.sh (start all services)
stop:all     # Run ./stop.sh (stop all services)
dev          # Run ./dev.sh (development mode)
check        # Run ./check.sh (health check)
backend      # Run backend API only
workers      # Run both workers only
start        # Run frontend only
build        # Build frontend for production
```

### Server Package (`cd server && npm run <script>`)

```bash
build           # Compile TypeScript → JavaScript
build:watch     # Watch mode (auto-rebuild on changes)
start           # Run backend API
dev             # Build + run with auto-reload
pricing-worker  # Run pricing worker only
scraper-worker  # Run scraper worker only  
workers         # Run both workers
all             # Build + start everything in server/
```

---

## 📂 Project Structure

```
ProfitOptima-V2/
│
├── 🚀 Quick Start Scripts
│   ├── setup.sh          # Install dependencies
│   ├── start.sh          # Start all services
│   ├── stop.sh           # Stop all services
│   ├── dev.sh            # Development mode
│   └── check.sh          # Health check
│
├── 📖 Documentation
│   ├── QUICKSTART.md     # Detailed guide
│   ├── CHEATSHEET.md     # Command reference
│   └── README.md         # Project overview
│
├── 📝 Logs
│   └── logs/             # Service logs (auto-generated)
│       ├── backend.log
│       ├── frontend.log
│       ├── pricing-worker.log
│       └── scraper-worker.log
│
├── 🎨 Frontend
│   ├── src/              # React components
│   ├── public/           # Static files
│   └── package.json      # Dependencies
│
└── 🔧 Backend
    └── server/
        ├── backend_src/          # TypeScript source
        │   ├── index.ts          # Main API
        │   ├── lib/              # Shared utilities
        │   │   └── firebaseAdmin.ts
        │   ├── services/         # Business logic
        │   ├── workers/          # TypeScript workers
        │   └── pricing/          # Pricing logic
        │
        ├── workers/
        │   └── scraper_worker/   # Python scraper
        │       ├── worker.py
        │       └── requirements.txt
        │
        ├── dist/                 # Compiled JS (auto-generated)
        └── package.json          # Dependencies
```

---

## 🔍 Troubleshooting Guide

### Dependencies Not Installed
```bash
./setup.sh
```

### Services Won't Start
```bash
# 1. Check health
./check.sh

# 2. Stop everything
./stop.sh

# 3. Rebuild
cd server && npm run build && cd ..

# 4. Try again
./start.sh
```

### Port Already in Use
```bash
# Find what's using the port
lsof -i :3000  # Frontend
lsof -i :4000  # Backend

# Kill it
kill -9 <PID>

# Or change port in .env
echo "PORT=3001" >> .env
```

### TypeScript Build Errors
```bash
cd server
npm run build
# Fix any errors shown
```

### Python Package Issues
```bash
pip3 install -r server/workers/scraper_worker/requirements.txt
python3 -m playwright install chromium
```

### Firebase Connection Issues
- Verify `GOOGLE_APPLICATION_CREDENTIALS` in `.env`
- Check `server/service-account.json` exists
- Ensure Firebase project is properly configured

---

## 📊 Monitoring Your Services

### View Live Logs
```bash
# All logs
tail -f logs/*.log

# Specific service
tail -f logs/backend.log
tail -f logs/scraper-worker.log
```

### Check Running Services
```bash
./check.sh
```

### Check Ports
```bash
lsof -i :3000  # Frontend
lsof -i :4000  # Backend API
```

---

## 🎓 Development Workflow

### 1. **Making Frontend Changes**
```bash
npm start  # Auto-reloads on save
```

### 2. **Making Backend Changes**
```bash
# Terminal 1: Auto-rebuild TypeScript
cd server && npm run build:watch

# Terminal 2: Run backend
cd server && npm run dev
```

### 3. **Testing Workers**
```bash
# Pricing worker
cd server && npm run pricing-worker

# Scraper worker
cd server && npm run scraper-worker
```

### 4. **Full Stack Development**
```bash
./dev.sh
# See all output in one terminal
```

---

## ✨ What's Automated

✅ **Dependency Installation**
- Node.js packages (frontend + backend)
- Python packages
- Playwright browsers
- TypeScript compilation

✅ **Service Management**
- All 4 services start together
- Background processes with logging
- Graceful shutdown on Ctrl+C
- Port conflict detection

✅ **Development Tools**
- Auto-rebuild on changes
- Live output in dev mode
- Health checks
- Log aggregation

✅ **Safety**
- Logs excluded from git
- Service account excluded from git
- Build artifacts excluded from git
- Environment files excluded from git

---

## 🎯 Next Steps

1. **Configure `.env`** with your API keys
2. **Add `service-account.json`** to `server/`
3. **Run `./start.sh`**
4. **Open `http://localhost:3000`**
5. **Check `QUICKSTART.md`** for detailed feature guides

---

## 💡 Pro Tips

- Use `./dev.sh` during development to see all logs
- Use `./start.sh` for production-like testing with log files
- Run `./check.sh` before committing to catch issues
- Keep `CHEATSHEET.md` open for quick command reference
- Frontend auto-reloads - just save your files!
- Backend needs rebuild - use `npm run build:watch`

---

## 📚 Additional Resources

- [QUICKSTART.md](./QUICKSTART.md) - Comprehensive setup guide
- [CHEATSHEET.md](./CHEATSHEET.md) - All commands in one place
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebase configuration
- [AZURE_DEPLOYMENT_GUIDE.md](./AZURE_DEPLOYMENT_GUIDE.md) - Cloud deployment
- [server/backend_src/ARCHITECTURE.md](./server/backend_src/ARCHITECTURE.md) - Backend architecture

---

**Questions? Run `./check.sh` to diagnose issues!** 🔧

**Happy coding! 🚀**
