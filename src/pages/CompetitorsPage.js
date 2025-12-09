import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProducts, updateProduct } from '../services/databaseService';
import { discoverCompetitors, approveCompetitor, rejectCompetitor, calculateOptimalPrice } from '../services/aiDiscoveryService';
import { Package, ChevronDown, CheckCircle, XCircle, Loader, DollarSign, TrendingUp, Search, Sparkles } from 'lucide-react';

export default function CompetitorsPage() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [discoveredCompetitors, setDiscoveredCompetitors] = useState([]);
  const [approvedCompetitors, setApprovedCompetitors] = useState([]);
  const [optimalPrice, setOptimalPrice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProducts();
  }, [currentUser]);

  const loadProducts = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const results = await getUserProducts(currentUser.uid);
      setProducts(results);
      if (results.length > 0) {
        setSelectedProductId(results[0].id);
        loadCompetitorsForProduct(results[0]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadCompetitorsForProduct = (product) => {
    if (product.competitors?.discoveredCompetitors) {
      setDiscoveredCompetitors(product.competitors.discoveredCompetitors);
    } else {
      setDiscoveredCompetitors([]);
    }
    
    // Load already approved competitors
    const approved = product.competitors?.discoveredCompetitors?.filter(c => c.status === 'approved') || [];
    setApprovedCompetitors(approved);
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleProductChange = (e) => {
    const productId = e.target.value;
    setSelectedProductId(productId);
    const product = products.find(p => p.id === productId);
    if (product) {
      loadCompetitorsForProduct(product);
      setOptimalPrice(null);
    }
  };

  const handleDiscoverCompetitors = async () => {
    if (!selectedProduct) return;
    
    try {
      setDiscovering(true);
      setError(null);
      
      const productInfo = {
        name: selectedProduct.basicInfo.name,
        category: selectedProduct.basicInfo.category,
        description: selectedProduct.basicInfo.description,
        brand: selectedProduct.basicInfo.brand,
        keywords: selectedProduct.basicInfo.keywords,
        targetMarket: selectedProduct.basicInfo.targetMarket,
        features: selectedProduct.basicInfo.features,
        specifications: selectedProduct.basicInfo.specifications
      };

      const result = await discoverCompetitors(selectedProduct.id, productInfo);
      
      if (result.competitors && result.competitors.length > 0) {
        const discovered = result.competitors.map((c, index) => ({
          ...c,
          id: `comp-${Date.now()}-${index}`,
          status: 'pending'
        }));
        
        setDiscoveredCompetitors(discovered);
        
        // Update product in database
        await updateProduct(selectedProduct.id, {
          competitors: {
            ...selectedProduct.competitors,
            discoveredCompetitors: discovered,
            discoveryStatus: 'completed'
          }
        });
        
        // Refresh products
        await loadProducts();
      }
    } catch (err) {
      console.error('Discovery error:', err);
      setError(err.message || 'Failed to discover competitors');
    } finally {
      setDiscovering(false);
    }
  };

  const handleApprove = async (competitorId) => {
    try {
      const updated = discoveredCompetitors.map(c =>
        c.id === competitorId ? { ...c, status: 'approved' } : c
      );
      setDiscoveredCompetitors(updated);
      setApprovedCompetitors(updated.filter(c => c.status === 'approved'));
      
      // Update in database
      await updateProduct(selectedProduct.id, {
        competitors: {
          ...selectedProduct.competitors,
          discoveredCompetitors: updated
        }
      });
    } catch (err) {
      console.error('Approve error:', err);
      setError('Failed to approve competitor');
    }
  };

  const handleReject = async (competitorId) => {
    try {
      const updated = discoveredCompetitors.map(c =>
        c.id === competitorId ? { ...c, status: 'rejected' } : c
      );
      setDiscoveredCompetitors(updated);
      setApprovedCompetitors(updated.filter(c => c.status === 'approved'));
      
      // Update in database
      await updateProduct(selectedProduct.id, {
        competitors: {
          ...selectedProduct.competitors,
          discoveredCompetitors: updated
        }
      });
    } catch (err) {
      console.error('Reject error:', err);
      setError('Failed to reject competitor');
    }
  };

  const handleCalculatePrice = async () => {
    if (approvedCompetitors.length === 0) {
      setError('Please approve at least one competitor to calculate pricing');
      return;
    }

    try {
      setCalculatingPrice(true);
      setError(null);

      const competitorPrices = approvedCompetitors.map(c => c.price);
      const result = await calculateOptimalPrice(selectedProduct.id, {
        competitorPrices,
        costPerUnit: selectedProduct.calculatedFields?.totalCost || 0,
        productInfo: selectedProduct.basicInfo
      });

      setOptimalPrice(result);
    } catch (err) {
      console.error('Pricing error:', err);
      setError(err.message || 'Failed to calculate optimal price');
    } finally {
      setCalculatingPrice(false);
    }
  };

  if (loading) {
    return (
      <div className="competitors-page-container">
        <div className="loading-state">
          <Loader className="animate-spin" size={40} />
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="competitors-page-container">
        <div className="empty-state">
          <Package size={64} />
          <h2>No Products Yet</h2>
          <p>Add a product first to discover competitors</p>
        </div>
      </div>
    );
  }

  return (
    <div className="competitors-page-container">
      <div className="page-header">
        <div>
          <h1>🤖 AI Competitor Discovery</h1>
          <p>Discover and approve competitors to get optimal pricing recommendations</p>
        </div>
      </div>

      {/* Product Selector */}
      <div className="product-selector-card">
        <label>Select Product:</label>
        <select value={selectedProductId} onChange={handleProductChange}>
          {products.map(product => (
            <option key={product.id} value={product.id}>
              {product.basicInfo.name}
            </option>
          ))}
        </select>
        
        <button 
          className="discover-btn primary"
          onClick={handleDiscoverCompetitors}
          disabled={discovering || !selectedProduct}
        >
          {discovering ? (
            <>
              <Loader className="animate-spin" size={16} />
              Discovering Competitors...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Discover Competitors with AI
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <XCircle size={20} />
          {error}
        </div>
      )}

      {/* Discovered Competitors */}
      {discoveredCompetitors.length > 0 && (
        <div className="competitors-section">
          <div className="section-header">
            <h2>Discovered Competitors ({discoveredCompetitors.length})</h2>
            <span className="approved-count">
              {approvedCompetitors.length} Approved
            </span>
          </div>

          <div className="competitors-grid">
            {discoveredCompetitors.map(competitor => (
              <div 
                key={competitor.id} 
                className={`competitor-card ${competitor.status}`}
              >
                <div className="competitor-header">
                  <h3>{competitor.name}</h3>
                  <span className={`status-badge ${competitor.status}`}>
                    {competitor.status === 'approved' && <CheckCircle size={14} />}
                    {competitor.status === 'rejected' && <XCircle size={14} />}
                    {competitor.status}
                  </span>
                </div>

                <div className="competitor-details">
                  <div className="price-info">
                    <DollarSign size={16} />
                    <span className="price">${competitor.price.toFixed(2)}</span>
                  </div>
                  
                  {competitor.url && (
                    <a 
                      href={competitor.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="competitor-link"
                    >
                      View Product →
                    </a>
                  )}

                  {competitor.description && (
                    <p className="competitor-description">{competitor.description}</p>
                  )}

                  {competitor.matchScore && (
                    <div className="match-score">
                      Match: {(competitor.matchScore * 100).toFixed(0)}%
                    </div>
                  )}
                </div>

                {competitor.status === 'pending' && (
                  <div className="competitor-actions">
                    <button 
                      className="approve-btn"
                      onClick={() => handleApprove(competitor.id)}
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button 
                      className="reject-btn"
                      onClick={() => handleReject(competitor.id)}
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Calculation */}
      {approvedCompetitors.length > 0 && (
        <div className="pricing-section">
          <div className="pricing-card">
            <h2>💰 Optimal Price Calculation</h2>
            <p>Calculate the best price based on {approvedCompetitors.length} approved competitors</p>
            
            <button 
              className="calculate-btn primary large"
              onClick={handleCalculatePrice}
              disabled={calculatingPrice}
            >
              {calculatingPrice ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Calculating Optimal Price...
                </>
              ) : (
                <>
                  <TrendingUp size={20} />
                  Calculate Optimal Price
                </>
              )}
            </button>

            {optimalPrice && (
              <div className="price-result">
                <div className="optimal-price">
                  <span className="label">Recommended Price:</span>
                  <span className="price">${optimalPrice.recommendedPrice?.toFixed(2)}</span>
                </div>
                
                {optimalPrice.priceBand && (
                  <div className="price-band">
                    <span className="label">Price Range:</span>
                    <span>${optimalPrice.priceBand[0]?.toFixed(2)} - ${optimalPrice.priceBand[1]?.toFixed(2)}</span>
                  </div>
                )}

                {optimalPrice.expectedMargin && (
                  <div className="margin-info">
                    <span className="label">Expected Margin:</span>
                    <span className="value">{(optimalPrice.expectedMargin * 100).toFixed(1)}%</span>
                  </div>
                )}

                {optimalPrice.rationale && (
                  <div className="rationale">
                    <h4>💡 Pricing Rationale:</h4>
                    <p>{optimalPrice.rationale}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {discoveredCompetitors.length === 0 && !discovering && (
        <div className="empty-state-inline">
          <Search size={48} />
          <h3>No Competitors Discovered Yet</h3>
          <p>Click "Discover Competitors with AI" to find similar products automatically</p>
        </div>
      )}
    </div>
  );
}
