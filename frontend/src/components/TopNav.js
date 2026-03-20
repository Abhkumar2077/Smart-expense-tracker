import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaPlus, FaTachometerAlt, FaChartPie, FaBullseye, FaUserCircle, FaCog, FaSignOutAlt, FaFileAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const TopNav = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="top-nav">
      <div className="top-nav-left">
        <NavLink to="/dashboard" className="top-nav-logo">
          <span>Smart Expense Tracker</span>
        </NavLink>

        <NavLink to="/dashboard" className="top-nav-link">
          <FaTachometerAlt /> Dashboard
        </NavLink>
        <NavLink to="/goals" className="top-nav-link">
          <FaBullseye /> Savings Goals
        </NavLink>
        <NavLink to="/reports" className="top-nav-link">
          <FaChartPie /> Reports
        </NavLink>
      </div>

      <div className="top-nav-right">
        <button
          className="top-nav-btn top-nav-primary"
          onClick={() => navigate('/expenses')}
          title="Add transaction"
        >
          <FaPlus /> Add Transaction
        </button>

        <div className="user-dropdown-container" onMouseLeave={() => setDropdownOpen(false)}>
          <button
            className="top-nav-btn user-btn"
            onClick={() => setDropdownOpen((o) => !o)}
            title="User menu"
          >
            <FaUserCircle /> {user?.name || 'User'}
          </button>

          {dropdownOpen && (
            <div className="user-dropdown-menu">
              <div className="dropdown-item info">
                <strong>ID:</strong> {user?.id || user?._id || 'n/a'}
              </div>
              <NavLink to="/settings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                <FaCog /> Settings
              </NavLink>
              <button className="dropdown-item" onClick={handleLogout}>
                <FaSignOutAlt /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
