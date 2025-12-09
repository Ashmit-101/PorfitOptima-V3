import React from 'react';
import { NavLink } from 'react-router-dom';

function Sidebar() {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <NavLink 
          to="/" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <span className="sidebar-icon">📊</span>
          <span className="sidebar-label">Dashboard</span>
        </NavLink>
        
        <NavLink 
          to="/products" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <span className="sidebar-icon">📦</span>
          <span className="sidebar-label">Products</span>
        </NavLink>
        
        <NavLink 
          to="/competitors" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <span className="sidebar-icon">🤖</span>
          <span className="sidebar-label">Competitors</span>
        </NavLink>
        
        {/** Manufacturers link removed per request **/}

        <NavLink
          to="/insights"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <span className="sidebar-icon">💡</span>
          <span className="sidebar-label">Insights</span>
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;
