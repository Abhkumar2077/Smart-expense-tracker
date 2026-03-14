// frontend/src/context/UploadContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const UploadContext = createContext();

export const useUpload = () => useContext(UploadContext);

export const UploadProvider = ({ children }) => {
  const [uploadedData, setUploadedData] = useState(() => {
    const saved = localStorage.getItem('uploadedData');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [uploadHistory, setUploadHistory] = useState(() => {
    const saved = localStorage.getItem('uploadHistory');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (uploadedData) {
      localStorage.setItem('uploadedData', JSON.stringify(uploadedData));
    } else {
      localStorage.removeItem('uploadedData');
    }
  }, [uploadedData]);

  useEffect(() => {
    localStorage.setItem('uploadHistory', JSON.stringify(uploadHistory));
  }, [uploadHistory]);

  const addUpload = (data) => {
    // Clear previous data first
    setUploadedData(null);
    localStorage.removeItem('uploadedData');
    
    // Add to history
    const historyEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      filename: data.fileName || 'Upload',
      count: data.valid_records || 0,
      income: data.summary?.total_income || 0,
      expense: data.summary?.total_expense || 0,
      timestamp: new Date().toISOString()
    };
    
    // Set new data after a tiny delay
    setTimeout(() => {
      setUploadedData(data);
      setUploadHistory(prev => [historyEntry, ...prev].slice(0, 10));
      
      // Force page refresh to update all components
      window.dispatchEvent(new Event('upload-data-changed'));
    }, 100);
  };

  const removeUpload = (id) => {
    setUploadHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearUpload = () => {
    setUploadedData(null);
    localStorage.removeItem('uploadedData');
    // Dispatch event to notify all components
    window.dispatchEvent(new Event('upload-data-cleared'));
  };

  const clearHistory = () => {
    setUploadHistory([]);
    localStorage.removeItem('uploadHistory');
  };

  return (
    <UploadContext.Provider value={{
      uploadedData,
      uploadHistory,
      addUpload,
      removeUpload,
      clearUpload,
      clearHistory
    }}>
      {children}
    </UploadContext.Provider>
  );
};