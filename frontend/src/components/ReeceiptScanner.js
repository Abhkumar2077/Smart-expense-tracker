import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { FaCamera, FaSpinner, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const ReceiptScanner = ({ onScanComplete }) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setScanning(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const res = await axios.post('/api/ocr/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResult(res.data);
      onScanComplete?.(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to scan receipt');
    } finally {
      setScanning(false);
    }
  }, [onScanComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <FaCamera style={{ marginRight: '10px', color: '#667eea' }} />
          Receipt Scanner
        </h3>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Dropzone */}
        <div
          {...getRootProps()}
          style={{
            border: `2px dashed ${isDragActive ? '#667eea' : error ? '#f14668' : '#ddd'}`,
            borderRadius: '10px',
            padding: '40px',
            textAlign: 'center',
            cursor: 'pointer',
            background: isDragActive ? '#667eea10' : error ? '#f1466810' : '#f8f9fa',
            transition: 'all 0.3s',
            marginBottom: '20px'
          }}
        >
          <input {...getInputProps()} />
          
          {scanning ? (
            <>
              <FaSpinner size={40} style={{ color: '#667eea', animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '20px', color: '#666' }}>Scanning receipt...</p>
            </>
          ) : (
            <>
              <FaCamera size={40} color={isDragActive ? '#667eea' : '#999'} />
              <h4 style={{ margin: '20px 0 10px' }}>
                {isDragActive ? 'Drop receipt here' : 'Drag & drop receipt photo'}
              </h4>
              <p style={{ color: '#666' }}>
                or <span style={{ color: '#667eea', fontWeight: 'bold' }}>browse</span> to select
              </p>
              <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                Supports JPG, PNG, GIF (Max 5MB)
              </p>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '15px',
            background: '#f1466810',
            border: '1px solid #f14668',
            borderRadius: '8px',
            color: '#f14668',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px'
          }}>
            <FaExclamationCircle />
            <span>{error}</span>
          </div>
        )}

        {/* Scan Result */}
        {result && result.success && (
          <div style={{
            padding: '20px',
            background: '#48c77410',
            border: '1px solid #48c774',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <FaCheckCircle color="#48c774" size={20} />
              <h4 style={{ margin: 0, color: '#48c774' }}>Receipt Scanned Successfully!</h4>
            </div>
            
            <div style={{ display: 'grid', gap: '10px' }}>
              <div>
                <strong>Merchant:</strong> {result.merchant}
              </div>
              {result.amount && (
                <div>
                  <strong>Total Amount:</strong> ₹{result.amount.toFixed(2)}
                </div>
              )}
              {result.date && (
                <div>
                  <strong>Date:</strong> {result.date}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => {
                  // Auto-fill expense form
                  window.location.href = `/expenses?amount=${result.amount}&merchant=${encodeURIComponent(result.merchant)}&date=${result.date}`;
                }}
                className="btn btn-primary"
              >
                Create Expense
              </button>
              <button
                onClick={() => setResult(null)}
                className="btn"
              >
                Scan Another
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ReceiptScanner;