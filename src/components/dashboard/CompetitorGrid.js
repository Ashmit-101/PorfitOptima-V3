import React from 'react';

function CompetitorGrid({ competitors }) {
  return (
    <div className="competitor-grid">
      <h3>Top Competitors</h3>
      <div className="competitors-list">
        {competitors.map((competitor, index) => (
          <div key={index} className="competitor-item">
            <div className="competitor-name">{competitor.name}</div>
            <div className="competitor-price">${competitor.price}</div>
            <div className="competitor-market-share">
              ⭐ {competitor.rating} ({competitor.reviews.toLocaleString()} reviews)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CompetitorGrid;
