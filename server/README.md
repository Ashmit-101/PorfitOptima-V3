# ProfitOptima Backend Server

Node.js/Express backend for competitor price scraping and AI-powered pricing recommendations.

## Features

- 🔍 **Web Scraping**: Scrape competitor prices using Cheerio
- 🤖 **AI Pricing**: GPT-4 powered pricing recommendations
- 🔥 **Firebase Admin**: Server-side Firestore integration
- 🚀 **REST API**: Clean API endpoints for the React frontend

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Get OpenAI API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the API key (starts with `sk-...`)

### 3. Get Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon) → **Service Accounts**
4. Click **"Generate New Private Key"**
5. Save the JSON file as `serviceAccount.json` in the `server` directory

### 4. Configure Environment Variables

Create a `.env` file in the `server` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
PORT=4000
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json
```

### 5. Start the Server

```bash
npm start
```

The server will run on **http://localhost:4000**

## API Endpoints

### Health Check
```
GET /health
```

### Sync Competitor Prices
```
POST /api/competitors/sync

Body:
{
  "userId": "string",
  "productId": "string",
  "productName": "string",
  "currentPrice": number,
  "cost": number,
  "urls": ["url1", "url2", "url3"]
}

Response:
{
  "success": true,
  "data": {
    "competitors": [...],
    "aiInsight": {
      "suggestedPrice": number,
      "reasoning": "string",
      "confidence": "high/medium/low",
      "strategy": "competitive/premium/maintain"
    },
    "lastSync": "ISO date string"
  }
}
```

### Update Product Price
```
POST /api/products/:productId/price

Body:
{
  "userId": "string",
  "suggestedPrice": number
}

Response:
{
  "success": true,
  "message": "Price updated successfully",
  "newPrice": number
}
```

## Project Structure

```
server/
├── backend_src/
│   ├── index.js              # Express server setup
│   ├── routes/
│   │   └── competitors.js    # API routes
│   └── services/
│       ├── firestore.js      # Firebase Admin SDK
│       ├── scrape.js         # Web scraping with Cheerio
│       └── pricing.js        # OpenAI GPT-4 integration
├── package.json
├── .env                       # Environment variables (create this)
├── .env.example              # Environment template
└── serviceAccount.json       # Firebase credentials (download this)
```

## Troubleshooting

### "GOOGLE_APPLICATION_CREDENTIALS not set"
- Make sure you've downloaded the Firebase service account JSON
- Place it in the `server` directory as `serviceAccount.json`
- Verify `.env` has: `GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json`

### "OpenAI API Error"
- Check your API key is correct in `.env`
- Ensure you have credits in your OpenAI account
- Visit [https://platform.openai.com/account/usage](https://platform.openai.com/account/usage)

### "Port 4000 already in use"
- Change the port in `.env`: `PORT=5000`
- Or stop the process using port 4000

### Scraping not finding prices
- Some websites block scrapers
- Try adding more competitor URLs
- The AI will still provide recommendations based on available data

## Development

To run with auto-reload during development, install nodemon:

```bash
npm install -g nodemon
nodemon backend_src/index.js
```

## Frontend Configuration

Update your React app's API base URL. Create a `.env` file in the root directory (not in server):

```env
REACT_APP_API_BASE_URL=http://localhost:4000
```

Then update `src/services/competitorService.js`:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';
```

## License

MIT
