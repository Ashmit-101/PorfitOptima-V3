#!/bin/bash

echo "🔍 Verifying startup fixes..."
echo ""

# Check 1: Service account file
if [ -f "server/service-account.json" ]; then
    echo "✅ service-account.json exists"
else
    echo "❌ service-account.json missing"
    exit 1
fi

# Check 2: Backend build
if [ -f "server/dist/index.js" ]; then
    echo "✅ Backend built"
else
    echo "❌ Backend not built - run: cd server && npm run build"
    exit 1
fi

# Check 3: Pricing worker build
if [ -f "server/dist/workers/pricingWorker.js" ]; then
    echo "✅ Pricing worker built"
else
    echo "❌ Pricing worker not built"
    exit 1
fi

# Check 4: Dependencies
if [ -d "node_modules" ] && [ -d "server/node_modules" ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ Dependencies missing - run: ./setup.sh"
    exit 1
fi

echo ""
echo "✅ All prerequisites met! Ready to run ./start.sh"
