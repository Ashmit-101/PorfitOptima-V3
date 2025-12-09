import React, { useMemo, useState, useEffect } from 'react';
import MetricCard from '../common/MetricCard';
import {
  Shirt, Zap, Headphones, Tag,
  TrendingUp, TrendingDown, Minus,
  Edit2, Copy, Trash2,
  DollarSign, Receipt, Wallet,
  PieChart, Info, Plus, AlertCircle
} from 'lucide-react';
import {
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

function PopulatedDashboard({ products, onAddProduct, onEditProduct, onDeleteProduct }) {
  // Calculate aggregate metrics
  const totalProducts = products.length;
  const avgMargin = products.reduce((sum, p) => sum + (p.calculatedFields?.profitMargin || 0), 0) / totalProducts;
  const monthlyProfit = products.reduce((sum, p) => sum + (p.calculatedFields?.netProfit || 0), 0);
  const lowMarginCount = products.filter(p => (p.calculatedFields?.profitMargin || 0) < 20).length;

  const metrics = [
    { title: 'Total Products', value: totalProducts, change: '+1', trend: 'up' },
    { title: 'Avg Profit Margin', value: `${avgMargin.toFixed(1)}%`, change: '+2.1%', trend: 'up' },
    { title: 'Monthly Profit', value: `$${monthlyProfit.toFixed(2)}`, change: '+5%', trend: 'up' },
    { title: 'Low Margin Alerts', value: lowMarginCount, change: lowMarginCount > 0 ? 'Review' : 'None', trend: lowMarginCount > 0 ? 'down' : 'neutral' }
  ];

  // Sample sparkline data (replace with real data)
  const productsData = [
    { month: 'Jan', value: 1 }, { month: 'Feb', value: 1 }, { month: 'Mar', value: 1 }, { month: 'Apr', value: 2 }, { month: 'May', value: 2 }
  ];
  const marginData = [
    { month: 'Jan', value: 26.5 }, { month: 'Feb', value: 27.2 }, { month: 'Mar', value: 28.1 }, { month: 'Apr', value: 28.0 }, { month: 'May', value: 28.8 }
  ];
  const monthlyProfitData = [
    { month: 'Jan', value: 15.20 }, { month: 'Feb', value: 16.80 }, { month: 'Mar', value: 14.50 }, { month: 'Apr', value: 17.30 }, { month: 'May', value: 18.50 }
  ];

  // Profit trend main chart data (sample)
  const profitTrendData = [
    { date: 'Jan 1', profit: 12.5, margin: 24.5 },
    { date: 'Jan 8', profit: 14.2, margin: 25.8 },
    { date: 'Jan 15', profit: 13.8, margin: 25.2 },
    { date: 'Jan 22', profit: 15.6, margin: 26.9 },
    { date: 'Jan 29', profit: 16.3, margin: 27.5 },
    { date: 'Feb 5', profit: 17.1, margin: 28.1 },
    { date: 'Feb 12', profit: 18.5, margin: 28.8 }
  ];

  const [timePeriod, setTimePeriod] = useState('1M');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const filteredData = useMemo(() => {
    // TODO: filter based on timePeriod when real data is wired
    return profitTrendData && profitTrendData.length ? profitTrendData : [];
  }, [timePeriod]);

  return (
    <div className="populated-dashboard p-8 bg-gray-50 min-h-screen">
      {/* Header with Add Button */}
      <div className="dashboard-header mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Product Dashboard</h1>
            <p className="text-lg text-gray-600">Manage and analyze your product portfolio</p>
          </div>
        </div>
        <div className="mt-4">
          <button className="bg-[rgb(112,82,174)] hover:bg-[rgb(100,70,160)] text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2" onClick={onAddProduct}>
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {metrics.map((metric, index) => {
          const spark = metric.title === 'Monthly Profit' ? { data: monthlyProfitData, color: '#9333ea' }
            : metric.title === 'Avg Profit Margin' ? { data: marginData, color: '#10b981' }
            : metric.title === 'Total Products' ? { data: productsData, color: '#3b82f6' }
            : null;
          return (
            <MetricCard
              key={index}
              title={metric.title}
              value={metric.value}
              change={metric.change}
              trend={metric.trend}
              sparklineData={spark?.data}
              sparklineColor={spark?.color}
            />
          );
        })}
      </div>

      {/* Profit Trends Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-10 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Profit Trends</h2>
            <p className="text-sm text-gray-600">Weekly profit and margin analysis</p>
          </div>
          <div className="flex gap-2">
            {['7D','1M','3M','1Y'].map((p) => (
              <button
                key={p}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${timePeriod===p ? 'text-white bg-black' : 'text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors'}`}
                onClick={() => setTimePeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="h-80">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value, name) => {
                  if (name === 'profit') return [`$${value}`, 'Profit'];
                  if (name === 'margin') return [`${value}%`, 'Margin'];
                }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} formatter={(value) => {
                  if (value === 'profit') return 'Profit ($)';
                  if (value === 'margin') return 'Margin (%)';
                }} />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} animationDuration={1000} />
                <Line type="monotone" dataKey="margin" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} animationDuration={1000} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Product Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {(() => {
          const fallbackComparisonData = [
            { name: 'hat', profit: 11.0, margin: 44.0, sales: 25 },
            { name: 'Wireless earphones', profit: 7.5, margin: 13.6, sales: 18 }
          ];
          const productComparisonData = (products && products.length > 0)
            ? products.map(p => ({
                name: p.basicInfo.name,
                profit: Number(p.calculatedFields.netProfit),
                margin: Number(p.calculatedFields.profitMargin),
                sales: p.analytics?.sales || Math.round(10 + Math.random()*30)
              }))
            : fallbackComparisonData;
            const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
            return (
              <>
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Profit by Product</h3>
                    <p className="text-sm text-gray-600">Net profit comparison</p>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productComparisonData} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#e5e7eb' }} angle={-15} textAnchor="end" height={60} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} label={{ value: 'Profit ($)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 12 } }} />
                        <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => [`$${value}`, 'Profit']} />
                        <Bar dataKey="profit" fill="#10b981" radius={[8, 8, 0, 0]} animationDuration={1000} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Margin Distribution</h3>
                    <p className="text-sm text-gray-600">Profit margin by product</p>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie data={productComparisonData} cx="50%" cy="50%" labelLine={false} label={({ name, margin }) => `${name}: ${margin}%`} outerRadius={80} fill="#8884d8" dataKey="margin" animationDuration={1000}>
                          {productComparisonData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => [`${value}%`, 'Margin']} />
                        <Legend verticalAlign="bottom" height={36} formatter={(value, entry) => `${value} (${entry.payload.margin}%)`} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

      {/* Products Grid */}
      <div className="products-section my-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Products</h2>
        <div className="products-grid grid grid-cols-1 lg:grid-cols-2 gap-6">
          {products.map((product) => (
            <div key={product.id} className="product-detail-card bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-200 hover:border-gray-300">
              <div className="product-detail-header flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-gray-900">{product.basicInfo.name}</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const cat = (product.basicInfo.category || '').toLowerCase();
                      const Icon = cat.includes('cloth') ? Shirt : cat.includes('elect') ? Zap : cat.includes('head') ? Headphones : cat.includes('book') ? Tag : Tag;
                      return <Icon className="w-4 h-4 text-gray-400" />;
                    })()}
                    <p className="text-sm text-gray-500">{product.basicInfo.category}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm ${product.status?.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  <div className={`w-2 h-2 rounded-full ${product.status?.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  {product.status?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="product-detail-metrics space-y-3 mb-5">
                <div className="flex justify-between items-center bg-blue-50 px-3 py-2 rounded-lg">
                  <span className="text-sm text-gray-600 font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-500" />
                    Selling Price
                  </span>
                  <span className="font-bold text-lg text-blue-600">${Number(product.pricing.sellingPrice).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg">
                  <span className="text-sm text-gray-600 font-medium flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-gray-500" />
                    Total Cost
                  </span>
                  <span className="text-lg font-bold text-gray-700">${Number(product.calculatedFields.totalCost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center bg-green-50 px-3 py-2 rounded-lg">
                  <span className="text-sm text-gray-600 font-medium flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-green-500" />
                    Net Profit
                  </span>
                  <span className="text-lg font-bold text-green-600">${Number(product.calculatedFields.netProfit).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-gray-600 text-sm font-medium">Profit Margin:</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${Number(product.calculatedFields.profitMargin) >= 30 ? 'bg-green-50 text-green-700 border-green-200' : Number(product.calculatedFields.profitMargin) >= 15 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {(Number(product.calculatedFields.profitMargin) >= 30) && <TrendingUp className="w-3.5 h-3.5" />}
                    {(Number(product.calculatedFields.profitMargin) < 15) && <TrendingDown className="w-3.5 h-3.5" />}
                    {(Number(product.calculatedFields.profitMargin) >= 15 && Number(product.calculatedFields.profitMargin) < 30) && <Minus className="w-3.5 h-3.5" />}
                    {Number(product.calculatedFields.profitMargin).toFixed(1)}%
                  </span>
                </div>
                {Number(product.calculatedFields.profitMargin) < 15 && (
                  <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-red-700">Low Profit Margin</p>
                      <p className="text-xs text-red-600">Consider reviewing pricing strategy</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Cost Breakdown Bar */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5"><PieChart className="w-3.5 h-3.5" /> Cost Breakdown</p>
                  <button className="text-xs text-gray-400 hover:text-gray-600"><Info className="w-3.5 h-3.5" /></button>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                  <div 
                    className="breakdown-segment manufacturing" 
                    style={{ width: `${(Number(product.costStructure.manufacturingCost) / Number(product.calculatedFields.totalCost)) * 100}%` }}
                    title={`Manufacturing: $${Number(product.costStructure.manufacturingCost).toFixed(2)}`}
                  />
                  <div 
                    className="breakdown-segment shipping" 
                    style={{ width: `${(Number(product.costStructure.shippingCost) / Number(product.calculatedFields.totalCost)) * 100}%` }}
                    title={`Shipping: $${Number(product.costStructure.shippingCost).toFixed(2)}`}
                  />
                  <div 
                    className="breakdown-segment fees" 
                    style={{ width: `${((Number(product.pricing.marketplaceFees) / 100) * Number(product.pricing.sellingPrice) / Number(product.calculatedFields.totalCost)) * 100}%` }}
                    title={`Fees: $${((Number(product.pricing.marketplaceFees) / 100) * Number(product.pricing.sellingPrice)).toFixed(2)}`}
                  />
                  <div 
                    className="breakdown-segment marketing" 
                    style={{ width: `${(Number(product.pricing.marketingCost) / Number(product.calculatedFields.totalCost)) * 100}%` }}
                    title={`Marketing: $${Number(product.pricing.marketingCost).toFixed(2)}`}
                  />
                </div>
              </div>

              {/* Competitor Info */}
              {product.competitors && product.competitors.names.length > 0 && (
                <div className="competitor-summary">
                  <p className="competitor-count">🎯 {product.competitors.names.length} competitors tracked</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all duration-200" onClick={() => onEditProduct(product)}>
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200" onClick={() => navigator.clipboard.writeText(JSON.stringify(product))}>
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-200" onClick={() => onDeleteProduct(product.id)}>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PopulatedDashboard;
