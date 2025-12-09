cd /Users/ashmit/Documents/GitHub/PorfitOptima-V2 && ./start.sh > /tmp/star
tup.log 2>&1 &
[4] 58405
sleep 8 && cat /tmp/startup.log
# 🚀 ProfitOptima Quick Start Guide

**ProfitOptima** is an AI-powered competitor price tracking and dynamic pricing platform. This guide will help you get the entire project running with minimal effort.

> 📁 **Note:** All shell scripts are organized in the `scripts/` folder. Convenient wrapper scripts in the root directory automatically call them. See `scripts/README.md` for details.

---

## ⚡ One-Command Setup & Start

### First Time Setup
```bash
./setup.sh
```
This installs all dependencies (Node.js, Python, TypeScript compilation, Playwright browsers).

### Start Everything
```bash
./start.sh
```
Starts all 4 services:
- ✅ Frontend (React) - `http://localhost:3000`
- ✅ Backend API (Express) - `http://localhost:4000`
- ✅ Pricing Worker (Node.js + OpenAI)
- ✅ Scraper Worker (Python + Playwright)

**Note:** Runs in background. Use `./logs.sh` to view logs.

### Development Mode (with live console output)
```bash
./dev.sh
```
Same as `start.sh` but shows all logs in the terminal with color-coded prefixes. Best for debugging.

### Development Mode (with tmux split panes)
```bash
./dev-verbose.sh
```
Starts all services in separate tmux windows for maximum visibility. Requires tmux installed.

### Health Check
```bash
./check.sh
```
Verifies all dependencies and running services.

---

## 📋 Prerequisites

