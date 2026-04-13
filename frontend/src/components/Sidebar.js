// frontend/src/components/Sidebar.js
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';


import { 
  FaTachometerAlt, 
  FaMoneyBill, 
  FaChartPie, 
  FaCog, 
  FaSignOutAlt,
  FaCloudUploadAlt,
  FaBullseye,
  FaBars
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const root = document.querySelector('.dashboard');
    if (root) {
      if (collapsed) {
        root.classList.add('sidebar-collapsed');
      } else {
        root.classList.remove('sidebar-collapsed');
      }
    }
  }, [collapsed]);

  const toggleSidebar = () => {
    setCollapsed((value) => !value);
  };

  return (
    <>
      <button className="sidebar-toggle floating-toggle" onClick={toggleSidebar}>
        <FaBars />
      </button>
      <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <h1>Analytix</h1>
          </div>
        </div>
      
        <ul className="nav-menu">
        <li className="nav-item">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <FaTachometerAlt /> <span className="nav-text">Dashboard</span>
          </NavLink>
        </li>
        
        <li className="nav-item">
          <NavLink 
            to="/expenses" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <FaMoneyBill /> <span className="nav-text">Transactions</span>
          </NavLink>
        </li>
      </ul>
            <div className="sidebar-footer">
        <div className="nav-item">
          <NavLink 
            to="/settings" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <FaCog /> <span className="nav-text">Settings</span>
          </NavLink>
        </div>
        
        <button className="signout-btn" onClick={logout}>
          <FaSignOutAlt /> <span>Log out</span>
        </button>
      </div>
    </div>
    </>
  );
};

export default Sidebar;