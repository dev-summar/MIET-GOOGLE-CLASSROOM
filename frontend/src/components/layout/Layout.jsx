import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import '../../styles/layout.css';

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-layout">
      <Header onMenuClick={openSidebar} />
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      <div className="layout-main">
        <div className="layout-content">
          <Outlet />
        </div>
      </div>
      {sidebarOpen && <div className="layout-overlay" onClick={closeSidebar} aria-hidden="true" />}
    </div>
  );
}

export default Layout;
