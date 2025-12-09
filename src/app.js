import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import CompetitorsPage from './pages/CompetitorsPage';
import Insights from './pages/Insights';
import Login from './pages/Login';
import Signup from './pages/Singup';
import './app.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Products />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/competitors" element={
            <ProtectedRoute>
              <DashboardLayout>
                <CompetitorsPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/insights" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Insights />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;