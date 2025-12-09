import React, { useState } from 'react';

function ProfitCalculator() {
  const [costs, setCosts] = useState({
    manufacturing: 20,
    shipping: 5,
    fees: 3,
    marketing: 7
  });

  const [sellingPrice, setSellingPrice] = useState(50);

  const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
  const netProfit = sellingPrice - totalCost;
  const margin = ((netProfit / sellingPrice) * 100).toFixed(1);

  return (
    <div className="profit-calculator">
      <h3>Profit Calculator</h3>
      
      <div className="calculator">
        <div>
          <div className="input-group">
            <label>Selling Price</label>
            <input
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(Number(e.target.value))}
            />
          </div>
          
          <div className="input-group">
            <label>Manufacturing Cost</label>
            <input
              type="number"
              value={costs.manufacturing}
              onChange={(e) => setCosts({...costs, manufacturing: Number(e.target.value)})}
            />
          </div>
          
          <div className="input-group">
            <label>Shipping Cost</label>
            <input
              type="number"
              value={costs.shipping}
              onChange={(e) => setCosts({...costs, shipping: Number(e.target.value)})}
            />
          </div>
          
          <div className="input-group">
            <label>Platform Fees</label>
            <input
              type="number"
              value={costs.fees}
              onChange={(e) => setCosts({...costs, fees: Number(e.target.value)})}
            />
          </div>
          
          <div className="input-group">
            <label>Marketing Cost</label>
            <input
              type="number"
              value={costs.marketing}
              onChange={(e) => setCosts({...costs, marketing: Number(e.target.value)})}
            />
          </div>
        </div>
        
        <div>
          <div className="profit-metric total-cost">
            <span>Total Cost</span>
            <span>${totalCost.toFixed(2)}</span>
          </div>
          
          <div className="profit-metric net-profit">
            <span>Net Profit</span>
            <span>${netProfit.toFixed(2)}</span>
          </div>
          
          <div className="profit-metric margin">
            <span>Profit Margin</span>
            <span>{margin}%</span>
          </div>
          
          <div>
            <p style={{ marginBottom: '0.5rem', fontWeight: '500' }}>Cost Breakdown</p>
            <div className="breakdown-bar">
              <div 
                className="breakdown-segment manufacturing" 
                style={{ width: `${(costs.manufacturing / totalCost) * 100}%` }}
              />
              <div 
                className="breakdown-segment shipping" 
                style={{ width: `${(costs.shipping / totalCost) * 100}%` }}
              />
              <div 
                className="breakdown-segment fees" 
                style={{ width: `${(costs.fees / totalCost) * 100}%` }}
              />
              <div 
                className="breakdown-segment marketing" 
                style={{ width: `${(costs.marketing / totalCost) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfitCalculator;
