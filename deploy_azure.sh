#!/bin/bash

# Azure Deployment Script for ProfitOptima Pricing System
# This script deploys both the Pricing API and Scraper Function to Azure

set -e  # Exit on any error

# Configuration Variables
RESOURCE_GROUP="pricing-system-rg"
LOCATION="eastus"
ACR_NAME="pricingacr"
PRICING_API_NAME="pricing-api"
CONTAINER_ENV_NAME="pricing-env"
FUNCTION_APP_NAME="scraper-func-app"
STORAGE_ACCOUNT_NAME="scraperstorage123"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}   ProfitOptima Azure Deployment Script    ${NC}"
echo -e "${BLUE}=============================================${NC}"

# Check if user is logged in to Azure
echo -e "\n${YELLOW}Checking Azure login status...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${RED}Not logged in to Azure. Please run 'az login' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Azure login verified${NC}"

# Function to check if resource exists
resource_exists() {
    local resource_type=$1
    local name=$2
    local rg=$3
    
    if az $resource_type show --name $name --resource-group $rg &> /dev/null; then
        return 0
    else
        return 1
    fi
}

#######################################
# STEP 1: Create Resource Group
#######################################
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 1: Creating Resource Group${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if az group exists --name $RESOURCE_GROUP | grep -q true; then
    echo -e "${YELLOW}Resource group already exists${NC}"
else
    echo "Creating resource group: $RESOURCE_GROUP"
    az group create \
        --name $RESOURCE_GROUP \
        --location $LOCATION
    echo -e "${GREEN}✓ Resource group created${NC}"
fi

#######################################
# STEP 2: Create Container Registry
#######################################
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 2: Setting up Container Registry${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if resource_exists "acr" $ACR_NAME $RESOURCE_GROUP; then
    echo -e "${YELLOW}ACR already exists${NC}"
else
    echo "Creating Azure Container Registry: $ACR_NAME"
    az acr create \
        --resource-group $RESOURCE_GROUP \
        --name $ACR_NAME \
        --sku Basic
    echo -e "${GREEN}✓ ACR created${NC}"
fi

# Enable admin access
echo "Enabling admin access on ACR..."
az acr update --name $ACR_NAME --admin-enabled true

# Get credentials
echo -e "\n${YELLOW}ACR Credentials:${NC}"
az acr credential show --name $ACR_NAME

#######################################
# STEP 3: Build and Push Docker Image
#######################################
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 3: Building and Pushing Docker Image${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Login to ACR
echo "Logging in to ACR..."
az acr login --name $ACR_NAME

# Navigate to pricing_api folder
cd server/backend_src/price_api

# Build image
echo "Building Docker image..."
docker build -t pricing-api:latest .

# Tag for ACR
echo "Tagging image for ACR..."
docker tag pricing-api:latest $ACR_NAME.azurecr.io/pricing-api:latest

# Push to ACR
echo "Pushing image to ACR..."
docker push $ACR_NAME.azurecr.io/pricing-api:latest

echo -e "${GREEN}✓ Docker image pushed to ACR${NC}"

# Go back to root
cd ../../..

# Verify image
echo -e "\n${YELLOW}Images in registry:${NC}"
az acr repository list --name $ACR_NAME --output table

#######################################
# STEP 4: Deploy Container App
#######################################
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 4: Deploying Pricing API to Container Apps${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Create Container Apps environment
if ! az containerapp env show --name $CONTAINER_ENV_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo "Creating Container Apps environment..."
    az containerapp env create \
        --name $CONTAINER_ENV_NAME \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION
    echo -e "${GREEN}✓ Container Apps environment created${NC}"
else
    echo -e "${YELLOW}Container Apps environment already exists${NC}"
fi

# Deploy the container
if ! az containerapp show --name $PRICING_API_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo "Deploying container app..."
    az containerapp create \
        --name $PRICING_API_NAME \
        --resource-group $RESOURCE_GROUP \
        --environment $CONTAINER_ENV_NAME \
        --image $ACR_NAME.azurecr.io/pricing-api:latest \
        --target-port 8000 \
        --ingress external \
        --registry-server $ACR_NAME.azurecr.io \
        --cpu 0.5 \
        --memory 1.0Gi
    echo -e "${GREEN}✓ Container app deployed${NC}"
else
    echo -e "${YELLOW}Container app already exists, updating...${NC}"
    az containerapp update \
        --name $PRICING_API_NAME \
        --resource-group $RESOURCE_GROUP \
        --image $ACR_NAME.azurecr.io/pricing-api:latest
    echo -e "${GREEN}✓ Container app updated${NC}"
fi

# Get API URL
API_URL=$(az containerapp show \
    --name $PRICING_API_NAME \
    --resource-group $RESOURCE_GROUP \
    --query properties.configuration.ingress.fqdn \
    --output tsv)

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Pricing API is live at: https://$API_URL${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

#######################################
# STEP 5: Create Storage Account
#######################################
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 5: Creating Storage Account for Functions${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if ! az storage account show --name $STORAGE_ACCOUNT_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo "Creating storage account..."
    az storage account create \
        --name $STORAGE_ACCOUNT_NAME \
        --location $LOCATION \
        --resource-group $RESOURCE_GROUP \
        --sku Standard_LRS
    echo -e "${GREEN}✓ Storage account created${NC}"
else
    echo -e "${YELLOW}Storage account already exists${NC}"
fi

#######################################
# STEP 6: Create Function App
#######################################
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 6: Creating Azure Function App${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if ! az functionapp show --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo "Creating Function App..."
    az functionapp create \
        --resource-group $RESOURCE_GROUP \
        --consumption-plan-location $LOCATION \
        --runtime python \
        --runtime-version 3.11 \
        --functions-version 4 \
        --name $FUNCTION_APP_NAME \
        --storage-account $STORAGE_ACCOUNT_NAME \
        --os-type Linux
    echo -e "${GREEN}✓ Function App created${NC}"
else
    echo -e "${YELLOW}Function App already exists${NC}"
fi

#######################################
# STEP 7: Deploy Function Code
#######################################
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 7: Deploying Scraper Function${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd server/backend_src/scapper

echo "Deploying function code..."
func azure functionapp publish $FUNCTION_APP_NAME --python

cd ../../..

echo -e "${GREEN}✓ Function deployed${NC}"

#######################################
# STEP 8: Get URLs and Keys
#######################################
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 8: Retrieving URLs and Keys${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Get Function URL
FUNCTION_URL=$(az functionapp function show \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --function-name scrape_prices \
    --query invokeUrlTemplate \
    --output tsv 2>/dev/null || echo "Function not found - may need to wait for deployment")

# Get Function Key
FUNCTION_KEYS=$(az functionapp keys list \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --output json)

#######################################
# DEPLOYMENT SUMMARY
#######################################
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   ✓ DEPLOYMENT COMPLETED SUCCESSFULLY   ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${YELLOW}📋 DEPLOYMENT SUMMARY:${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Resource Group:${NC} $RESOURCE_GROUP"
echo -e "${BLUE}Location:${NC} $LOCATION"
echo -e ""
echo -e "${YELLOW}🚀 PRICING API:${NC}"
echo -e "  URL: https://$API_URL"
echo -e "  Health Check: https://$API_URL/health"
echo -e "  Predict Endpoint: https://$API_URL/predict-prices"
echo -e ""
echo -e "${YELLOW}⚡ SCRAPER FUNCTION:${NC}"
echo -e "  URL: $FUNCTION_URL"
echo -e ""
echo -e "${YELLOW}📝 NEXT STEPS:${NC}"
echo -e "1. Set environment variables for Function App:"
echo -e "   ${BLUE}az functionapp config appsettings set \\${NC}"
echo -e "   ${BLUE}  --name $FUNCTION_APP_NAME \\${NC}"
echo -e "   ${BLUE}  --resource-group $RESOURCE_GROUP \\${NC}"
echo -e "   ${BLUE}  --settings N8N_WEBHOOK_URL=\"YOUR_N8N_URL\" FIREBASE_CREDENTIALS='{...}'${NC}"
echo -e ""
echo -e "2. Run the test script:"
echo -e "   ${BLUE}python test_deployment.py${NC}"
echo -e ""
echo -e "3. Monitor costs:"
echo -e "   ${BLUE}az consumption usage list --start-date \$(date +%Y-%m-01) --end-date \$(date +%Y-%m-%d)${NC}"

# Save deployment info to file
cat > deployment_info.txt << EOF
ProfitOptima Azure Deployment Information
Generated: $(date)

PRICING API
-----------
URL: https://$API_URL
Health: https://$API_URL/health
Predict: https://$API_URL/predict-prices

SCRAPER FUNCTION
---------------
URL: $FUNCTION_URL

Function Keys:
$FUNCTION_KEYS

RESOURCE GROUP
--------------
Name: $RESOURCE_GROUP
Location: $LOCATION

To update environment variables:
az functionapp config appsettings set --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --settings KEY=VALUE
EOF

echo -e "\n${GREEN}✓ Deployment info saved to: deployment_info.txt${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
