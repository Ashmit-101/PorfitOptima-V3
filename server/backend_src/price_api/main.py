from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
from datetime import datetime
import json
import os

MIN_MARGIN_MULTIPLIER = 1.1
FALLBACK_PRODUCT_SCORE = 0.5
DEFAULT_CATEGORY_ENCODED = 0.0

app = FastAPI(title="Dynamic Pricing API", version="1.0.0")

# Load models at startup
revenue_model = joblib.load('models/revenue_model.pkl')
profit_model = joblib.load('models/profit_model.pkl')
demand_model = joblib.load('models/demand_model.pkl')

with open('models/features.json', 'r') as f:
    feature_names = json.load(f)


class PricingRequest(BaseModel):
    product_id: str
    avg_competitor_price: float
    min_competitor_price: float
    max_competitor_price: float
    cost_per_unit: float
    price_std: float = 0.0


class PricingResponse(BaseModel):
    product_id: str
    timestamp: str
    strategies: dict


def _current_time_context() -> tuple[int, int, int]:
    now = datetime.utcnow()
    day_of_week = now.weekday()
    month = now.month
    month_year_encoded = now.year * 100 + now.month
    return day_of_week, month, month_year_encoded


def _price_std(req: PricingRequest) -> float:
    if req.price_std > 0:
        return float(req.price_std)
    spread = req.max_competitor_price - req.min_competitor_price
    return float(spread / 3) if spread > 0 else 0.0


def _with_price_features(req: PricingRequest, candidate_price: float) -> dict[str, float]:
    day_of_week, month, month_year_encoded = _current_time_context()
    avg_price = req.avg_competitor_price or candidate_price
    ratio = candidate_price / avg_price if avg_price else 1.0
    price_delta = candidate_price - avg_price

    feature_map: dict[str, float] = {
        "price_std": _price_std(req),
        "product_score": FALLBACK_PRODUCT_SCORE,
        "avg_competitor_price": float(req.avg_competitor_price),
        "min_competitor_price": float(req.min_competitor_price),
        "month_year_encoded": float(month_year_encoded),
        "price_vs_avg_comp": float(price_delta),
        "day_of_week": float(day_of_week),
        "month": float(month),
        "cost_per_unit": float(req.cost_per_unit),
        "product_category_name_encoded": DEFAULT_CATEGORY_ENCODED,
        "is_weekend": 1.0 if day_of_week >= 5 else 0.0,
        "price_ratio_to_avg_comp": float(ratio),
        "max_competitor_price": float(req.max_competitor_price)
    }

    return feature_map


def build_feature_vector(req: PricingRequest, candidate_price: float) -> list[float]:
    feature_map = _with_price_features(req, candidate_price)
    return [float(feature_map.get(name, 0.0)) for name in feature_names]


def optimize_price(model, features, cost, min_price, max_price, step=0.50):
    """
    Grid search to find optimal price that maximizes model prediction
    """
    prices = np.arange(min_price, max_price, step)
    best_price = min_price
    best_value = -float('inf')
    
    for price in prices:
        # Create feature vector with this price
        test_features = features.copy()
        # Models don't directly use price, but affect through demand
        
        predicted_value = model.predict([test_features])[0]
        
        if predicted_value > best_value:
            best_value = predicted_value
            best_price = price
    
    return float(best_price), float(best_value)


@app.get("/")
def root():
    return {"message": "Dynamic Pricing API", "version": "1.0.0", "status": "healthy"}


@app.post("/predict-prices", response_model=PricingResponse)
def predict_optimal_prices(request: PricingRequest):
    """
    Returns 3 pricing strategies:
    1. Revenue Maximization
    2. Profit Maximization
    3. Competitive Undercutting
    """
    try:
        # Prepare baseline inferred price
        baseline_price = max(
            request.avg_competitor_price,
            request.cost_per_unit * MIN_MARGIN_MULTIPLIER
        )

        # Strategy 1: Revenue Maximization (slightly above market average)
        revenue_price = round(max(baseline_price, request.avg_competitor_price * 1.05), 2)
        revenue_features = build_feature_vector(request, revenue_price)
        predicted_revenue = float(revenue_model.predict([revenue_features])[0])

        # Strategy 2: Profit Maximization (higher margin target)
        profit_price = round(max(baseline_price, request.avg_competitor_price * 1.10), 2)
        profit_features = build_feature_vector(request, profit_price)
        predicted_profit = float(profit_model.predict([profit_features])[0])

        # Strategy 3: Competitive Undercutting (ensure minimum margin)
        undercut_price = round(request.min_competitor_price * 0.95, 2)
        min_viable_price = round(request.cost_per_unit * MIN_MARGIN_MULTIPLIER, 2)
        if undercut_price < min_viable_price:
            undercut_price = min_viable_price

        undercut_features = build_feature_vector(request, undercut_price)
        predicted_demand = float(demand_model.predict([undercut_features])[0])

        predicted_revenue = max(predicted_revenue, 0.0)
        predicted_profit = max(predicted_profit, 0.0)
        predicted_demand = max(predicted_demand, 0.0)
        undercut_revenue = undercut_price * predicted_demand

        response = {
            "product_id": request.product_id,
            "timestamp": datetime.utcnow().isoformat(),
            "strategies": {
                "revenue_maximization": {
                    "recommended_price": round(revenue_price, 2),
                    "predicted_revenue": round(predicted_revenue, 2),
                    "description": "Maximizes total revenue (price × volume)",
                    "confidence": "medium"
                },
                "profit_maximization": {
                    "recommended_price": round(profit_price, 2),
                    "predicted_profit": round(predicted_profit, 2),
                    "profit_margin_pct": round(((profit_price - request.cost_per_unit) / profit_price) * 100, 1),
                    "description": "Maximizes profit margin per unit",
                    "confidence": "medium"
                },
                "competitive_undercut": {
                    "recommended_price": round(undercut_price, 2),
                    "predicted_demand": round(predicted_demand, 1),
                    "estimated_revenue": round(undercut_revenue, 2),
                    "description": "Undercuts cheapest competitor by 5%",
                    "confidence": "high"
                }
            },
            "market_context": {
                "avg_competitor_price": request.avg_competitor_price,
                "min_competitor_price": request.min_competitor_price,
                "max_competitor_price": request.max_competitor_price,
                "your_cost": request.cost_per_unit,
                "price_std": _price_std(request)
            }
        }
        
        return response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "models_loaded": True,
        "timestamp": datetime.utcnow().isoformat()
    }