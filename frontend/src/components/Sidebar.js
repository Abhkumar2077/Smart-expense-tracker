// frontend/src/components/Sidebar.js
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';


import {
  FaTachometerAlt,
  FaMoneyBill,
  FaCog,
  FaSignOutAlt,
  FaCloudUploadAlt,
  FaBars,
  FaRobot,
  FaBullseye,
  FaChartPie
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ collapsed }) => {
  const { user, logout } = useAuth();

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

  return (
    <>
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
            <FaMoneyBill /> <span className="nav-text">Transactions</span>
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink
            to="/ai"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <FaRobot /> <span className="nav-text">AI Insights</span>
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
            to="/reports"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <FaChartPie /> <span className="nav-text">Reports</span>
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink
            to="/upload"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <FaCloudUploadAlt /> <span className="nav-text">Upload</span>
          </NavLink>
        </li>
      </ul>
            <div className="sidebar-footer">
      </div>
    </div>
    </>
  );
};

export default Sidebar;