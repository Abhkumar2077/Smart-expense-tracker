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
    return saved || '#667eea';
  });

  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('fontSize');
    return saved || 'medium'; // small, medium, large
  });

  const [compactMode, setCompactMode] = useState(() => {
    const saved = localStorage.getItem('compactMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('primaryColor', primaryColor);
    document.documentElement.style.setProperty('--primary-color', primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
    document.documentElement.style.setProperty('--font-size-scale', 
      fontSize === 'small' ? '0.9' : fontSize === 'large' ? '1.1' : '1');
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('compactMode', JSON.stringify(compactMode));
    if (compactMode) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }
  }, [compactMode]);

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