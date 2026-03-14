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
    { name: 'Default', value: '#667eea' },
    { name: 'Purple', value: '#9f7aea' },
    { name: 'Blue', value: '#4299e1' },
    { name: 'Green', value: '#48c774' },
    { name: 'Orange', value: '#ed8936' },
    { name: 'Red', value: '#f56565' },
    { name: 'Pink', value: '#ed64a6' },
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
          padding: '15px',
          background: 'var(--bg-color)',
          borderRadius: 'var(--border-radius)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {darkMode ? <FaMoon size={20} /> : <FaSun size={20} />}
            <div>
              <h4 style={{ margin: 0 }}>Dark Mode</h4>
              <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Switch between light and dark theme
              </p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            style={{
              padding: '10px 20px',
              background: darkMode ? 'var(--primary-color)' : 'var(--bg-color)',
              color: darkMode ? 'white' : 'var(--text-primary)',
              border: '2px solid var(--primary-color)',
              borderRadius: 'var(--border-radius)',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        {/* Primary Color Selector */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ marginBottom: '10px' }}>Primary Color</h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))',
            gap: '10px'
          }}>
            {colors.map(color => (
              <button
                key={color.value}
                onClick={() => setPrimaryColor(color.value)}
                style={{
                  height: '50px',
                  background: color.value,
                  border: primaryColor === color.value ? '4px solid white' : 'none',
                  borderRadius: 'var(--border-radius)',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  outline: primaryColor === color.value ? `2px solid ${color.value}` : 'none',
                  position: 'relative'
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
                    fontSize: '1.2rem'
                  }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size Selector */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaFont /> Font Size
          </h4>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['small', 'medium', 'large'].map(size => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: fontSize === size ? 'var(--primary-color)' : 'var(--bg-color)',
                  color: fontSize === size ? 'white' : 'var(--text-primary)',
                  border: '2px solid var(--primary-color)',
                  borderRadius: 'var(--border-radius)',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textTransform: 'capitalize'
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Compact Mode Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '15px',
          background: 'var(--bg-color)',
          borderRadius: 'var(--border-radius)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {compactMode ? <FaCompress size={20} /> : <FaExpand size={20} />}
            <div>
              <h4 style={{ margin: 0 }}>Compact Mode</h4>
              <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Reduce spacing for more content
              </p>
            </div>
          </div>
          <button
            onClick={toggleCompactMode}
            style={{
              padding: '10px 20px',
              background: compactMode ? 'var(--primary-color)' : 'var(--bg-color)',
              color: compactMode ? 'white' : 'var(--text-primary)',
              border: '2px solid var(--primary-color)',
              borderRadius: 'var(--border-radius)',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {compactMode ? 'Normal' : 'Compact'}
          </button>
        </div>

        {/* Preview Section */}
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: 'var(--bg-color)',
          borderRadius: 'var(--border-radius)',
          border: '2px dashed var(--primary-color)'
        }}>
          <h4 style={{ marginBottom: '15px' }}>Preview</h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px'
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
          <button className="btn btn-primary" style={{ marginTop: '15px' }}>
            Sample Button
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;