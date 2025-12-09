import React from 'react';
import { Plus } from 'lucide-react';

function EmptyDashboard({ onAddProduct }) {
  const setupSteps = [
    { id: 1, label: 'Create account', completed: true },
    { id: 2, label: 'Add your first product', completed: false },
    { id: 3, label: 'Set up cost structure', completed: false },
    { id: 4, label: 'Add competitors', completed: false }
  ];

  return (
    <div className="empty-dashboard">
      <div className="empty-dashboard-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-icon">📦</div>
          <h1>Welcome to ProfitOptima!</h1>
          <p>Start optimizing your product pricing and maximize your profits</p>
        </div>

        {/* Quick Stats */}
        <div className="empty-stats">
          <div className="empty-stat-card">
            <span className="stat-icon">📦</span>
            <div>
              <div className="stat-value">0</div>
              <div className="stat-label">Products</div>
            </div>
          </div>
          <div className="empty-stat-card">
            <span className="stat-icon">💰</span>
            <div>
              <div className="stat-value">$0</div>
              <div className="stat-label">Total Profit</div>
            </div>
          </div>
          <div className="empty-stat-card">
            <span className="stat-icon">📊</span>
            <div>
              <div className="stat-value">0%</div>
              <div className="stat-label">Avg Margin</div>
            </div>
          </div>
        </div>

        {/* Setup Checklist */}
        <div className="setup-checklist">
          <h3>Getting Started</h3>
          <div className="checklist-items">
            {setupSteps.map((step) => (
              <div key={step.id} className="checklist-item">
                <div className={`checkbox ${step.completed ? 'checked' : ''}`}>
                  {step.completed && '✓'}
                </div>
                <span className={step.completed ? 'completed' : ''}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <button 
          className="bg-[rgb(112,82,174)] hover:bg-[rgb(100,70,160)] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-4 text-lg mb-12 flex items-center justify-center gap-2 mx-auto"
          onClick={onAddProduct}
        >
          <Plus className="w-6 h-6" />
          Add Your First Product
        </button>

        {/* Sample Product Cards */}
        <div className="sample-products">
          <h3>What you'll see once you add products:</h3>
          <div className="sample-grid">
            <div className="sample-card">
              <div className="sample-header">
                <div className="sample-placeholder-text"></div>
                <div className="sample-placeholder-badge"></div>
              </div>
              <div className="sample-metrics">
                <div className="sample-placeholder-line"></div>
                <div className="sample-placeholder-line short"></div>
              </div>
            </div>
            <div className="sample-card">
              <div className="sample-header">
                <div className="sample-placeholder-text"></div>
                <div className="sample-placeholder-badge"></div>
              </div>
              <div className="sample-metrics">
                <div className="sample-placeholder-line"></div>
                <div className="sample-placeholder-line short"></div>
              </div>
            </div>
            <div className="sample-card">
              <div className="sample-header">
                <div className="sample-placeholder-text"></div>
                <div className="sample-placeholder-badge"></div>
              </div>
              <div className="sample-metrics">
                <div className="sample-placeholder-line"></div>
                <div className="sample-placeholder-line short"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmptyDashboard;
