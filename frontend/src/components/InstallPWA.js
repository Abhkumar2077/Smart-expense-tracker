import React, { useState, useEffect } from 'react';
import { FaDownload, FaTimes, FaMobile } from 'react-icons/fa';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ User installed the app');
    }
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  if (!showInstall) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      right: '20px',
      maxWidth: '400px',
      margin: '0 auto',
      background: 'white',
      borderRadius: '10px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      padding: '20px',
      zIndex: 1000,
      animation: 'slideUp 0.3s ease',
      border: '2px solid #667eea'
    }}>
      <button 
        onClick={() => setShowInstall(false)}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'none',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          color: '#999'
        }}
      >
        <FaTimes />
      </button>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '15px',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          color: 'white'
        }}>
          💰
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 5px' }}>Install Smart Expense</h3>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            Add to home screen for easy access
          </p>
        </div>
        <button
          onClick={handleInstall}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <FaDownload /> Install
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default InstallPWA;