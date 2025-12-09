# Azure Deployment Guide for ProfitOptima

Complete guide to deploy your pricing system to Azure Cloud.

## 📋 Prerequisites

Before starting, ensure you have:

1. **Azure CLI** installed and logged in
   ```bash
   # Install Azure CLI (macOS)
   brew install azure-cli
   
   # Login to Azure
   az login
   ```

2. **Docker** installed and running
   ```bash
   # Verify Docker is running
   docker --version
   ```

3. **Azure Functions Core Tools** installed
   ```bash
   # Install Functions Core Tools
   npm install -g azure-functions-core-tools@4
   
   # Verify installation
   func --version
   ```

4. **jq** (JSON processor) for configuration script
   ```bash
   brew install jq
   ```

## 🚀 Quick Deployment (Recommended)

Run the automated deployment script:

```bash
cd /Users/ashmit/Documents/GitHub/ProfitOptima
./deploy_azure.sh
```

This script will:
- ✅ Create resource group
- ✅ Set up Azure Container Registry
- ✅ Build and push Docker image
- ✅ Deploy Pricing API to Container Apps
- ✅ Create Storage Account
- ✅ Deploy Scraper Function
- ✅ Generate deployment info file

**Estimated time:** 10-15 minutes

---

## 📝 Manual Step-by-Step Deployment

If you prefer manual deployment or need to troubleshoot:

### Step 1: Create Resource Group

```bash
az group create \
  --name pricing-system-rg \
  --location eastus

# Verify
az group show --name pricing-system-rg
```

### Step 2: Create Azure Container Registry

```bash
# Create registry
az acr create \
  --resource-group pricing-system-rg \
  --name pricingacr \
  --sku Basic

# Enable admin access
az acr update --name pricingacr --admin-enabled true

# Get credentials (save these!)
az acr credential show --name pricingacr
```

### Step 3: Build and Push Pricing API

```bash
# Login to registry
az acr login --name pricingacr

# Navigate to pricing API
cd server/backend_src/price_api

# Build Docker image
docker build -t pricing-api:latest .

# Tag for Azure
docker tag pricing-api:latest pricingacr.azurecr.io/pricing-api:latest

# Push to registry
docker push pricingacr.azurecr.io/pricing-api:latest

# Verify
az acr repository list --name pricingacr --output table

# Go back to project root
cd ../../..
```

### Step 4: Deploy Pricing API

```bash
# Create Container Apps environment
az containerapp env create \
  --name pricing-env \
  --resource-group pricing-system-rg \
  --location eastus

# Deploy container
az containerapp create \
  --name pricing-api \
  --resource-group pricing-system-rg \
  --environment pricing-env \
  --image pricingacr.azurecr.io/pricing-api:latest \
  --target-port 8000 \
  --ingress external \
  --registry-server pricingacr.azurecr.io \
  --cpu 0.5 \
  --memory 1.0Gi

# Get your API URL
az containerapp show \
  --name pricing-api \
  --resource-group pricing-system-rg \
  --query properties.configuration.ingress.fqdn \
  --output tsv
```

**Save the URL!** It will look like: `https://pricing-api.blueforest-xxxxx.eastus.azurecontainerapps.io`

### Step 5: Test Pricing API

```bash
# Set your API URL
export PRICING_API_URL="https://your-url-here.azurecontainerapps.io"

# Test health endpoint
curl $PRICING_API_URL/health

# Test prediction (should return 3 strategies)
curl -X POST $PRICING_API_URL/predict-prices \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "TEST_001",
    "avg_competitor_price": 45.95,
    "min_competitor_price": 39.99,
    "max_competitor_price": 49.99,
    "cost_per_unit": 25.00,
    "price_std": 3.5
  }'
```

### Step 6: Create Storage Account

```bash
az storage account create \
  --name scraperstorage123 \
  --location eastus \
  --resource-group pricing-system-rg \
  --sku Standard_LRS
```

### Step 7: Create and Deploy Function App

```bash
# Create Function App
az functionapp create \
  --resource-group pricing-system-rg \
  --consumption-plan-location eastus \
  --runtime python \
  --runtime-version 3.11 \
  --functions-version 4 \
  --name scraper-func-app \
  --storage-account scraperstorage123 \
  --os-type Linux

# Navigate to scraper folder
cd server/backend_src/scapper

# Deploy function
func azure functionapp publish scraper-func-app

# Go back to root
cd ../../..
```

### Step 8: Configure Function Environment Variables

Run the interactive configuration script:

```bash
./configure_functions.sh
```

Or set manually:

```bash
# Set N8N webhook URL
az functionapp config appsettings set \
  --name scraper-func-app \
  --resource-group pricing-system-rg \
  --settings N8N_WEBHOOK_URL="YOUR_N8N_URL"

# Set Firebase credentials
az functionapp config appsettings set \
  --name scraper-func-app \
  --resource-group pricing-system-rg \
  --settings FIREBASE_CREDENTIALS="$(cat server/serivceAccount.json | jq -c .)"

# Set ScraperAPI key (optional)
az functionapp config appsettings set \
  --name scraper-func-app \
  --resource-group pricing-system-rg \
  --settings SCRAPERAPI_KEY="YOUR_KEY"
```

