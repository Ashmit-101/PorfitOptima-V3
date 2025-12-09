"""
Test deployed pricing system end-to-end
Run this after deploying to Azure to verify everything works
"""
import requests
import json
import os
import sys
from datetime import datetime

# CONFIGURE THESE - Update after deployment
SCRAPER_URL = os.environ.get('SCRAPER_URL', "https://scraper-func-app.azurewebsites.net/api/scrape_prices")
FUNCTION_KEY = os.environ.get('FUNCTION_KEY', "")  # Get from deployment_info.txt
PRICING_API_URL = os.environ.get('PRICING_API_URL', "")  # Get from deployment_info.txt

def print_header(text):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)

def print_section(text):
    """Print a section header"""
    print(f"\n🔹 {text}")
    print("-" * 60)

def test_pricing_api_health():
    """Test 1: Check if Pricing API is alive"""
    print_section("Testing Pricing API Health")
    
    try:
        response = requests.get(f"{PRICING_API_URL}/health", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API Status: {data.get('status')}")
            print(f"✅ Models Loaded: {data.get('models_loaded')}")
            print(f"✅ Timestamp: {data.get('timestamp')}")
            return True
        else:
            print(f"❌ Health check failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_pricing_prediction():
    """Test 2: Get pricing recommendations"""
    print_section("Testing Pricing Prediction")
    
    test_data = {
        "product_id": "TEST_PRODUCT_001",
        "avg_competitor_price": 45.95,
        "min_competitor_price": 39.99,
        "max_competitor_price": 49.99,
        "cost_per_unit": 25.00,
        "price_std": 3.5
    }
    
    try:
        print(f"Sending request with data:")
        print(json.dumps(test_data, indent=2))
        
        response = requests.post(
            f"{PRICING_API_URL}/predict-prices",
            json=test_data,
            timeout=30
        )
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"\n✅ Successfully got pricing strategies!")
            print(f"Product ID: {data['product_id']}")
            print(f"Timestamp: {data['timestamp']}")
            
            strategies = data['strategies']
            
            print("\n📊 PRICING STRATEGIES:")
            print("━" * 60)
            
            # Revenue Maximization
            rev_max = strategies['revenue_maximization']
            print(f"\n💰 Revenue Maximization Strategy:")
            print(f"   Recommended Price: ${rev_max['recommended_price']:.2f}")
            print(f"   Predicted Revenue: ${rev_max['predicted_revenue']:.2f}")
            print(f"   Description: {rev_max['description']}")
            print(f"   Confidence: {rev_max['confidence']}")
            
            # Profit Maximization
            profit_max = strategies['profit_maximization']
            print(f"\n💎 Profit Maximization Strategy:")
            print(f"   Recommended Price: ${profit_max['recommended_price']:.2f}")
            print(f"   Predicted Profit: ${profit_max['predicted_profit']:.2f}")
            print(f"   Profit Margin: {profit_max['profit_margin_pct']:.1f}%")
            print(f"   Description: {profit_max['description']}")
            print(f"   Confidence: {profit_max['confidence']}")
            
            # Competitive Undercut
            undercut = strategies['competitive_undercut']
            print(f"\n⚔️  Competitive Undercut Strategy:")
            print(f"   Recommended Price: ${undercut['recommended_price']:.2f}")
            print(f"   Predicted Demand: {undercut['predicted_demand']:.1f} units")
            print(f"   Estimated Revenue: ${undercut['estimated_revenue']:.2f}")
            print(f"   Description: {undercut['description']}")
            print(f"   Confidence: {undercut['confidence']}")
            
            # Market Context
            market = data['market_context']
            print(f"\n📈 Market Context:")
            print(f"   Avg Competitor Price: ${market['avg_competitor_price']:.2f}")
            print(f"   Min Competitor Price: ${market['min_competitor_price']:.2f}")
            print(f"   Max Competitor Price: ${market['max_competitor_price']:.2f}")
            print(f"   Your Cost: ${market['your_cost']:.2f}")
            
            return True
        else:
            print(f"❌ Prediction failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_scraper_function():
    """Test 3: Trigger scraper function"""
    print_section("Testing Scraper Function")
    
    if not FUNCTION_KEY:
        print("⚠️  FUNCTION_KEY not set - skipping scraper test")
        print("   Set it in environment or update test_deployment.py")
        return None
    
    test_data = {
        "product_id": "TEST_PRODUCT_001",
        "competitor_urls": [
            "https://www.amazon.com/dp/B08N5WRWNW",  # Example product
            "https://www.walmart.com/ip/12345"
        ]
    }
    
    try:
        print(f"Sending scrape request...")
        print(f"Product ID: {test_data['product_id']}")
        print(f"URLs: {len(test_data['competitor_urls'])} competitors")
        
        response = requests.post(
            f"{SCRAPER_URL}?code={FUNCTION_KEY}",
            json=test_data,
            timeout=120  # Scraping can take time
        )
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Scraping completed successfully!")
            
            if 'summary' in data:
                summary = data['summary']
                print(f"\n📊 Scraping Results:")
                print(f"   Avg Price: ${summary.get('avg_price', 0):.2f}")
                print(f"   Min Price: ${summary.get('min_price', 0):.2f}")
                print(f"   Max Price: ${summary.get('max_price', 0):.2f}")
                print(f"   Competitors Scraped: {summary.get('competitors_scraped', 0)}")
            
            return True
        else:
            print(f"❌ Scraping failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_complete_workflow():
    """Test 4: Complete workflow - Scrape then Price"""
    print_section("Testing Complete Workflow")
    
    print("This test would:")
    print("1. Scrape competitor prices")
    print("2. Use scraped data to get pricing recommendations")
    print("3. Store results in database")
    print("\n⚠️  Requires N8N webhook and Firebase configured")
    print("   Run individual tests first to verify each component")

def main():
    """Run all tests"""
    print_header("🚀 ProfitOptima Deployment Test Suite")
    
    # Check configuration
    if not PRICING_API_URL:
        print("\n❌ PRICING_API_URL not configured!")
        print("   Please set it in environment or update test_deployment.py")
        print("   Get the URL from deployment_info.txt")
        sys.exit(1)
    
    print(f"\n📝 Configuration:")
    print(f"   Pricing API: {PRICING_API_URL}")
    print(f"   Scraper URL: {SCRAPER_URL}")
    print(f"   Function Key: {'✅ Set' if FUNCTION_KEY else '❌ Not set'}")
    
    results = {}
    
    # Test 1: API Health
    results['health'] = test_pricing_api_health()
    
    # Test 2: Pricing Prediction
    if results['health']:
        results['prediction'] = test_pricing_prediction()
    else:
        print("\n⚠️  Skipping prediction test - health check failed")
        results['prediction'] = False
    
    # Test 3: Scraper (optional if key provided)
    if FUNCTION_KEY:
        results['scraper'] = test_scraper_function()
    else:
        results['scraper'] = None
    
    # Test 4: Workflow info
    test_complete_workflow()
    
    # Summary
    print_header("📊 Test Results Summary")
    
    total_tests = sum(1 for v in results.values() if v is not None)
    passed_tests = sum(1 for v in results.values() if v is True)
    
    print(f"\n✅ Passed: {passed_tests}/{total_tests}")
    
    for test_name, result in results.items():
        if result is True:
            print(f"   ✅ {test_name}")
        elif result is False:
            print(f"   ❌ {test_name}")
        else:
            print(f"   ⏭️  {test_name} (skipped)")
    
    if passed_tests == total_tests and total_tests > 0:
        print("\n🎉 All tests passed! Your system is working correctly!")
    elif passed_tests > 0:
        print("\n⚠️  Some tests passed, but check the failures above")
    else:
        print("\n❌ All tests failed - check your deployment configuration")
    
    print("\n" + "=" * 60)

if __name__ == '__main__':
    main()
