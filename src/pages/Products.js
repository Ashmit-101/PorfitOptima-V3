import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ProductForm from '../components/dashboard/ProductForm';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  Download,
  Upload,
  LayoutGrid,
  List,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Shirt,
  Headphones,
  Edit2,
  Copy,
  Trash2,
  MoreVertical,
  Eye,
  Star,
  Tag,
  Receipt,
  Wallet,
  PieChart,
  Archive
} from 'lucide-react';

import { 
  getUserProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct 
} from '../services/databaseService';
import SearchComponent from '../components/ui/animated-glowing-search-bar';

function Products() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('grid');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadProducts();
    }
  }, [currentUser]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedProducts = await getUserProducts(currentUser.uid);
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products. Using offline mode.');
      const savedProducts = localStorage.getItem('profitOptima_products');
      if (savedProducts) setProducts(JSON.parse(savedProducts));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem('profitOptima_products', JSON.stringify(products));
    }
  }, [products]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleSubmitProduct = async (productData) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...productData, id: editingProduct.id } : p));
      } else {
        const docRef = await addProduct(productData, currentUser.uid);
        const newProduct = { ...productData, id: docRef.id, userId: currentUser.uid };
        setProducts(prev => [...prev, newProduct]);
      }
      setShowProductForm(false);
      setEditingProduct(null);
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Failed to save product. Please check your Firebase configuration.');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        setProducts(prev => prev.filter(p => p.id !== productId));
        const updatedProducts = products.filter(p => p.id !== productId);
        if (updatedProducts.length === 0) localStorage.removeItem('profitOptima_products');
      } catch (err) {
        console.error('Error deleting product:', err);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  const handleCancelForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const filteredProducts = products.filter(product => {
    if (filter === 'all') return true;
    if (filter === 'active') return product.status?.isActive;
    if (filter === 'inactive') return !product.status?.isActive;
    return product.basicInfo?.category === filter;
  }).filter(product => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = (product.basicInfo?.name || product.name || '').toLowerCase();
    const cat = (product.basicInfo?.category || '').toLowerCase();
    const sku = (product.basicInfo?.sku || '').toLowerCase();
    return name.includes(q) || cat.includes(q) || sku.includes(q);
  });

  const categories = Array.from(new Set(products.map(p => p.basicInfo?.category).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Products</h1>
              <p className="text-lg text-gray-600">Manage and analyze your product portfolio</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[rgb(112,82,174)] rounded-lg hover:bg-[rgb(100,70,160)] shadow-lg hover:shadow-xl transition-all" onClick={handleAddProduct}>
                <Plus className="w-5 h-5" />
                Add Product
              </button>
            </div>
          </div>
      </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600 font-medium">Total Products</p>
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{products.length}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600 font-medium">Active Products</p>
                  <div className="bg-green-100 p-2 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-green-600 mb-1">{products.filter(p=>p.status?.isActive).length}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600 font-medium">Avg. Margin</p>
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-purple-600 mb-1">{(products.length ? (products.reduce((acc,p)=>acc + Number(p.calculatedFields?.profitMargin||0),0)/products.length) : 0).toFixed(1)}%</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600 font-medium">Total Value</p>
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <DollarSign className="w-5 h-5 text-gray-700" />
                  </div>
                </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">${products.reduce((acc,p)=>acc + Number(p.pricing?.sellingPrice||0),0).toFixed(2)}</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col gap-4 mb-6">
            <SearchComponent 
              value={searchQuery} 
              onChange={(e)=>setSearchQuery(e.target.value)} 
              placeholder="Search products by name, category, or SKU..." 
            />
            
            <div className="flex items-center justify-end gap-3">
              <button className="px-4 py-2.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Filters</span>
              </button>
              
              <button className="px-4 py-2.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Sort</span>
              </button>
              
              <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl shadow-sm">
                <button className={`p-2 ${view==='grid' ? 'bg-gray-100 rounded-lg' : 'hover:bg-gray-50 rounded-lg'}`} onClick={()=>setView('grid')}>
                  <LayoutGrid className={`w-4 h-4 ${view==='grid' ? 'text-gray-700' : 'text-gray-400'}`} />
                </button>
                <button className={`p-2 ${view==='table' ? 'bg-gray-100 rounded-lg' : 'hover:bg-gray-50 rounded-lg'}`} onClick={()=>setView('table')}>
                  <List className={`w-4 h-4 ${view==='table' ? 'text-gray-700' : 'text-gray-400'}`} />
                </button>
              </div>
            </div>
          </div>

        {/* Category Tabs */}
        {products.length > 0 && (
          <div className="flex items-center gap-3 mb-6">
            <button className={`flex items-center gap-2 px-4 py-2.5 text-sm ${filter==='all' ? 'font-semibold text-white bg-blue-600' : 'font-medium text-gray-700 bg-gray-100 hover:bg-gray-200'} rounded-lg`} onClick={()=>setFilter('all')}>
              All
              <span className="bg-blue-500 px-2 py-0.5 rounded-full text-xs font-bold">{products.length}</span>
            </button>
            <button className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg`} onClick={()=>setFilter('active')}>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Active
              <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs font-semibold text-gray-600">{products.filter(p=>p.status?.isActive).length}</span>
            </button>
            <button className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg`} onClick={()=>setFilter('inactive')}>
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              Inactive
              <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs font-semibold text-gray-600">{products.filter(p=>!p.status?.isActive).length}</span>
            </button>
            <div className="h-8 w-px bg-gray-300 mx-1"></div>
            {categories.map(category => (
              <button key={category} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg`} onClick={()=>setFilter(category)}>
                {(category||'').toLowerCase().includes('cloth') ? <Shirt className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                {category}
                <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs font-semibold text-gray-600">{products.filter(p => p.basicInfo?.category === category).length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Product Views */}
        {filteredProducts.length === 0 ? (
          <div className="p-8">
            <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">Get started by adding your first product or adjust your filters to see more results.</p>
              <button className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[rgb(112,82,174)] rounded-lg hover:bg-[rgb(100,70,160)] shadow-lg hover:shadow-xl transition-all" onClick={handleAddProduct}>
                <Plus className="w-5 h-5" />
                Add Your First Product
              </button>
            </div>
          </div>
        ) : view === 'table' ? (
          <div className="p-8">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left"><input type="checkbox" className="rounded border-gray-300" onChange={(e)=> setSelectedProducts(e.target.checked ? filteredProducts.map(p=>p.id) : [])} /></th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Profit</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Margin</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4"><input type="checkbox" className="rounded border-gray-300" checked={selectedProducts.includes(p.id)} onChange={(e)=> setSelectedProducts(prev => e.target.checked ? [...prev, p.id] : prev.filter(id=>id!==p.id))} /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{p.basicInfo?.name}</p>
                            <p className="text-sm text-gray-500">SKU: {p.basicInfo?.sku || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {(p.basicInfo?.category||'').toLowerCase().includes('cloth') ? <Shirt className="w-4 h-4 text-gray-400" /> : <Headphones className="w-4 h-4 text-gray-400" />}
                          <span className="text-sm text-gray-700">{p.basicInfo?.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right"><span className="font-semibold text-blue-600">${Number(p.pricing?.sellingPrice||0).toFixed(2)}</span></td>
                      <td className="px-6 py-4 text-right"><span className="font-semibold text-gray-700">${Number(p.calculatedFields?.totalCost||0).toFixed(2)}</span></td>
                      <td className="px-6 py-4 text-right"><span className="font-semibold text-green-600">${Number(p.calculatedFields?.netProfit||0).toFixed(2)}</span></td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${Number(p.calculatedFields?.profitMargin||0) >= 30 ? 'bg-green-50 text-green-700 border-green-200' : Number(p.calculatedFields?.profitMargin||0) >= 15 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {Number(p.calculatedFields?.profitMargin||0) >= 30 ? <TrendingUp className="w-3 h-3" /> : Number(p.calculatedFields?.profitMargin||0) >= 15 ? <Minus className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Number(p.calculatedFields?.profitMargin||0).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${p.status?.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          <div className={`w-2 h-2 rounded-full ${p.status?.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          {p.status?.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={()=>handleEditProduct(p)}>
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={()=>navigator.clipboard.writeText(JSON.stringify(p))}>
                            <Copy className="w-4 h-4 text-gray-600" />
                          </button>
                          <button className="p-2 hover:bg-red-50 rounded-lg transition-colors" onClick={()=>handleDeleteProduct(p.id)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((p, idx) => {
                const marginPct = p.pricing?.marginPercent ?? Number(p.calculatedFields?.profitMargin||0);
                const lowMargin = marginPct < 15;
                return (
                  <div key={p.id || idx} className="bg-white rounded-xl shadow-md overflow-hidden">
                    {/* Header */}
                    <div className="p-6 mb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{p.basicInfo?.name || p.name || 'Product'}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {(p.basicInfo?.category||'').toLowerCase().includes('cloth') ? <Shirt className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                            <span>{p.basicInfo?.category || 'Unknown'}</span>
                            <span className="text-gray-300">•</span>
                            <span>SKU: {p.basicInfo?.sku || '--'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 ${p.status?.isActive ? 'bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-green-200' : 'bg-gray-50 text-gray-600 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200'}`}>
                            <div className={`w-2 h-2 ${p.status?.isActive ? 'bg-green-500' : 'bg-gray-400'} rounded-full animate-pulse`}></div>
                            {p.status?.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreVertical className="w-5 h-5 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                      {/* 2x2 Grid of Pricing Boxes */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        {/* Selling Price Box */}
                        <div className="bg-blue-50 rounded-xl p-4 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-2">
                            <Tag className="w-5 h-5 text-blue-600" />
                            <p className="text-sm text-blue-700 font-semibold uppercase tracking-wide">Selling Price</p>
                          </div>
                          <p className="text-3xl font-bold text-blue-600">${Number(p.pricing?.sellingPrice||0).toFixed(2)}</p>
                        </div>
                        
                        {/* Total Cost Box */}
                        <div className="bg-gray-100 rounded-xl p-4 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-2">
                            <Receipt className="w-5 h-5 text-gray-600" />
                            <p className="text-sm text-gray-700 font-semibold uppercase tracking-wide">Total Cost</p>
                          </div>
                          <p className="text-3xl font-bold text-gray-700">${Number(p.calculatedFields?.totalCost||p.pricing?.totalCost||0).toFixed(2)}</p>
                        </div>
                        
                        {/* Net Profit Box */}
                        <div className="bg-green-50 rounded-xl p-4 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-2">
                            <Wallet className="w-5 h-5 text-green-600" />
                            <p className="text-sm text-green-700 font-semibold uppercase tracking-wide">Net Profit</p>
                          </div>
                          <p className="text-3xl font-bold text-green-600">${Number(p.calculatedFields?.netProfit||0).toFixed(2)}</p>
                        </div>
                        
                        {/* Profit Margin Box */}
                        <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl p-4 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            <p className="text-sm text-green-700 font-semibold uppercase tracking-wide">Margin</p>
                          </div>
                          <p className="text-3xl font-bold text-green-600">{Number(marginPct||0).toFixed(1)}%</p>
                        </div>
                      </div>

                      {/* Additional Stats - Horizontal Row */}
                      <div className="flex items-center justify-around bg-gray-50 rounded-xl p-4 mb-6 gap-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 font-medium mb-1">Sales</p>
                          <p className="text-lg font-bold text-gray-900">{p.stats?.sales ?? 0}</p>
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 font-medium mb-1">Revenue</p>
                          <p className="text-lg font-bold text-gray-900">${p.stats?.revenue ?? 0}</p>
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 font-medium mb-1">Stock</p>
                          <p className="text-lg font-bold text-gray-900">{p.stats?.stock ?? 0}</p>
                        </div>
                      </div>

                      {/* Cost Breakdown */}
                      <div className="mb-6">
                        <p className="text-xs text-gray-600 font-medium mb-3 flex items-center gap-1.5">
                          <PieChart className="w-3.5 h-3.5" />
                          Cost Breakdown
                        </p>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                          <div className="bg-blue-500 transition-all" style={{width: `${p.costBreakdown?.materials ?? 45}%`}} title={`Materials: ${p.costBreakdown?.materials ?? 45}%`}></div>
                          <div className="bg-green-500 transition-all" style={{width: `${p.costBreakdown?.labor ?? 30}%`}} title={`Labor: ${p.costBreakdown?.labor ?? 30}%`}></div>
                          <div className="bg-orange-500 transition-all" style={{width: `${p.costBreakdown?.overhead ?? 15}%`}} title={`Overhead: ${p.costBreakdown?.overhead ?? 15}%`}></div>
                          <div className="bg-red-500 transition-all" style={{width: `${p.costBreakdown?.shipping ?? 10}%`}} title={`Shipping: ${p.costBreakdown?.shipping ?? 10}%`}></div>
                        </div>
                      </div>

                      {/* Low Margin Alert */}
                      {lowMargin && (
                        <div className="bg-red-50 rounded-xl p-4 mb-6 flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-red-700 mb-1">Low Profit Margin Alert</p>
                            <p className="text-xs text-red-600">Consider reviewing pricing strategy</p>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons - Full Width, Stacked */}
                      <div className="space-y-4">
                        <button className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors" onClick={()=>handleEditProduct(p)}>
                          <Edit2 className="w-4 h-4 text-gray-700" />
                          <span className="font-medium text-gray-700">Edit</span>
                        </button>
                        
                        <button className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors" onClick={()=>navigator.clipboard.writeText(JSON.stringify(p))}>
                          <Copy className="w-4 h-4 text-gray-700" />
                          <span className="font-medium text-gray-700">Copy</span>
                        </button>
                        
                        <button className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 rounded-xl transition-colors" onClick={()=>handleDeleteProduct(p.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                          <span className="font-medium text-red-600">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Inline Form and Bulk actions handled below to avoid duplication */}
      </div>

      {showProductForm && (
        <ProductForm
          onSubmit={handleSubmitProduct}
          onCancel={handleCancelForm}
          initialData={editingProduct}
        />
      )}

      {/* Bulk Actions Bar */}
      {selectedProducts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gray-900 text-white rounded-xl shadow-2xl px-6 py-4 flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 px-3 py-1.5 rounded-lg">
                <span className="font-bold">{selectedProducts.length}</span> selected
              </div>
              <button className="text-white/70 hover:text-white transition-colors text-sm" onClick={()=>setSelectedProducts([])}>Clear</button>
            </div>
            <div className="h-6 w-px bg-white/20"></div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-sm font-medium">
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-sm font-medium">
                <Copy className="w-4 h-4" />
                Duplicate
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-sm font-medium">
                <Archive className="w-4 h-4" />
                Archive
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all text-sm font-medium" onClick={() => {
                selectedProducts.forEach(id => handleDeleteProduct(id));
                setSelectedProducts([]);
              }}>
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