Make sure you have these installed:
- **Node.js** (v16+) - [Download](https://nodejs.org/)
- **Python 3** (v3.9+) - [Download](https://python.org/)
- **npm** (comes with Node.js)

---

## 🔧 Manual Setup (Alternative)

If you prefer manual control:

### 1. Install Frontend Dependencies
```bash
npm install
```

### 2. Install Backend Dependencies
```bash
cd server
npm install
npm run build
cd ..
```

### 3. Install Python Dependencies
```bash
pip3 install -r server/workers/scraper_worker/requirements.txt
pip3 install -r server/backend_src/ML_model/requirement.txt
python3 -m playwright install chromium
```

---

## 🎯 Running Services Individually

### Frontend Only
```bash
npm start
```
Runs on `http://localhost:3000`

### Backend API Only
```bash
cd server
npm run build  # First time only
npm start
```
Runs on `http://localhost:4000` (or port specified in .env)

### Pricing Worker Only
```bash
cd server
npm run pricing-worker
```

### Scraper Worker Only
```bash
cd server
npm run scraper-worker
```

### All Backend Services (API + Workers)
```bash
cd server
./start-all.sh
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Firebase Configuration
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# Google Cloud (for Firestore)
GOOGLE_APPLICATION_CREDENTIALS=./server/service-account.json

# Backend Port (optional, defaults to 5000)
PORT=4000
```

### Firebase Service Account

Place your Firebase service account JSON file at:
```
server/service-account.json
```

---

## 📦 Project Structure

```
ProfitOptima-V2/
├── scripts/              # 📜 All shell scripts (organized)
│   ├── README.md         # Script documentation
│   ├── setup.sh          # Setup & dependencies
│   ├── start.sh          # Start all (background)
│   ├── dev.sh            # Start with visible logs
│   ├── dev-verbose.sh    # Start with tmux
│   ├── stop.sh           # Stop all services
│   ├── check.sh          # Health check
│   ├── logs.sh           # Log viewer
│   ├── free-ports.sh     # Port cleanup
│   └── verify-fixes.sh   # Pre-flight check
│
├── setup.sh              # 🔧 Wrapper → scripts/setup.sh
├── start.sh              # 🚀 Wrapper → scripts/start.sh
├── dev.sh                # 💻 Wrapper → scripts/dev.sh
├── check.sh              # ✅ Wrapper → scripts/check.sh
├── stop.sh               # 🛑 Wrapper → scripts/stop.sh
│
├── logs/                 # 📝 Service logs
│
├── src/                  # Frontend (React)
│   ├── components/
│   ├── pages/
│   └── services/
│
└── server/               # Backend
    ├── backend_src/      # TypeScript source
    │   ├── index.ts
    │   ├── lib/
    │   ├── services/
    │   └── workers/
    │
    ├── workers/
    │   └── scraper_worker/  # Python scraper
    │
    └── dist/             # Compiled JavaScript
```

---

## 🔍 Viewing Logs

### Using the Log Viewer (Recommended)
```bash
./logs.sh
```
Interactive menu to view logs from any service in real-time.

### Manual Log Viewing

Logs are stored in the `logs/` directory when using `./start.sh`:

```bash
# View backend logs
tail -f logs/backend.log

# View pricing worker logs
tail -f logs/pricing-worker.log

# View scraper worker logs
tail -f logs/scraper-worker.log

# View frontend logs
tail -f logs/frontend.log

# View all logs at once
tail -f logs/*.log
```

---

## 🛠️ Common Commands

| Task | Command |
|------|---------|
| **Full setup** | `./setup.sh` |
| **Start all (background)** | `./start.sh` |
| **Start all (visible logs)** | `./dev.sh` |
| **Start all (tmux)** | `./dev-verbose.sh` |
| **View logs** | `./logs.sh` |
| **Health check** | `./check.sh` |
| **Stop all services** | `./stop.sh` |
| **Build backend** | `cd server && npm run build` |
| **Watch backend** | `cd server && npm run build:watch` |

---

## 🚨 Troubleshooting

### Port Already in Use
If port 3000 or 5000 is already in use:
- Frontend: The system will prompt to use another port
- Backend: Change `PORT` in `.env` file

### TypeScript Build Errors
```bash
cd server
npm run build
```
Check the output for errors.

### Python Dependencies Missing
```bash
pip3 install -r server/workers/scraper_worker/requirements.txt
python3 -m playwright install chromium
```

### Firebase Connection Issues
- Ensure `service-account.json` exists in `server/`
- Verify `GOOGLE_APPLICATION_CREDENTIALS` in `.env`
- Check Firebase project permissions

### Workers Not Processing
- Verify OpenAI API key is set
- Check Firebase Firestore has collections: `scrapeJobs`, `priceSnapshots`
- View worker logs for specific errors

---

## 🎓 Development Workflow

### For Quick Testing (Background Mode)
```bash
./start.sh    # Start all services
./logs.sh     # View logs when needed
./stop.sh     # Stop when done
```

### For Active Development (Visible Logs)
```bash
./dev.sh      # All logs in terminal with color prefixes
# Press Ctrl+C to stop
```

### For Maximum Visibility (tmux)
```bash
./dev-verbose.sh    # Each service in separate window
# Use Ctrl+B then D to detach
# Use 'tmux attach -t profitoptima' to reconnect
```

### Making Backend Changes
```bash
# Terminal 1: Watch TypeScript compilation
cd server && npm run build:watch

# Terminal 2: Run backend with auto-reload
cd server && npm run dev
```

### Testing Workers
```bash
# Pricing worker
cd server && npm run pricing-worker

# Scraper worker
cd server && npm run scraper-worker
```

---

## 📚 Additional Resources

- [Frontend README](./README.md)
- [Backend Architecture](./server/backend_src/ARCHITECTURE.md)
- [Firebase Setup](./FIREBASE_SETUP.md)
- [Azure Deployment](./AZURE_DEPLOYMENT_GUIDE.md)

---

## 🤝 Support

If you encounter issues:
1. Run `./check.sh` to diagnose problems
2. Check logs in `logs/` directory
3. Ensure all environment variables are configured
4. Verify Firebase and OpenAI credentials

---

**Happy coding! 🎉**
