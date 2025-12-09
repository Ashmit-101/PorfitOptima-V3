import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import EmptyDashboard from '../components/dashboard/EmptyDashboard';
import PopulatedDashboard from '../components/dashboard/PopulatedDashboard';
import ProductForm from '../components/dashboard/ProductForm';
import { 
  getUserProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct 
} from '../services/databaseService';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load products from Firestore on mount
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
      // Fallback to localStorage if Firebase fails
      const savedProducts = localStorage.getItem('profitOptima_products');
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      }
    } finally {
      setLoading(false);
    }
  };

  // Save to localStorage as backup
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
        // Update existing product in Firebase
        await updateProduct(editingProduct.id, productData);
        setProducts(prev => prev.map(p => 
          p.id === editingProduct.id ? { ...productData, id: editingProduct.id } : p
        ));
      } else {
        // Add new product to Firebase
        const docRef = await addProduct(productData, currentUser.uid);
        const newProduct = {
          ...productData,
          id: docRef.id,
          userId: currentUser.uid
        };
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
        
        // Update localStorage
        const updatedProducts = products.filter(p => p.id !== productId);
        if (updatedProducts.length === 0) {
          localStorage.removeItem('profitOptima_products');
        } else {
          localStorage.setItem('profitOptima_products', JSON.stringify(updatedProducts));
        }
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

  if (loading) {
    return (
      <div className="dashboard" style={{ textAlign: 'center', padding: '4rem' }}>
        <div className="loading-spinner">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {error && (
        <div className="error-banner" style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          ⚠️ {error}
        </div>
      )}
      
      {products.length === 0 ? (
        <EmptyDashboard onAddProduct={handleAddProduct} />
      ) : (
        <PopulatedDashboard 
          products={products}
          onAddProduct={handleAddProduct}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
        />
      )}

      {showProductForm && (
        <ProductForm
          onSubmit={handleSubmitProduct}
          onCancel={handleCancelForm}
          initialData={editingProduct}
        />
      )}
    </div>
  );
};

export default Dashboard;