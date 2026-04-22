import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaPlus, FaUserCircle, FaCog, FaSignOutAlt, FaBell, FaBars } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const TopNav = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // For now, no notifications - this should be replaced with actual notification count
  // TODO: Implement notification system with real count from API
  const notificationCount = 0;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

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
          {notificationCount > 0 && (
            <span className="notification-badge">{notificationCount}</span>
          )}
        </button>

        {/* Add Transaction Button - Now just + icon */}
        <button
          className="add-transaction-btn"
          onClick={() => navigate('/expenses')}
          title="Add Transaction"
        >
          <FaPlus />
        </button>

        <div className="user-dropdown-container" ref={dropdownRef}>
          <button
            className="top-nav-btn user-btn"
            onClick={() => setDropdownOpen((o) => !o)}
            title="User menu"
            aria-expanded={dropdownOpen}
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
