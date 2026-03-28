// frontend/src/components/Sidebar.js
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';


import { 
  FaTachometerAlt, 
  FaMoneyBill, 
  FaChartPie, 
  FaBell,
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
            <h1></h1>
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
            <FaMoneyBill /> <span className="nav-text">Expenses</span>
          </NavLink>
        </li>
        
        <li className="nav-item">
          <NavLink 
            to="/reports" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <FaChartPie /> <span className="nav-text">Reports</span>
          </NavLink>
        </li>
       
        <li className="nav-item">
          <NavLink 
            to="/goals" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <FaBullseye /> <span className="nav-text">Savings Goals</span>
          </NavLink>
        </li>
       
        <li className="nav-item">
          <NavLink 
            to="/upload" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <FaCloudUploadAlt /> <span className="nav-text">Import CSV</span>
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink 
            to="/notifications" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <FaBell /> <span className="nav-text">Notifications</span>
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink 
            to="/settings" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <FaCog /> <span className="nav-text">Settings</span>
          </NavLink>
        </li>
      </ul>
            <div className="sidebar-footer">
        <div className="user-card">
          <p className="user-name">{user?.name || 'User'}</p>
          <p className="user-email">{user?.email || 'user@example.com'}</p>
        </div>

      </div>
    </div>
    </>
  );
};

export default Sidebar;