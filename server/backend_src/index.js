import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Debug: Check if environment variables are loaded
console.log('🔧 Environment check:');
console.log('  PORT:', process.env.PORT || '(using default 4000)');
console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
console.log('  SCRAPERAPI_KEY:', process.env.SCRAPERAPI_KEY ? '✅ Set' : '❌ Missing');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes (migrated to TypeScript in dist/index.js)
// This JS file is kept minimal to avoid stale imports.
app.get('/api', (_req, res) => {
  res.json({ status: 'ok', message: 'Use compiled dist/index.js for full API' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'ProfitOptima Backend Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});
