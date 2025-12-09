import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function Header() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <h2>ProfitOptima</h2>
        <div className="header-nav flex items-center gap-4">
          <span className="user-greeting text-gray-600 font-medium">
            Welcome, {currentUser?.displayName || currentUser?.email || 'User'}!
          </span>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(112,82,174)] bg-purple-50 border border-purple-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-200 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
