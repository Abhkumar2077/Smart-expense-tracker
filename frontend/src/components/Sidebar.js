// frontend/src/components/Sidebar.js
import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';


import {
  FaTachometerAlt,
  FaMoneyBill,
  FaCloudUploadAlt,
  FaRobot,
  FaChartPie,
  FaBell
} from 'react-icons/fa';

const Sidebar = ({ collapsed }) => {

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
              to="/reminders"
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              <FaBell /> <span className="nav-text">Reminders</span>
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