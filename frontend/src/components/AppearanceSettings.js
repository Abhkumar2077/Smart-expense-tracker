// frontend/src/components/AppearanceSettings.js
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  FaMoon, FaSun, FaPalette, FaFont, 
  FaCompress, FaExpand, FaCheck 
} from 'react-icons/fa';

const AppearanceSettings = () => {
  const {
    darkMode,
    primaryColor,
    fontSize,
    compactMode,
    toggleDarkMode,
    setPrimaryColor,
    setFontSize,
    toggleCompactMode
  } = useTheme();

  const colors = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Green', value: '#10b981' },
    { name: 'Teal', value: '#06b6d4' },
    { name: 'Blue', value: '#3b82f6' },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <FaPalette /> Appearance Settings
        </h3>
      </div>
      
      <div style={{ padding: '20px' }}>
        {/* Dark Mode Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '25px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              background: darkMode ? 'var(--bg-primary)' : 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              {darkMode ? <FaMoon /> : <FaSun />}
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Dark Mode</h4>
              <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)' }}>
                Switch between light and dark theme
              </p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className="btn"
            style={{
              background: darkMode ? 'var(--primary-color)' : 'transparent',
              color: darkMode ? 'white' : 'var(--text-primary)',
              border: '2px solid var(--primary-color)',
              minWidth: '120px'
            }}
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        {/* Primary Color Selector */}
        <div style={{ marginBottom: '25px' }}>
          <h4 style={{ marginBottom: '15px', fontSize: 'var(--font-size-lg)' }}>
            <FaPalette /> Primary Color
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))',
            gap: '12px'
          }}>
            {colors.map(color => (
              <button
                key={color.value}
                onClick={() => setPrimaryColor(color.value)}
                style={{
                  height: '70px',
                  background: color.value,
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-md)',
                  outline: primaryColor === color.value ? `3px solid var(--text-primary)` : 'none',
                  outlineOffset: '2px',
                  position: 'relative',
                  transition: 'all var(--transition-fast)'
                }}
                title={color.name}
              >
                {primaryColor === color.value && (
                  <FaCheck style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'white',
                    fontSize: '24px',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                  }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size Selector */}
        <div style={{ marginBottom: '25px' }}>
          <h4 style={{ marginBottom: '15px', fontSize: 'var(--font-size-lg)' }}>
            <FaFont /> Font Size
          </h4>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { value: 'small', label: 'Small', icon: 'A' },
              { value: 'medium', label: 'Medium', icon: 'A' },
              { value: 'large', label: 'Large', icon: 'A' }
            ].map((size, index) => (
              <button
                key={size.value}
                onClick={() => setFontSize(size.value)}
                className="btn"
                style={{
                  flex: 1,
                  background: fontSize === size.value ? 'var(--primary-color)' : 'transparent',
                  color: fontSize === size.value ? 'white' : 'var(--text-primary)',
                  border: '2px solid var(--primary-color)',
                  padding: '15px',
                  fontSize: index === 0 ? '14px' : index === 1 ? '16px' : '18px',
                  fontWeight: 'bold'
                }}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>

        {/* Compact Mode Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              {compactMode ? <FaCompress /> : <FaExpand />}
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Compact Mode</h4>
              <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)' }}>
                Reduce spacing to see more content
              </p>
            </div>
          </div>
          <button
            onClick={toggleCompactMode}
            className="btn"
            style={{
              background: compactMode ? 'var(--primary-color)' : 'transparent',
              color: compactMode ? 'white' : 'var(--text-primary)',
              border: '2px solid var(--primary-color)',
              minWidth: '120px'
            }}
          >
            {compactMode ? '📦 Normal' : '🔲 Compact'}
          </button>
        </div>

        {/* Live Preview */}
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '2px dashed var(--primary-color)'
        }}>
          <h4 style={{ marginBottom: '15px' }}>Live Preview</h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '15px',
            marginBottom: '15px'
          }}>
            <div className="stat-card" style={{ padding: '15px' }}>
              <div className="stat-value">₹1,234</div>
              <div className="stat-label">Sample Value</div>
            </div>
            <div className="stat-card" style={{ padding: '15px' }}>
              <div className="stat-value">89%</div>
              <div className="stat-label">Percentage</div>
            </div>
            <div className="stat-card" style={{ padding: '15px' }}>
              <div className="stat-value">42</div>
              <div className="stat-label">Count</div>
            </div>
          </div>
          <button className="btn btn-primary">Sample Button</button>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;