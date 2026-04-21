import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaPlus, FaUserCircle, FaCog, FaSignOutAlt, FaBell, FaBars } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const TopNav = ({ toggleSidebar }) => {
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
        <button className="sidebar-toggle-btn" onClick={toggleSidebar} title="Toggle sidebar">
          <FaBars />
        </button>

        <NavLink to="/dashboard" className="top-nav-logo">
          <span>Smart Expense Tracker</span>
        </NavLink>
      </div>

      <div className="top-nav-right">
        {/* Notification Bell */}
        <button
          className="notification-btn"
          onClick={() => navigate('/notifications')}
          title="Notifications"
        >
          <FaBell />
          <span className="notification-badge">3</span>
        </button>

        {/* Add Transaction Button - Now just + icon */}
        <button
          className="add-transaction-btn"
          onClick={() => navigate('/expenses')}
          title="Add Transaction"
        >
          <FaPlus />
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
              <div className="dropdown-header">
                <div className="user-info">
                  <div className="user-avatar">
                    <FaUserCircle />
                  </div>
                  <div className="user-details">
                    <div className="user-name">{user?.name || 'User'}</div>
                    <div className="user-id">ID: {user?.id || user?._id || 'n/a'}</div>
                  </div>
                </div>
              </div>
              
              <div className="dropdown-body">
                <NavLink to="/settings" className="dropdown-item settings-item" onClick={() => setDropdownOpen(false)}>
                  <FaCog /> Settings
                </NavLink>
              </div>
              
              <div className="dropdown-footer">
                <button className="dropdown-item logout-item" onClick={handleLogout}>
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
