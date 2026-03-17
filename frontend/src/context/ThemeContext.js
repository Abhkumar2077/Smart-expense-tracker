// frontend/src/context/ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [primaryColor, setPrimaryColor] = useState(() => {
    const saved = localStorage.getItem('primaryColor');
    return saved || '#6366f1';
  });

  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('fontSize');
    return saved || 'medium';
  });

  const [compactMode, setCompactMode] = useState(() => {
    const saved = localStorage.getItem('compactMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Apply theme changes to document
  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    localStorage.setItem('primaryColor', primaryColor);
    localStorage.setItem('fontSize', fontSize);
    localStorage.setItem('compactMode', JSON.stringify(compactMode));

    // Apply dark mode class
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }

    // Apply primary color
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    
    // Calculate and apply secondary color (slightly darker)
    const secondaryColor = adjustColor(primaryColor, -30);
    document.documentElement.style.setProperty('--primary-dark', secondaryColor);

    // Apply font size scaling
    let fontSizeScale = 1;
    let baseFontSize = '1rem';
    
    if (fontSize === 'small') {
      fontSizeScale = 0.9;
      baseFontSize = '0.9rem';
    } else if (fontSize === 'large') {
      fontSizeScale = 1.1;
      baseFontSize = '1.1rem';
    }
    
    // Update font size variables
    document.documentElement.style.setProperty('--font-size-base', baseFontSize);
    document.documentElement.style.setProperty('--font-size-scale', fontSizeScale);
    
    // Scale all font sizes proportionally
    const fontSizes = {
      xs: `calc(0.75rem * ${fontSizeScale})`,
      sm: `calc(0.875rem * ${fontSizeScale})`,
      base: `calc(1rem * ${fontSizeScale})`,
      lg: `calc(1.125rem * ${fontSizeScale})`,
      xl: `calc(1.25rem * ${fontSizeScale})`,
      '2xl': `calc(1.5rem * ${fontSizeScale})`,
      '3xl': `calc(1.875rem * ${fontSizeScale})`,
      '4xl': `calc(2.25rem * ${fontSizeScale})`,
    };

    Object.entries(fontSizes).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--font-size-${key}`, value);
    });

    // Apply compact mode spacing
    const spacingUnit = compactMode ? '4px' : '8px';
    document.documentElement.style.setProperty('--spacing-unit', spacingUnit);
    
    // Scale all spacing variables
    const spacingMultiplier = compactMode ? 0.5 : 1;
    const spacings = {
      xs: `calc(0.25rem * ${spacingMultiplier})`,
      sm: `calc(0.5rem * ${spacingMultiplier})`,
      md: `calc(0.75rem * ${spacingMultiplier})`,
      lg: `calc(1rem * ${spacingMultiplier})`,
      xl: `calc(1.25rem * ${spacingMultiplier})`,
      '2xl': `calc(1.5rem * ${spacingMultiplier})`,
      '3xl': `calc(2rem * ${spacingMultiplier})`,
      '4xl': `calc(2.5rem * ${spacingMultiplier})`,
      '5xl': `calc(3rem * ${spacingMultiplier})`,
    };

    Object.entries(spacings).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--spacing-${key}`, value);
    });

  }, [darkMode, primaryColor, fontSize, compactMode]);

  // Helper function to adjust color brightness
  const adjustColor = (color, percent) => {
    try {
      // Handle hex colors
      if (color.startsWith('#')) {
        let R = parseInt(color.substring(1,3), 16);
        let G = parseInt(color.substring(3,5), 16);
        let B = parseInt(color.substring(5,7), 16);
        
        R = Math.min(255, Math.max(0, R + percent));
        G = Math.min(255, Math.max(0, G + percent));
        B = Math.min(255, Math.max(0, B + percent));
        
        return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
      }
      // Handle rgb/rgba
      if (color.startsWith('rgb')) {
        const rgb = color.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
          const r = Math.min(255, Math.max(0, parseInt(rgb[0]) + percent));
          const g = Math.min(255, Math.max(0, parseInt(rgb[1]) + percent));
          const b = Math.min(255, Math.max(0, parseInt(rgb[2]) + percent));
          return `rgb(${r}, ${g}, ${b})`;
        }
      }
      return '#4f46e5'; // Default fallback
    } catch {
      return '#4f46e5';
    }
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleCompactMode = () => setCompactMode(!compactMode);

  return (
    <ThemeContext.Provider value={{
      darkMode,
      primaryColor,
      fontSize,
      compactMode,
      toggleDarkMode,
      setPrimaryColor,
      setFontSize,
      toggleCompactMode
    }}>
      {children}
    </ThemeContext.Provider>
  );
};