import React, { useState } from 'react';
import axios from 'axios';
import { FaDollarSign, FaCheck } from 'react-icons/fa';

const currencies = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' }
];

const CurrencySelector = ({ currentCurrency, onCurrencyChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(currentCurrency || 'INR');

  const handleSelect = async (currencyCode) => {
    try {
      await axios.put('/api/users/currency', { currency: currencyCode });
      setSelected(currencyCode);
      onCurrencyChange?.(currencyCode);
      setIsOpen(false);
      
      // Refresh page to update all amounts
      window.location.reload();
    } catch (error) {
      console.error('Error updating currency:', error);
    }
  };

  const getCurrencySymbol = (code) => {
    return currencies.find(c => c.code === code)?.symbol || '₹';
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '10px 20px',
          background: 'white',
          border: '2px solid #667eea',
          borderRadius: '8px',
          color: '#667eea',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        <FaDollarSign />
        {getCurrencySymbol(selected)} {selected}
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={() => setIsOpen(false)}
          />
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '10px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            width: '250px',
            zIndex: 1000,
            overflow: 'hidden'
          }}>
            {currencies.map(currency => (
              <button
                key={currency.code}
                onClick={() => handleSelect(currency.code)}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: selected === currency.code ? '#667eea10' : 'white',
                  border: 'none',
                  borderBottom: '1px solid #eee',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: selected === currency.code ? '#667eea' : '#2c3e50',
                  fontWeight: selected === currency.code ? 'bold' : 'normal'
                }}
              >
                <span>
                  <span style={{ marginRight: '10px', fontSize: '18px' }}>
                    {currency.symbol}
                  </span>
                  {currency.code} - {currency.name}
                </span>
                {selected === currency.code && (
                  <FaCheck color="#48c774" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CurrencySelector;