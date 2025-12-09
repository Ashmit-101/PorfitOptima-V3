import React from 'react';

function ProductAnalysis({ product }) {
  return (
    <div className="product-analysis">
      <h3>Featured Product Analysis</h3>
      <h4>{product.name}</h4>
      
      <div className="product-header">
        <div>
          <p className="category">{product.category}</p>
          <p className="rating">⭐ {product.rating}</p>
        </div>
        <div className="price-display">
          <div className="current-price">${product.currentPrice}</div>
          <div className={`price-change ${product.priceTrend}`}>
            {product.priceTrend === 'up' ? '↑' : '↓'} ${product.priceChange}
          </div>
        </div>
      </div>

      <h4>Price Recommendations</h4>
      <div className="recommendation-grid">
        <div className="recommendation-card optimal">
          <div>Optimal Price</div>
          <span className="value">${product.recommendedPrice}</span>
          <div className="description">Best profit margin</div>
        </div>
        <div className="recommendation-card competitive">
          <div>Competitive Price</div>
          <span className="value">${product.competitivePrice}</span>
          <div className="description">Market share focus</div>
        </div>
        <div className="recommendation-card premium">
          <div>Premium Price</div>
          <span className="value">${product.premiumPrice}</span>
          <div className="description">Brand positioning</div>
        </div>
      </div>
    </div>
  );
}

export default ProductAnalysis;
