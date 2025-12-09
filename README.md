# ProfitOptima 🚀

AI-powered product pricing optimization dashboard with competitor tracking and real-time profit analysis.

---

## ⚡ Quick Start (60 seconds)

```bash
# 1. Install everything
./setup.sh

# 2. Configure (add your API keys to .env)
nano .env

# 3. Start all services
./start.sh
```

**That's it!** Open `http://localhost:3000` 🎉

📖 **New here?** Read [QUICKSTART.md](./QUICKSTART.md) for detailed instructions.  
📝 **Need commands?** Check [CHEATSHEET.md](./CHEATSHEET.md) for all commands.

---

## Features

- 📊 **Product Dashboard**: Manage your product portfolio with real-time metrics
- 💰 **Profit Calculator**: Multi-step form with automatic margin calculations
- 🔥 **Firebase Integration**: Cloud storage with user authentication
- 🔐 **Authentication**: Email/password + Google OAuth sign-in
- 🤖 **AI Pricing**: GPT-4 powered pricing recommendations
- 🔍 **Competitor Tracking**: Automated price scraping and analysis

## Prerequisites

- Node.js 18+ installed
- Python 3.9+ installed
- Firebase account ([console.firebase.google.com](https://console.firebase.google.com))
- OpenAI API key ([platform.openai.com/api-keys](https://platform.openai.com/api-keys))

## Installation

### Automated Setup (Recommended)

```bash
./setup.sh
```

This installs all Node.js dependencies, Python packages, and compiles TypeScript.

### Manual Setup (Alternative)

```bash
npm install
```

### 2. Setup Backend

```bash
cd server
npm install
```

### 3. Configure Environment Variables

#### Frontend (root directory)
Copy the provided sample file and adjust if needed:
```bash
cp .env.example .env
```

Ensure `.env` contains:
```env
REACT_APP_API_BASE_URL=http://localhost:4000
```

#### Backend (server directory)
Create `server/.env`:
```env
PORT=4000
OPENAI_API_KEY=sk-your-openai-api-key-here
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json
```

### 4. Get Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → **Project Settings** (⚙️) → **Service Accounts**
3. Click **"Generate New Private Key"**
4. Save the JSON file as `server/serviceAccount.json`

### 5. Get OpenAI API Key

1. Visit [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy and paste it into `server/.env`

### 6. Start the Application

**Terminal 1 - Start Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Start Frontend:**
```bash
npm start
```

The app will open at **http://localhost:3000** with the backend running on **http://localhost:4000**.

## Project Structure

```
ProfitOptima/
├── src/                          # React frontend
│   ├── components/
│   │   ├── auth/                # Login & Signup
│   │   ├── common/              # Reusable components
│   │   ├── competitors/         # Competitor tracking
│   │   ├── dashboard/           # Dashboard components
│   │   └── layout/              # Header, Sidebar, Layout
│   ├── contexts/                # Auth context
│   ├── firebase/                # Firebase config
│   ├── pages/                   # Main pages
│   ├── services/                # API services
│   └── app.js                   # Main app component
├── server/                      # Node.js backend
│   ├── src/
│   │   ├── index.js            # Express server
│   │   ├── routes/             # API routes
│   │   └── services/           # Business logic
│   └── package.json
├── public/
└── package.json
```

## Tech Stack

**Frontend:**
- React 18.2.0
- React Router 6.11.0
- Firebase 9.22.0 (Auth + Firestore)
- TailwindCSS (styling)

**Backend:**
- Node.js + Express
- OpenAI GPT-4 API
- Firebase Admin SDK
- Cheerio (web scraping)
- Undici (HTTP client)

## Usage Guide

### 1. Sign Up / Log In
- Create an account or sign in with Google
- Your data is isolated per user

### 2. Add Products
1. Click **"Add Product"** button
2. Fill in the 4-step form:
   - **Basic Info**: Name, description, category
   - **Cost Structure**: Manufacturing, shipping costs
   - **Pricing**: Selling price, fees, marketing costs
   - **Competitors**: Add competitor URLs
3. Click **"Create Product"**

### 3. Track Competitors
1. Open a product with competitor URLs
2. Go to the **Competitors** tab
3. Click **"Sync Competitor Prices"**
4. Get AI-powered pricing recommendations
5. Apply suggested prices with one click

### 4. Analyze Metrics
- View profit margins, net profit, and cost breakdowns
- Filter products by category or status
- Track low-margin alerts

## API Endpoints

### Backend API (`http://localhost:4000`)

#### Sync Competitor Prices
```
POST /api/competitors/sync
```

#### Update Product Price
```
POST /api/products/:productId/price
```

#### Health Check
```
GET /health
```

See `server/README.md` for detailed API documentation.

## Troubleshooting

### Connection Refused Error
- **Cause**: Backend server not running
- **Fix**: Open a terminal and run `cd server && npm start`

### Firebase Error
- **Cause**: Missing service account file
- **Fix**: Download `serviceAccount.json` from Firebase Console

### OpenAI API Error
- **Cause**: Invalid or missing API key
- **Fix**: Check `server/.env` has valid `OPENAI_API_KEY`

### Environment Variables Not Loading
- **Cause**: React app running before `.env` was created
- **Fix**: Stop React app (`Ctrl+C`) and restart with `npm start`

## Development

### Run Backend in Development Mode
```bash
cd server
npm install -g nodemon
nodemon src/index.js
```

### Check Backend Status
```bash
curl http://localhost:4000/health
```

## Security Notes

- ⚠️ **Never commit** `.env` files or `serviceAccount.json` to Git
- 🔒 Both files are already in `.gitignore`
- 🔑 Keep your API keys secure

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
