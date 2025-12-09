import React, { useEffect, useMemo, useState, useRef } from 'react';
import CompetitorsPanel from '../components/competitors/CompetitorsPanel';
import { useAuth } from '../contexts/AuthContext';
import { getUserProducts } from '../services/databaseService';
import { Package, DollarSign, Receipt, Wallet, TrendingUp, RefreshCw, ChevronDown, Users, Target, Activity, Sparkles, Lightbulb, AlertTriangle, Brain, CheckCircle, BarChart3 } from 'lucide-react';

function LoadingState() {
  return (
    <div className="loading-state">
      <div className="loading-spinner" />
      <p>Loading insights…</p>
    </div>
  );
}

export default function Insights() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    async function fetchProducts() {
      if (!currentUser) return;
      try {
        setLoading(true);
        setError(null);
        const results = await getUserProducts(currentUser.uid);
        setProducts(results);
        if (results.length > 0) {
          setSelectedProductId(results[0].id);
        }
      } catch (err) {
        console.error(err);
        setError('Unable to load products. Check your connection.');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [currentUser]);

  const selectedProduct = useMemo(() => {
    if (!selectedProductId && products.length > 0) {
      return products[0];
    }
    return products.find((product) => product.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const handlePriceApplied = (price) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === selectedProduct?.id
          ? {
              ...product,
              pricing: { ...product.pricing, sellingPrice: price }
            }
          : product
      )
    );
  };

  const handleRefresh = () => {
    if (panelRef.current) {
      panelRef.current.refresh();
    }
  };

  // Calculate Stats
  const stats = useMemo(() => {
    if (!selectedProduct) return null;

    const competitors = selectedProduct.competitors?.prices || [];
    const competitorCount = competitors.length;
    const activeCompetitors = competitorCount; // Assuming all are active for now
    
    const myPrice = Number(selectedProduct.pricing?.sellingPrice || 0);
    const competitorPrices = competitors.map(p => Number(p));
    const avgPrice = competitorPrices.length > 0 
      ? competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length 
      : myPrice;

    const priceDiff = myPrice - avgPrice;
    const diffPercent = avgPrice > 0 ? (Math.abs(priceDiff) / avgPrice) * 100 : 0;
    
    // Calculate rank
    const allPrices = [...competitorPrices, myPrice].sort((a, b) => a - b);
    const myRank = allPrices.indexOf(myPrice) + 1;
    
    let positionText = "Only Product";
    if (competitorCount > 0) {
      if (myRank === 1) positionText = "Cheapest";
      else if (myRank === allPrices.length) positionText = "Most Expensive";
      else positionText = `${myRank}${myRank === 2 ? 'nd' : myRank === 3 ? 'rd' : 'th'} Cheapest`;
    }

    return {
      tracked: activeCompetitors,
      marketAvg: avgPrice,
      priceDiff,
      diffPercent,
      position: positionText,
      totalProducts: allPrices.length,
      activity: "No changes" // Mock data for now
    };
  }, [selectedProduct]);

  // Generate AI Insights
  const insights = useMemo(() => {
    if (!selectedProduct || !stats) return [];
    
    const newInsights = [];
    const myPrice = Number(selectedProduct.pricing?.sellingPrice || 0);

    // Opportunity
    if (stats.tracked > 0 && myPrice < (stats.marketAvg - 2)) {
      newInsights.push({
        type: 'opportunity',
        title: 'Pricing Opportunity',
        icon: Lightbulb,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        text: `You can raise price to $${(stats.marketAvg - 0.5).toFixed(2)} (+$${(stats.marketAvg - 0.5 - myPrice).toFixed(2)}) and maintain competitive advantage`
      });
    }

    // Trend (Always show)
    if (stats.tracked > 0) {
      newInsights.push({
        type: 'trend',
        title: 'Market Trend',
        icon: TrendingUp,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        text: `Competitors averaging $${stats.marketAvg.toFixed(2)}, stable this week`
      });
    }

    // Recommendation
    if (stats.tracked > 0 && myPrice < stats.marketAvg) {
       newInsights.push({
        type: 'recommendation',
        title: 'AI Recommendation',
        icon: Target,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        text: `Consider price adjustment to $${stats.marketAvg.toFixed(2)} for optimal positioning`
      });
    }

    return newInsights;
  }, [selectedProduct, stats]);

  // Prepare Price Comparison Data
  const priceComparisonData = useMemo(() => {
    if (!selectedProduct) return [];

    const myPrice = Number(selectedProduct.pricing?.sellingPrice || 0);
    const competitors = selectedProduct.competitors?.names?.map((name, index) => ({
      name: name || `Competitor ${index + 1}`,
      price: Number(selectedProduct.competitors.prices?.[index] || 0),
      isYours: false
    })) || [];

    const allData = [
      { name: "Your Product", price: myPrice, isYours: true },
      ...competitors.sort((a, b) => a.price - b.price)
    ];

    return allData;
  }, [selectedProduct]);

  const maxPrice = useMemo(() => {
    if (priceComparisonData.length === 0) return 0;
    return Math.max(...priceComparisonData.map(d => d.price));
  }, [priceComparisonData]);

  if (loading) {
    return (
      <div className="insights-page">
        <LoadingState />
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="insights-page">
        <div className="empty-state">
          <h2>Add a product first</h2>
          <p>Create a product to start tracking competitors and pricing insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-4xl font-bold text-gray-900">Competitor Intelligence</h1>
        
        <button 
          onClick={handleRefresh}
          className="flex items-center gap-2 px-6 py-3 bg-[rgb(112,82,174)] text-white rounded-lg hover:bg-[rgb(100,70,160)] shadow-lg transition-all"
        >
          <RefreshCw className="w-5 h-5" />
          Refresh All
        </button>
      </div>
      <p className="text-lg text-gray-600 mb-8">
        Monitor competitor pricing and keep your products competitive.
      </p>

      {/* Product Selector Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-purple-100 p-3 rounded-lg">
            <Package className="w-6 h-6 text-purple-600" />
          </div>
          <div className="relative flex-1 max-w-md">
            <select
              value={selectedProduct?.id || ''}
              onChange={(event) => setSelectedProductId(event.target.value)}
              className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-lg font-medium rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-3 pr-10"
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.basicInfo?.name || 'Untitled'}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Price Box */}
          <div className="bg-blue-50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Price</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              ${Number(selectedProduct?.pricing?.sellingPrice || 0).toFixed(2)}
            </p>
          </div>

          {/* Cost Box */}
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Cost</span>
            </div>
            <p className="text-2xl font-bold text-gray-700">
              ${Number(selectedProduct?.calculatedFields?.totalCost || 0).toFixed(2)}
            </p>
          </div>

          {/* Profit Box */}
          <div className="bg-green-50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-green-600" />
              <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Profit</span>
            </div>
            <p className="text-2xl font-bold text-green-700">
              ${Number(selectedProduct?.calculatedFields?.netProfit || 0).toFixed(2)}
            </p>
          </div>

          {/* Margin Box */}
          <div className="bg-purple-50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Margin</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">
              {Number(selectedProduct?.calculatedFields?.profitMargin || 0).toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="mt-4 text-right">
          <p className="text-sm text-gray-400">
            Last synced: {selectedProduct?.competitors?.lastSynced ? new Date(selectedProduct.competitors.lastSynced.toDate ? selectedProduct.competitors.lastSynced.toDate() : selectedProduct.competitors.lastSynced).toLocaleString() : 'Never'}
          </p>
        </div>
      </div>

      {/* AI Insights Panel (HERO SECTION) */}
      <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-xl p-8 border-2 border-purple-300 shadow-lg mb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-600 p-3 rounded-xl">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Pricing Intelligence</h2>
            <p className="text-sm text-gray-600">Powered by real-time competitor analysis</p>
          </div>
        </div>
        
        {/* Insights */}
        {insights.length > 0 ? (
          <>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-purple-100">
                  <div className={`${insight.bgColor} p-2.5 rounded-lg flex-shrink-0`}>
                    <insight.icon className={`w-6 h-6 ${insight.color}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">{insight.title}</p>
                    <p className="text-sm text-gray-700">{insight.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Confidence Indicator */}
            <div className="mt-6 pt-6 border-t border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Analysis Confidence</span>
                <span className="text-sm font-bold text-purple-600">85%</span>
              </div>
              <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{width: '85%'}}></div>
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center">
                Last analyzed: {selectedProduct?.competitors?.lastSynced ? new Date(selectedProduct.competitors.lastSynced.toDate ? selectedProduct.competitors.lastSynced.toDate() : selectedProduct.competitors.lastSynced).toLocaleTimeString() : 'Just now'} • Based on {stats?.tracked || 0} competitors
              </p>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-8">
            <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              AI Insights Available After Adding Competitors
            </h3>
            <p className="text-gray-600 mb-4">
              Add competitor URLs to unlock AI-powered pricing recommendations
            </p>
            <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors" onClick={() => document.querySelector('.url-input-row input')?.focus()}>
              Add First Competitor
            </button>
          </div>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Tracked Competitors */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 p-2.5 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600 font-medium">Tracked Competitors</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats?.tracked || 0}</p>
          <p className="text-sm text-gray-500">Active</p>
        </div>

        {/* Card 2: Market Average */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2.5 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600 font-medium">Market Average</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">${(stats?.marketAvg || 0).toFixed(2)}</p>
          <p className={`text-sm ${stats?.priceDiff < 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats?.priceDiff === 0 ? 'Same as you' : `${stats?.diffPercent.toFixed(1)}% ${stats?.priceDiff < 0 ? 'higher' : 'lower'} than you`}
          </p>
        </div>

        {/* Card 3: Your Position */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 p-2.5 rounded-lg">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-600 font-medium">Position</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats?.position || 'N/A'}</p>
          <p className="text-sm text-gray-500">of {stats?.totalProducts || 1}</p>
        </div>

        {/* Card 4: Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-100 p-2.5 rounded-lg">
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm text-gray-600 font-medium">Activity (24h)</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{stats?.activity || 'No data'}</p>
          <p className="text-sm text-gray-500">{stats?.tracked || 0} unchanged</p>
        </div>
      </div>

      {/* Visual Price Comparison Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Visual Price Comparison</h3>
        </div>

        {priceComparisonData.length > 1 ? (
          <div className="space-y-4">
            {priceComparisonData.map((item, index) => {
              const isMyProduct = item.isYours;
              const widthPercent = maxPrice > 0 ? (item.price / maxPrice) * 100 : 0;
              
              // Determine color
              let barColor = "bg-gray-400";
              if (isMyProduct) {
                barColor = "bg-gradient-to-r from-purple-500 to-indigo-600";
              } else {
                const myPrice = priceComparisonData.find(d => d.isYours)?.price || 0;
                if (item.price < myPrice) barColor = "bg-gradient-to-r from-green-400 to-emerald-500";
                else if (item.price > myPrice) barColor = "bg-gradient-to-r from-red-400 to-rose-500";
                else barColor = "bg-gray-400";
              }

              return (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${isMyProduct ? 'text-purple-700 font-bold' : 'text-gray-700'}`}>
                        {item.name}
                      </span>
                      {isMyProduct && (
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">
                          You
                        </span>
                      )}
                      {!isMyProduct && item.price < (priceComparisonData.find(d => d.isYours)?.price || 0) && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Cheaper
                        </span>
                      )}
                      {!isMyProduct && item.price > (priceComparisonData.find(d => d.isYours)?.price || 0) && (
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Expensive
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-900">${item.price.toFixed(2)}</span>
                  </div>
                  
                  <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${barColor} transition-all duration-500 ease-out`}
                      style={{ width: `${widthPercent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-100 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600"></div>
                <span>Your Product</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"></div>
                <span>Cheaper Competitor</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-400 to-rose-500"></div>
                <span>Expensive Competitor</span>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State for Chart */
          <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-gray-900 font-medium mb-1">No Price Data to Compare</h4>
            <p className="text-gray-500 text-sm mb-4">Add competitors to see how your price stacks up visually.</p>
            <button 
              onClick={() => document.querySelector('.url-input-row input')?.focus()}
              className="text-purple-600 font-medium hover:text-purple-700 text-sm"
            >
              + Add Competitor
            </button>
          </div>
        )}
      </div>

      {selectedProduct && (
        <CompetitorsPanel
          ref={panelRef}
          product={selectedProduct}
          userId={currentUser?.uid}
          onPriceApplied={handlePriceApplied}
        />
      )}
    </div>
  );
}
