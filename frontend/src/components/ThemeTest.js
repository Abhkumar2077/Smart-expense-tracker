// frontend/src/components/ThemeTest.js
import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeTest = () => {
  const { 
    darkMode, 
    fontSize, 
    compactMode, 
    toggleDarkMode, 
    setFontSize, 
    toggleCompactMode 
  } = useTheme();

  return (
    <div style={{ padding: '20px', background: 'var(--card-bg)', borderRadius: '8px' }}>
      <h3>Theme Test</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <p>Current font size: <strong>{fontSize}</strong></p>
        <p>Current scale: <strong>{document.documentElement.style.getPropertyValue('--font-size-scale')}</strong></p>
        <p>Compact mode: <strong>{compactMode ? 'Yes' : 'No'}</strong></p>
        <p>Dark mode: <strong>{darkMode ? 'Yes' : 'No'}</strong></p>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => setFontSize('small')} className="btn">Small Font</button>
        <button onClick={() => setFontSize('medium')} className="btn btn-primary">Medium Font</button>
        <button onClick={() => setFontSize('large')} className="btn">Large Font</button>
        <button onClick={toggleCompactMode} className="btn">
          {compactMode ? 'Disable' : 'Enable'} Compact Mode
        </button>
        <button onClick={toggleDarkMode} className="btn">
          {darkMode ? 'Light' : 'Dark'} Mode
        </button>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: 'var(--bg-color)', borderRadius: '4px' }}>
        <p>Sample text to see font size changes</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span className="category-badge" style={{ background: 'var(--primary-color)' }}>Test Badge</span>
          <button className="btn btn-primary">Test Button</button>
        </div>
      </div>
    </div>
  );
};

export default ThemeTest;