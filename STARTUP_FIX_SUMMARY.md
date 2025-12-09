# Startup Script Fixes

## Issues Found

### 1. Frontend Port Conflict
**Problem**: Frontend was trying to use port 5000 (same as backend)
**Solution**: Explicitly set `PORT=3000` for the frontend process

### 2. Pricing Worker Firebase Credentials
**Problem**: Pricing worker couldn't find Firebase service account credentials
**Solution**: Export `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable from the service-account.json file before starting workers

## Changes Made to start.sh

1. Added Firebase credentials export:
   ```bash
   if [ -z "$FIREBASE_SERVICE_ACCOUNT_KEY" ] && [ -f "server/service-account.json" ]; then
       export FIREBASE_SERVICE_ACCOUNT_KEY=$(cat server/service-account.json | tr -d '\n')
   fi
   ```

2. Pass credentials to pricing worker:
   ```bash
   FIREBASE_SERVICE_ACCOUNT_KEY="$FIREBASE_SERVICE_ACCOUNT_KEY" node dist/workers/pricingWorker.js
   ```

3. Set explicit port for frontend:
   ```bash
   PORT=3000 BROWSER=none npm start
   ```

## Testing

Run the updated script:
```bash
./start.sh
```

All four services should now start successfully:
- ✓ Frontend (port 3000)
- ✓ Backend (port 5000)
- ✓ Pricing Worker
- ✓ Scraper Worker

Verify with:
```bash
./check.sh
```