### Step 9: Get Function URL and Key

```bash
# Get function URL
az functionapp function show \
  --name scraper-func-app \
  --resource-group pricing-system-rg \
  --function-name scrape_prices \
  --query invokeUrlTemplate \
  --output tsv

# Get function key
az functionapp keys list \
  --name scraper-func-app \
  --resource-group pricing-system-rg
```

---

## 🧪 Testing Your Deployment

### Option 1: Use the Test Script

```bash
# Set environment variables
export PRICING_API_URL="https://your-pricing-api-url.azurecontainerapps.io"
export FUNCTION_KEY="your-function-key"
export SCRAPER_URL="https://scraper-func-app.azurewebsites.net/api/scrape_prices"

# Run tests
python test_deployment.py
```

### Option 2: Manual Testing

Test Pricing API:
```bash
curl -X POST $PRICING_API_URL/predict-prices \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "PROD_123",
    "avg_competitor_price": 45.95,
    "min_competitor_price": 39.99,
    "max_competitor_price": 49.99,
    "cost_per_unit": 25.00,
    "price_std": 3.5
  }'
```

Test Scraper Function:
```bash
curl -X POST "$SCRAPER_URL?code=$FUNCTION_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "PROD_123",
    "competitor_urls": [
      "https://example.com/product1",
      "https://example.com/product2"
    ]
  }'
```

---

## 💰 Cost Management

### Check Current Spending

```bash
# View this month's usage
az consumption usage list \
  --start-date $(date +%Y-%m-01) \
  --end-date $(date +%Y-%m-%d) \
  --output table
```

### View All Resources

```bash
az resource list \
  --resource-group pricing-system-rg \
  --output table
```

### Expected Costs (Approximate)

- **Container Apps**: ~$0.20/day (with minimal usage)
- **Azure Functions**: Consumption plan - pay per execution (~$0.20/million executions)
- **Container Registry**: Basic tier - $5/month
- **Storage Account**: ~$0.01/day

**Total estimated cost**: ~$10-15/month with light usage

---

## 🔄 Updating Your Deployment

### Update Pricing API

```bash
cd server/backend_src/price_api

# Rebuild image
docker build -t pricing-api:latest .
docker tag pricing-api:latest pricingacr.azurecr.io/pricing-api:latest
docker push pricingacr.azurecr.io/pricing-api:latest

# Update container app
az containerapp update \
  --name pricing-api \
  --resource-group pricing-system-rg \
  --image pricingacr.azurecr.io/pricing-api:latest

cd ../../..
```

### Update Scraper Function

```bash
cd server/backend_src/scapper
func azure functionapp publish scraper-func-app
cd ../../..
```

---

## 🐛 Troubleshooting

### View Pricing API Logs

```bash
az containerapp logs show \
  --name pricing-api \
  --resource-group pricing-system-rg \
  --follow
```

### View Function Logs

```bash
az functionapp log tail \
  --name scraper-func-app \
  --resource-group pricing-system-rg
```

### Common Issues

**Issue:** Docker push fails
```bash
# Solution: Re-login to ACR
az acr login --name pricingacr
```

**Issue:** Container app not accessible
```bash
# Solution: Check ingress settings
az containerapp ingress show \
  --name pricing-api \
  --resource-group pricing-system-rg
```

**Issue:** Function not triggering
```bash
# Solution: Check environment variables
az functionapp config appsettings list \
  --name scraper-func-app \
  --resource-group pricing-system-rg
```

---

## 🗑️ Clean Up Resources

To delete everything and stop charges:

```bash
# Delete entire resource group (removes all resources)
az group delete \
  --name pricing-system-rg \
  --yes \
  --no-wait

# Verify deletion
az group exists --name pricing-system-rg
```

---

## 📚 Additional Resources

- [Azure Container Apps Documentation](https://docs.microsoft.com/azure/container-apps/)
- [Azure Functions Python Guide](https://docs.microsoft.com/azure/azure-functions/functions-reference-python)
- [Azure Container Registry](https://docs.microsoft.com/azure/container-registry/)

---

## 🎯 Next Steps

After successful deployment:

1. **Integrate with Frontend**: Update your React app to use the deployed API URLs
2. **Set Up Monitoring**: Configure Application Insights for production monitoring
3. **Configure CI/CD**: Set up GitHub Actions for automated deployments
4. **Add Authentication**: Implement API keys or OAuth for production security
5. **Scale Up**: Adjust CPU/memory based on actual usage patterns

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review deployment logs
3. Verify all environment variables are set correctly
4. Check `deployment_info.txt` for your specific URLs and keys
