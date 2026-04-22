import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

const NotificationContext = createContext({
  showNotification: (_message, _type) => {}
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({ message: '', type: '' });
  const timerRef = useRef(null);

  const showNotification = useCallback((_message, _type = 'info', duration = 3000) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setNotification({ message: _message, type: _type });

    timerRef.current = setTimeout(() => {
      setNotification({ message: '', type: '' });
      timerRef.current = null;
    }, duration);
  }, []);

  const color = notification.type === 'success'
    ? '#48c774'
    : notification.type === 'error'
      ? '#f14668'
      : notification.type === 'warning'
        ? '#d4a017'
        : '#40667f';

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification.message && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: color,
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
          minWidth: '280px',
          textAlign: 'center',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          {notification.message}
        </div>
      )}
    </NotificationContext.Provider>
  );
};
