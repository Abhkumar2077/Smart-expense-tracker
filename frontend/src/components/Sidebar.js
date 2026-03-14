// frontend/src/components/Sidebar.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaTachometerAlt, 
  FaMoneyBill, 
  FaChartPie, 
  FaCog, 
  FaSignOutAlt,
  FaCloudUploadAlt 
} from 'react-icons/fa';

const Sidebar = () => {
  const { user, logout } = useAuth();

  return (
    <div className="sidebar" style={{
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-light)',
      padding: 'var(--spacing-2xl)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      width: '280px',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 1000
    }}>
      <div style={{
        marginBottom: 'var(--spacing-4xl)',
        paddingBottom: 'var(--spacing-xl)',
        borderBottom: '1px solid var(--border-light)'
      }}>
        <h1 style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--primary-color)',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-md)',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          💰 Smart Expense
        </h1>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: 'var(--font-size-sm)',
          margin: 'var(--spacing-sm) 0 0 0',
          fontWeight: 'var(--font-weight-normal)'
        }}>
          Track your finances smarter
        </p>
      </div>
      <ul className="nav-menu" style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        flex: 1
      }}>
        <li className="nav-item">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-lg)',
              padding: 'var(--spacing-lg)',
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 'inherit',
              transition: 'all var(--transition-fast)',
              marginBottom: 'var(--spacing-xs)',
              position: 'relative'
            }}
          >
            <FaTachometerAlt /> Dashboard
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink 
            to="/expenses" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-lg)',
              padding: 'var(--spacing-lg)',
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 'inherit',
              transition: 'all var(--transition-fast)',
              marginBottom: 'var(--spacing-xs)',
              position: 'relative'
            }}
          >
            <FaMoneyBill /> Expenses
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink 
            to="/reports" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-lg)',
              padding: 'var(--spacing-lg)',
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 'inherit',
              transition: 'all var(--transition-fast)',
              marginBottom: 'var(--spacing-xs)',
              position: 'relative'
            }}
          >
            <FaChartPie /> Reports
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink 
            to="/upload" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-lg)',
              padding: 'var(--spacing-lg)',
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 'inherit',
              transition: 'all var(--transition-fast)',
              marginBottom: 'var(--spacing-xs)',
              position: 'relative'
            }}
          >
            <FaCloudUploadAlt /> Import CSV
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink 
            to="/settings" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-lg)',
              padding: 'var(--spacing-lg)',
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 'inherit',
              transition: 'all var(--transition-fast)',
              marginBottom: 'var(--spacing-xs)',
              position: 'relative'
            }}
          >
            <FaCog /> Settings
          </NavLink>
        </li>
      </ul>
      
      <div style={{
        marginTop: 'auto',
        paddingTop: 'var(--spacing-5xl)',
        borderTop: '1px solid var(--border-light)',
        marginTop: 'var(--spacing-5xl)'
      }}>
        <div style={{
          marginBottom: 'var(--spacing-xl)',
          padding: 'var(--spacing-xl)',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)'
        }}>
          <p style={{
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--spacing-xs)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-primary)'
          }}>
            {user?.name || 'User'}
          </p>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: 'var(--font-size-xs)',
            margin: 0
          }}>
            {user?.email || 'user@example.com'}
          </p>
        </div>
        <button
          onClick={logout}
          style={{
            width: '100%',
            padding: 'var(--spacing-lg)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--font-size-base)',
            fontWeight: 'var(--font-weight-medium)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--spacing-md)',
            transition: 'all var(--transition-fast)',
            boxShadow: 'var(--shadow-sm)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'var(--error-color)';
            e.target.style.color = 'white';
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = 'var(--shadow-md)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'var(--bg-secondary)';
            e.target.style.color = 'var(--text-primary)';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'var(--shadow-sm)';
          }}
        >
          <FaSignOutAlt style={{ fontSize: 'var(--font-size-lg)' }} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;