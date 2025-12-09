import React, { useState, useEffect } from 'react';

function ProductForm({ onSubmit, onCancel, initialData = null }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    basicInfo: {
      name: '',
      category: '',
      description: '',
      sku: '',
      brand: '',
      keywords: '',
      targetMarket: '',
      features: '',
      specifications: ''
    },
    costStructure: {
      manufacturingCost: 0,
      materialCost: 0,
      laborCost: 0,
      shippingCost: 0,
      packagingCost: 0,
      importTaxCost: 0
    },
    pricing: {
      sellingPrice: 0,
      marketplaceFees: 0,
      marketingCost: 0,
      shippingCostToCustomer: 0
    },
    competitors: {
      names: [],
      prices: [],
      urls: [],
      discoveryStatus: 'pending',
      discoveredCompetitors: []
    },
    status: {
      isActive: true,
      trackingEnabled: true
    }
  });

  const [competitorInput, setCompetitorInput] = useState({ name: '', price: '', url: '' });
  const [errors, setErrors] = useState({});

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Calculate real-time profit preview
  const calculateMetrics = () => {
    const totalCost = 
      parseFloat(formData.costStructure.manufacturingCost || 0) +
      parseFloat(formData.costStructure.materialCost || 0) +
      parseFloat(formData.costStructure.laborCost || 0) +
      parseFloat(formData.costStructure.shippingCost || 0) +
      parseFloat(formData.costStructure.packagingCost || 0) +
      parseFloat(formData.costStructure.importTaxCost || 0) +
      parseFloat(formData.pricing.marketingCost || 0) +
      parseFloat(formData.pricing.shippingCostToCustomer || 0);

    const sellingPrice = parseFloat(formData.pricing.sellingPrice || 0);
    const feeAmount = (parseFloat(formData.pricing.marketplaceFees || 0) / 100) * sellingPrice;
    const netProfit = sellingPrice - totalCost - feeAmount;
    const profitMargin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
    const breakEvenPrice = totalCost + feeAmount;

    return {
      totalCost: totalCost.toFixed(2),
      netProfit: netProfit.toFixed(2),
      profitMargin: profitMargin.toFixed(1),
      breakEvenPoint: breakEvenPrice.toFixed(2),
      feeAmount: feeAmount.toFixed(2)
    };
  };

  const metrics = calculateMetrics();

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const addCompetitor = () => {
    if (competitorInput.name && competitorInput.price) {
      setFormData(prev => ({
        ...prev,
        competitors: {
          names: [...prev.competitors.names, competitorInput.name],
          prices: [...prev.competitors.prices, parseFloat(competitorInput.price)],
          urls: [...prev.competitors.urls, competitorInput.url]
        }
      }));
      setCompetitorInput({ name: '', price: '', url: '' });
    }
  };

  const removeCompetitor = (index) => {
    setFormData(prev => ({
      ...prev,
      competitors: {
        names: prev.competitors.names.filter((_, i) => i !== index),
        prices: prev.competitors.prices.filter((_, i) => i !== index),
        urls: prev.competitors.urls.filter((_, i) => i !== index)
      }
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.basicInfo.name.trim()) newErrors.name = 'Product name is required';
      if (!formData.basicInfo.category) newErrors.category = 'Category is required';
      if (!formData.basicInfo.keywords.trim()) newErrors.keywords = 'Keywords are required for AI discovery';
    }
    
    if (step === 3) {
      if (!formData.pricing.sellingPrice || formData.pricing.sellingPrice <= 0) {
        newErrors.sellingPrice = 'Selling price must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep(currentStep)) {
      const calculatedFields = {
        totalCost: parseFloat(metrics.totalCost),
        netProfit: parseFloat(metrics.netProfit),
        profitMargin: parseFloat(metrics.profitMargin),
        breakEvenPoint: parseFloat(metrics.breakEvenPoint)
      };

      const productData = {
        ...formData,
        calculatedFields,
        timestamps: {
          createdAt: initialData?.timestamps?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      onSubmit(productData);
    }
  };

  return (
    <div className="product-form-overlay">
      <div className="product-form-container">
        <div className="form-header">
          <h2>{initialData ? 'Edit Product' : 'Add New Product'}</h2>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        {/* Progress Steps */}
        <div className="form-steps">
          {[1, 2, 3, 4].map(step => (
            <div key={step} className={`step ${currentStep >= step ? 'active' : ''} ${currentStep === step ? 'current' : ''}`}>
              <div className="step-number">{step}</div>
              <div className="step-label">
                {step === 1 && 'Basic Info'}
                {step === 2 && 'Costs'}
                {step === 3 && 'Pricing'}
                {step === 4 && 'Competitors'}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="form-step">
              <h3>Basic Information</h3>
              <div className="form-grid">
                <div className="input-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    value={formData.basicInfo.name}
                    onChange={(e) => handleInputChange('basicInfo', 'name', e.target.value)}
                    placeholder="e.g., Wireless Bluetooth Earbuds"
                    className={errors.name ? 'error' : ''}
                  />
                  {errors.name && <span className="error-message">{errors.name}</span>}
                </div>

                <div className="input-group">
                  <label>Category *</label>
                  <select
                    value={formData.basicInfo.category}
                    onChange={(e) => handleInputChange('basicInfo', 'category', e.target.value)}
                    className={errors.category ? 'error' : ''}
                  >
                    <option value="">Select category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Home & Garden">Home & Garden</option>
                    <option value="Sports & Outdoors">Sports & Outdoors</option>
                    <option value="Toys & Games">Toys & Games</option>
                    <option value="Beauty">Beauty</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.category && <span className="error-message">{errors.category}</span>}
                </div>

                <div className="input-group full-width">
                  <label>Description</label>
                  <textarea
                    value={formData.basicInfo.description}
                    onChange={(e) => handleInputChange('basicInfo', 'description', e.target.value)}
                    placeholder="Brief description of your product"
                    rows="3"
                  />
                </div>

                <div className="input-group">
                  <label>SKU / Product ID</label>
                  <input
                    type="text"
                    value={formData.basicInfo.sku}
                    onChange={(e) => handleInputChange('basicInfo', 'sku', e.target.value)}
                    placeholder="e.g., WBE-001"
                  />
                </div>

                <div className="input-group">
                  <label>Brand Name</label>
                  <input
                    type="text"
                    value={formData.basicInfo.brand}
                    onChange={(e) => handleInputChange('basicInfo', 'brand', e.target.value)}
                    placeholder="e.g., TechSound"
                  />
                </div>

                <div className="input-group full-width">
                  <label>Search Keywords (for AI Discovery) *</label>
                  <input
                    type="text"
                    value={formData.basicInfo.keywords}
                    onChange={(e) => handleInputChange('basicInfo', 'keywords', e.target.value)}
                    placeholder="e.g., wireless earbuds, bluetooth headphones, noise cancelling"
                    className={errors.keywords ? 'error' : ''}
                  />
                  {errors.keywords && <span className="error-message">{errors.keywords}</span>}
                  <small className="input-hint">💡 These keywords help AI find similar competitor products</small>
                </div>

                <div className="input-group">
                  <label>Target Market</label>
                  <select
                    value={formData.basicInfo.targetMarket}
                    onChange={(e) => handleInputChange('basicInfo', 'targetMarket', e.target.value)}
                  >
                    <option value="">Select market</option>
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="EU">European Union</option>
                    <option value="Global">Global</option>
                  </select>
                </div>

                <div className="input-group full-width">
                  <label>Key Features</label>
                  <textarea
                    value={formData.basicInfo.features}
                    onChange={(e) => handleInputChange('basicInfo', 'features', e.target.value)}
                    placeholder="e.g., 30-hour battery, IPX7 waterproof, active noise cancellation"
                    rows="2"
                  />
                  <small className="input-hint">Helps AI find similar competitive products</small>
                </div>

                <div className="input-group full-width">
                  <label>Specifications</label>
                  <textarea
                    value={formData.basicInfo.specifications}
                    onChange={(e) => handleInputChange('basicInfo', 'specifications', e.target.value)}
                    placeholder="e.g., Bluetooth 5.0, 10mm drivers, USB-C charging"
                    rows="2"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Cost Structure */}
          {currentStep === 2 && (
            <div className="form-step">
              <h3>Cost Structure</h3>
              <div className="form-grid">
                <div className="input-group">
                  <label>Manufacturing Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costStructure.manufacturingCost}
                    onChange={(e) => handleInputChange('costStructure', 'manufacturingCost', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="input-group">
                  <label>Material Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costStructure.materialCost}
                    onChange={(e) => handleInputChange('costStructure', 'materialCost', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="input-group">
                  <label>Labor Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costStructure.laborCost}
                    onChange={(e) => handleInputChange('costStructure', 'laborCost', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="input-group">
                  <label>Shipping Cost (to you) ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costStructure.shippingCost}
                    onChange={(e) => handleInputChange('costStructure', 'shippingCost', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="input-group">
                  <label>Packaging Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costStructure.packagingCost}
                    onChange={(e) => handleInputChange('costStructure', 'packagingCost', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="input-group">
                  <label>Import/Tax Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costStructure.importTaxCost}
                    onChange={(e) => handleInputChange('costStructure', 'importTaxCost', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Pricing */}
          {currentStep === 3 && (
            <div className="form-step">
              <h3>Pricing & Sales</h3>
              <div className="form-grid">
                <div className="input-group">
                  <label>Selling Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pricing.sellingPrice}
                    onChange={(e) => handleInputChange('pricing', 'sellingPrice', e.target.value)}
                    placeholder="0.00"
                    className={errors.sellingPrice ? 'error' : ''}
                  />
                  {errors.sellingPrice && <span className="error-message">{errors.sellingPrice}</span>}
                </div>

                <div className="input-group">
                  <label>Marketplace Fees (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.pricing.marketplaceFees}
                    onChange={(e) => handleInputChange('pricing', 'marketplaceFees', e.target.value)}
                    placeholder="e.g., 15"
                  />
                  <small className="input-hint">Fee Amount: ${metrics.feeAmount}</small>
                </div>

                <div className="input-group">
                  <label>Marketing Cost per Unit ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pricing.marketingCost}
                    onChange={(e) => handleInputChange('pricing', 'marketingCost', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="input-group">
                  <label>Shipping Cost (to customer) ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pricing.shippingCostToCustomer}
                    onChange={(e) => handleInputChange('pricing', 'shippingCostToCustomer', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Real-time Profit Preview */}
              <div className="profit-preview">
                <h4>Profit Preview</h4>
                <div className="preview-metrics">
                  <div className="preview-item">
                    <span>Total Cost:</span>
                    <strong>${metrics.totalCost}</strong>
                  </div>
                  <div className="preview-item">
                    <span>Net Profit:</span>
                    <strong className={parseFloat(metrics.netProfit) >= 0 ? 'profit' : 'loss'}>
                      ${metrics.netProfit}
                    </strong>
                  </div>
                  <div className="preview-item">
                    <span>Profit Margin:</span>
                    <strong className={parseFloat(metrics.profitMargin) >= 30 ? 'good' : parseFloat(metrics.profitMargin) >= 20 ? 'warning' : 'danger'}>
                      {metrics.profitMargin}%
                    </strong>
                  </div>
                  <div className="preview-item">
                    <span>Break-Even Price:</span>
                    <strong>${metrics.breakEvenPoint}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Competitors */}
          {currentStep === 4 && (
            <div className="form-step">
              <h3>Competitor Tracking (Optional)</h3>
              
              <div className="competitor-input-section">
                <div className="form-grid">
                  <div className="input-group">
                    <label>Competitor Name</label>
                    <input
                      type="text"
                      value={competitorInput.name}
                      onChange={(e) => setCompetitorInput({...competitorInput, name: e.target.value})}
                      placeholder="e.g., Amazon Basics"
                    />
                  </div>

                  <div className="input-group">
                    <label>Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={competitorInput.price}
                      onChange={(e) => setCompetitorInput({...competitorInput, price: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="input-group full-width">
                    <label>URL (Optional)</label>
                    <input
                      type="url"
                      value={competitorInput.url}
                      onChange={(e) => setCompetitorInput({...competitorInput, url: e.target.value})}
                      placeholder="https://"
                    />
                  </div>
                </div>

                <button type="button" className="btn-secondary" onClick={addCompetitor}>
                  Add Competitor
                </button>
              </div>

              {/* Competitor List */}
              {formData.competitors.names.length > 0 && (
                <div className="competitor-list">
                  <h4>Added Competitors ({formData.competitors.names.length})</h4>
                  {formData.competitors.names.map((name, index) => (
                    <div key={index} className="competitor-list-item">
                      <div>
                        <strong>{name}</strong>
                        <span className="competitor-price">${formData.competitors.prices[index]}</span>
                      </div>
                      <button 
                        type="button" 
                        className="btn-remove"
                        onClick={() => removeCompetitor(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            {currentStep > 1 && (
              <button type="button" className="btn-secondary" onClick={prevStep}>
                ← Previous
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            {currentStep < 4 ? (
              <button type="button" className="btn-primary" onClick={nextStep}>
                Next →
              </button>
            ) : (
              <button type="submit" className="btn-primary">
                {initialData ? 'Update Product' : 'Create Product'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductForm;
