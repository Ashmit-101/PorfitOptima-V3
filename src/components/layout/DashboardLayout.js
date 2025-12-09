import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      <Header />
      <div className="dashboard-main">
        <Sidebar />
        <div className="dashboard-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
