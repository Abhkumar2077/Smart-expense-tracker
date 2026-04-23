// frontend/src/pages/Expenses.js
import React, { useState, useEffect, useCallback } from 'react';
import { expenseAPI, categoryAPI } from '../services/api';
import { useUpload } from '../context/UploadContext';
import { useNotification } from '../context/NotificationContext';
import { 
   FaTrash, FaDownload, FaCloudUploadAlt, 
   FaSync, FaArrowDown, FaArrowUp, FaFilter,
   FaMoneyBillWave, FaExclamationTriangle, FaTimes,
   FaChevronDown, FaChevronUp
} from 'react-icons/fa';

const Expenses = () => {
   const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    incomeCount: 0,
    expenseCount: 0
  });

  // New transaction form state
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    type: 'expense',
    description: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [addingTransaction, setAddingTransaction] = useState(false);
  
  // Pagination state for transactions
  const [itemsToShow, setItemsToShow] = useState(10);
  const INITIAL_ITEMS = 10;
   
  const { uploadedData } = useUpload();
  const { showNotification } = useNotification();

  // Combined useEffect for data fetching and event listeners
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted) return;

      try {
        setLoading(true);
        setError(null);

        console.log('📊 Fetching expenses data...');

        // Fetch categories first
        let categoriesData = [];
        try {
          const categoriesRes = await categoryAPI.getAll();
          categoriesData = categoriesRes.data || [];
          console.log('✅ Categories loaded:', categoriesData.length);
        } catch (catErr) {
          console.error('Error fetching categories:', catErr);
          // Don't set error for categories, just log it
        }

        if (!isMounted) return;
        setCategories(categoriesData);

        // Fetch expenses
        let expensesData = [];
        try {
          const expensesRes = await expenseAPI.getAll();
          expensesData = expensesRes.data || [];
          console.log('✅ Expenses loaded:', expensesData.length, 'records');
          if (expensesData.length > 0) {
            console.log('📊 Sample expense:', expensesData[0]);
          }
        } catch (expErr) {
          console.error('Error fetching expenses:', expErr);
          setError('Failed to load expenses. Please try again.');
          return;
        }

        if (!isMounted) return;
        setExpenses(expensesData);

      } catch (err) {
        console.error('❌ Error in fetchData:', err);
        if (isMounted) {
          setError('An unexpected error occurred. Please refresh the page.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Initial data fetch
    fetchData();

    // Event handlers
    const handleUploadChange = () => {
      console.log('🔄 Upload data changed, refreshing expenses...');
      if (isMounted) fetchData();
    };

    const handleStorageChange = (e) => {
      if (e.key === 'uploadedData' || e.key === 'uploadHistory') {
        console.log('🔄 Storage changed, refreshing expenses...');
        if (isMounted) fetchData();
      }
    };

    // Add event listeners
    window.addEventListener('upload-data-changed', handleUploadChange);
    window.addEventListener('upload-data-cleared', handleUploadChange);
    window.addEventListener('storage', handleStorageChange);

    // Cleanup function
    return () => {
      isMounted = false;
      window.removeEventListener('upload-data-changed', handleUploadChange);
      window.removeEventListener('upload-data-cleared', handleUploadChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Empty dependency array - only run on mount

  // Refetch function for manual refresh
  const refetchData = useCallback(() => {
    window.dispatchEvent(new CustomEvent('upload-data-changed'));
  }, []);

  // Separate useEffect for uploadedData changes (avoiding the fetchData redefinition)
  useEffect(() => {
    if (uploadedData) {
      console.log('📦 uploadedData changed in context, refreshing...');
      // Trigger a refresh by dispatching custom event
      window.dispatchEvent(new CustomEvent('upload-data-changed'));
    }
  }, [uploadedData]);

  const calculateStats = useCallback(() => {
    try {
      const income = expenses
        .filter(e => e && e.type === 'income')
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

      const expense = expenses
        .filter(e => e && (e.type === 'expense' || !e.type))
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

      const incomeCount = expenses.filter(e => e && e.type === 'income').length;
      const expenseCount = expenses.filter(e => e && (e.type === 'expense' || !e.type)).length;

      setStats({
        totalIncome: income,
        totalExpenses: expense,
        netBalance: income - expense,
        incomeCount,
        expenseCount
      });
    } catch (err) {
      console.error('Error calculating stats:', err);
    }
  }, [expenses]);

  // Calculate stats whenever expenses change
  useEffect(() => {
    if (expenses.length > 0) {
      calculateStats();
    } else {
      // Reset stats when no expenses
      setStats({
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        incomeCount: 0,
        expenseCount: 0
      });
    }
  }, [expenses, calculateStats]);

  const handleDelete = async (id) => {
    if (!id) return;

    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await expenseAPI.delete(id);
        // Optimistically update UI
        setExpenses(prev => prev.filter(exp => exp.id !== id));
        showNotification('Transaction deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting:', error);
        showNotification('Error deleting transaction', 'error');
        // Refresh to ensure consistency
        refetchData();
      }
    }
  };

  const handleFilter = async () => {
    try {
      setLoading(true);
      const res = await expenseAPI.getAll(filters);
      setExpenses(res.data || []);
    } catch (error) {
      console.error('Error filtering:', error);
      showNotification('Failed to apply filters', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await expenseAPI.exportCSV(filters.startDate, filters.endDate);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showNotification('CSV exported!', 'success');
    } catch (error) {
      console.error('Error exporting:', error);
      showNotification('❌ Error exporting CSV', 'error');
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();

    if (!newTransaction.amount || !newTransaction.description || !newTransaction.category_id) {
      showNotification('Please fill amount, description, and category', 'error');
      return;
    }

    try {
      setAddingTransaction(true);
      const payload = {
        amount: parseFloat(newTransaction.amount),
        type: newTransaction.type,
        description: newTransaction.description,
        category_id: parseInt(newTransaction.category_id),
        date: newTransaction.date
      };

      await expenseAPI.create(payload);

      // Reset form
      setNewTransaction({
        amount: '',
        type: 'expense',
        description: '',
        category_id: '',
        date: new Date().toISOString().split('T')[0]
      });

      // Refresh data
      refetchData();
      showNotification('Transaction added successfully!', 'success');
    } catch (error) {
      console.error('Error adding transaction:', error);
      showNotification('Failed to add transaction', 'error');
    } finally {
      setAddingTransaction(false);
    }
  };

  const getFilteredExpenses = () => {
    if (!expenses || expenses.length === 0) return [];
    if (filterType === 'all') return expenses;
    return expenses.filter(e => e && e.type === filterType);
  };

  const formatDisplayDate = (dateValue) => {
    if (!dateValue) return '-';

    const parsedDate = new Date(dateValue);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }

    if (typeof dateValue === 'string') {
      return dateValue.split(' ')[0];
    }

    return String(dateValue);
  };

  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '' });
    setFilterType('all');
    refetchData();
  };

  const handleShowMore = () => {
    setItemsToShow(prev => prev + 10);
  };

  const handleShowLess = () => {
    setItemsToShow(INITIAL_ITEMS);
  };

  const filteredExpenses = getFilteredExpenses();

  // Add CSS animation for loading spinner
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div>
          <div className="loading-spinner" style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#666' }}>Loading transactions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '50px',
        background: 'rgba(173, 216, 230, 0.1)',
        borderRadius: '10px',
        border: '1px solid #00A3E0',
        marginTop: '50px'
      }}>
        <div>
          <FaExclamationTriangle size={50} color="#00A3E0" />
          <h3 style={{ margin: '20px 0', color: '#00A3E0' }}>Oops! Something went wrong</h3>
          <p style={{ color: '#666' }}>{error}</p>
          <button 
            onClick={refetchData}
            style={{
              marginTop: '20px',
              padding: '10px 30px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #E6F3FF 0%, #B3D9FF 50%, #80BFFF 100%)',
      padding: '32px'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '40px',
        marginTop: '50px',
        flexWrap: 'wrap',
        gap: '15px',
        background: 'linear-gradient(135deg, #001435 0%, #003087 50%, #00A3E0 100%)',
        padding: '24px 32px',
        borderRadius: '16px',
        boxShadow: '0 12px 40px rgba(0, 3, 135, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
            <FaMoneyBillWave style={{ color: '#ADD8E6' }} />
            Transaction Management
            {expenses.length > 0 && (
              <span style={{
                fontSize: '14px',
                background: 'rgba(173, 216, 230, 0.8)',
                color: '#001435',
                padding: '4px 12px',
                borderRadius: '20px',
                marginLeft: '10px',
                backdropFilter: 'blur(5px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                {expenses.length} total
              </span>
            )}
          </h2>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => refetchData()}
            disabled={loading}
            style={{
              background: 'rgba(173, 216, 230, 0.8)',
              backdropFilter: 'blur(5px)',
              color: '#001435',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              fontWeight: '500'
            }}
            title="Refresh data"
          >
            <FaSync className={loading ? 'fa-spin' : ''} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>

          <button 
            onClick={handleExport} 
            className="btn btn-primary"
            disabled={expenses.length === 0}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '10px 20px',
              background: expenses.length === 0 ? 'rgba(255, 255, 255, 0.5)' : 'rgba(173, 216, 230, 0.8)',
              backdropFilter: 'blur(5px)',
              color: expenses.length === 0 ? '#999' : '#001435',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              cursor: expenses.length === 0 ? 'not-allowed' : 'pointer',
              opacity: expenses.length === 0 ? 0.7 : 1,
              fontWeight: '500'
            }}
          >
            <FaDownload /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '48px'
      }}>
        {/* Total Income Card */}
        <div style={{
          background: '#f8fbff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0, 48, 135, 0.1)',
          border: '2px solid rgba(0, 48, 135, 0.15)',
          transition: 'transform 0.2s ease'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#003087',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FaArrowDown style={{ color: 'white', fontSize: '18px' }} />
            </div>
            <div>
              <h4 style={{
                color: '#003087',
                fontSize: '15px',
                fontWeight: '600',
                margin: '0 0 4px 0'
              }}>
                Total Income
              </h4>
              <p style={{
                color: 'rgba(0, 48, 135, 0.6)',
                fontSize: '12px',
                margin: '0',
                fontWeight: '500'
              }}>
                {stats.incomeCount} transactions
              </p>
            </div>
          </div>

          <div style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#003087',
            marginBottom: '12px'
          }}>
            ₹{stats.totalIncome.toFixed(2)}
          </div>

          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(0, 48, 135, 0.1)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${stats.totalIncome > 0 ? Math.min((stats.totalIncome / (stats.totalIncome + stats.totalExpenses)) * 100, 100) : 0}%`,
              height: '100%',
              background: '#003087',
              borderRadius: '3px',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div style={{
          background: '#f8fbff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0, 163, 224, 0.1)',
          border: '2px solid rgba(0, 163, 224, 0.15)',
          transition: 'transform 0.2s ease'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#00A3E0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FaArrowUp style={{ color: 'white', fontSize: '18px' }} />
            </div>
            <div>
              <h4 style={{
                color: '#00A3E0',
                fontSize: '15px',
                fontWeight: '600',
                margin: '0 0 4px 0'
              }}>
                Total Expenses
              </h4>
              <p style={{
                color: 'rgba(0, 163, 224, 0.6)',
                fontSize: '12px',
                margin: '0',
                fontWeight: '500'
              }}>
                {stats.expenseCount} transactions
              </p>
            </div>
          </div>

          <div style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#00A3E0',
            marginBottom: '12px'
          }}>
            ₹{stats.totalExpenses.toFixed(2)}
          </div>

          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(0, 163, 224, 0.1)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${stats.totalExpenses > 0 ? Math.min((stats.totalExpenses / (stats.totalIncome + stats.totalExpenses)) * 100, 100) : 0}%`,
              height: '100%',
              background: '#00A3E0',
              borderRadius: '3px',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>

        {/* Net Balance Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          border: `2px solid ${stats.netBalance >= 0 ? 'rgba(0, 48, 135, 0.2)' : 'rgba(0, 163, 224, 0.2)'}`,
          gridColumn: '1 / -1'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: stats.netBalance >= 0 ? '#003087' : '#00A3E0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FaMoneyBillWave style={{ color: 'white', fontSize: '18px' }} />
            </div>
            <div>
              <h4 style={{
                color: '#001435',
                fontSize: '16px',
                fontWeight: '700',
                margin: '0 0 4px 0'
              }}>
                Net Balance
              </h4>
              <p style={{
                color: 'rgba(0, 20, 53, 0.6)',
                fontSize: '12px',
                margin: '0',
                fontWeight: '500'
              }}>
                {stats.netBalance >= 0 ? 'Positive' : 'Negative'}
              </p>
            </div>
          </div>

          <div style={{
            fontSize: '30px',
            fontWeight: '800',
            color: stats.netBalance >= 0 ? '#003087' : '#00A3E0',
            marginBottom: '12px'
          }}>
            {stats.netBalance >= 0 ? '+' : ''}₹{Math.abs(stats.netBalance).toFixed(2)}
          </div>

          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(0, 20, 53, 0.08)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(Math.abs(stats.netBalance) / Math.max(stats.totalIncome, stats.totalExpenses, 1) * 100, 100)}%`,
              height: '100%',
              background: stats.netBalance >= 0 ? '#003087' : '#00A3E0',
              borderRadius: '3px',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>
      </div>

      {/* Add Transaction Section */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.96)',
        borderRadius: '20px',
        padding: '28px',
        marginBottom: '40px',
        boxShadow: '0 10px 32px rgba(0, 20, 53, 0.1)',
        border: '1px solid rgba(0, 48, 135, 0.12)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '18px'
        }}>
          <div>
            <h3 style={{ margin: 0, color: '#001435' }}>Add New Transaction</h3>
            <p style={{ margin: '6px 0 0', color: '#4f6d8a' }}>
              Quickly add income or expense transactions to your records
            </p>
          </div>
        </div>

        <form onSubmit={handleAddTransaction} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '18px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#001435',
              marginBottom: '8px'
            }}>
              Type
            </label>
            <select
              value={newTransaction.type}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value }))}
              style={{ padding: '11px 12px', borderRadius: '10px', border: '1px solid #bed3e7', width: '100%' }}
              required
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#001435',
              marginBottom: '8px'
            }}>
              Amount
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Enter amount"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
              style={{ padding: '11px 12px', borderRadius: '10px', border: '1px solid #bed3e7', width: '100%' }}
              required
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#001435',
              marginBottom: '8px'
            }}>
              Description
            </label>
            <input
              type="text"
              placeholder="Enter description"
              value={newTransaction.description}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
              style={{ padding: '11px 12px', borderRadius: '10px', border: '1px solid #bed3e7', width: '100%' }}
              required
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#001435',
              marginBottom: '8px'
            }}>
              Category
            </label>
            <select
              value={newTransaction.category_id}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, category_id: e.target.value }))}
              style={{ padding: '11px 12px', borderRadius: '10px', border: '1px solid #bed3e7', width: '100%' }}
              required
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#001435',
              marginBottom: '8px'
            }}>
              Date
            </label>
            <input
              type="date"
              value={newTransaction.date}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
              style={{ padding: '11px 12px', borderRadius: '10px', border: '1px solid #bed3e7', width: '100%' }}
              required
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={addingTransaction}
              style={{
                padding: '11px 24px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #003087 0%, #00A3E0 100%)',
                color: '#fff',
                fontWeight: 700,
                cursor: addingTransaction ? 'not-allowed' : 'pointer',
                opacity: addingTransaction ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FaMoneyBillWave />
              {addingTransaction ? 'Adding...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>

      {/* CSV Banner */}
      {uploadedData && (
        <div style={{
          background: 'linear-gradient(135deg, #001435 0%, #003087 50%, #00A3E0 100%)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '16px',
          padding: '24px 32px',
          marginBottom: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '15px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0, 3, 135, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', position: 'relative', zIndex: 1 }}>
            <FaCloudUploadAlt size={30} color="#ADD8E6" />
            <div>
              <h4 style={{ margin: 0, color: 'white', fontWeight: '600' }}>CSV Data Active</h4>
              <p style={{ margin: '5px 0 0', color: 'rgba(255, 255, 255, 0.8)' }}>
                {uploadedData.valid_records || 0} transactions from {uploadedData.fileName || 'CSV file'}
              </p>
            </div>
          </div>
          <span style={{
            background: 'rgba(173, 216, 230, 0.9)',
            backdropFilter: 'blur(5px)',
            color: '#001435',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 'bold',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            position: 'relative',
            zIndex: 1
          }}>
            ✓ Active
          </span>
        </div>
      )}

      {/* Filters Section */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '32px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            color: '#001435',
            fontWeight: '700',
            fontSize: '20px',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '6px',
              height: '20px',
              background: 'linear-gradient(135deg, #003087, #00A3E0)',
              borderRadius: '3px'
            }}></div>
            Filter Transactions
          </h3>
          <p style={{ color: 'rgba(0, 20, 53, 0.6)', fontSize: '14px' }}>
            Narrow down your transactions by type, category, or date range
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          alignItems: 'end'
        }}>
          {/* Type Filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#001435',
              marginBottom: '8px'
            }}>
              Transaction Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ 
                padding: '12px 16px', 
                borderRadius: '12px', 
                border: '2px solid rgba(0, 163, 224, 0.2)', 
                background: 'rgba(255, 255, 255, 0.9)', 
                color: '#001435', 
                fontSize: '14px', 
                fontWeight: '500', 
                cursor: 'pointer', 
                transition: 'all 0.3s ease', 
                outline: 'none',
                width: '100%'
              }}
            >
              <option value="all">All Types</option>
              <option value="income">Income Only</option>
              <option value="expense">Expenses Only</option>
            </select>
          </div>

          {/* Start Date Filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#001435',
              marginBottom: '8px'
            }}>
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              style={{ 
                padding: '12px 16px', 
                borderRadius: '12px', 
                border: '2px solid rgba(0, 163, 224, 0.2)', 
                background: 'rgba(255, 255, 255, 0.9)', 
                color: '#001435', 
                fontSize: '14px', 
                fontWeight: '500', 
                cursor: 'pointer', 
                transition: 'all 0.3s ease', 
                outline: 'none',
                width: '100%'
              }}
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#001435',
              marginBottom: '8px'
            }}>
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              style={{ 
                padding: '12px 16px', 
                borderRadius: '12px', 
                border: '2px solid rgba(0, 163, 224, 0.2)', 
                background: 'rgba(255, 255, 255, 0.9)', 
                color: '#001435', 
                fontSize: '14px', 
                fontWeight: '500', 
                cursor: 'pointer', 
                transition: 'all 0.3s ease', 
                outline: 'none',
                width: '100%'
              }}
            />
          </div>

          {/* Apply Filters Button */}
          <div>
            <button
              onClick={handleFilter}
              style={{ 
                padding: '12px 16px', 
                borderRadius: '12px', 
                border: '2px solid rgba(0, 163, 224, 0.3)', 
                background: 'linear-gradient(135deg, #003087, #00A3E0)', 
                color: 'white', 
                fontSize: '14px', 
                fontWeight: '600', 
                cursor: 'pointer', 
                transition: 'all 0.3s ease', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                width: '100%'
              }}
              onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 4px 12px rgba(0, 48, 135, 0.3)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
            >
              <FaFilter size={14} />
              Apply Filters
            </button>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(filters.startDate || filters.endDate || filterType !== 'all') && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={clearFilters}
              style={{ 
                padding: '10px 20px', 
                borderRadius: '12px', 
                border: '2px solid rgba(0, 163, 224, 0.3)', 
                background: 'rgba(255, 255, 255, 0.9)', 
                color: '#001435', 
                fontSize: '14px', 
                fontWeight: '600', 
                cursor: 'pointer', 
                transition: 'all 0.3s ease', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px' 
              }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(0, 163, 224, 0.1)'; e.target.style.borderColor = '#00A3E0'; }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(255, 255, 255, 0.9)'; e.target.style.borderColor = 'rgba(0, 163, 224, 0.3)'; }}
            >
              <FaTimes size={14} />
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h3 style={{
          color: '#001435',
          fontWeight: '700',
          fontSize: '20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '6px',
            height: '20px',
            background: 'linear-gradient(135deg, #003087, #00A3E0)',
            borderRadius: '3px'
          }}></div>
          Transaction History
          <span style={{
            fontSize: '14px',
            background: 'rgba(0, 48, 135, 0.1)',
            color: '#003087',
            padding: '4px 12px',
            borderRadius: '20px',
            marginLeft: '10px'
          }}>
            {filteredExpenses.length} transactions
          </span>
        </h3>

        {filteredExpenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <FaMoneyBillWave size={60} style={{ color: 'rgba(0, 48, 135, 0.3)', marginBottom: '20px' }} />
            <h4 style={{ color: '#001435', marginBottom: '10px' }}>No transactions found</h4>
            <p style={{ color: 'rgba(0, 20, 53, 0.6)' }}>
              {expenses.length === 0 ? 'Start by adding your first transaction above!' : 'Try adjusting your filters to see more results.'}
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredExpenses.slice(0, itemsToShow).map(expense => {
                const category = categories.find(c => c.id === expense.category_id);
                const categoryIcon = category?.icon || (expense.type === 'income' ? '💰' : '💸');
                const isIncome = expense.type === 'income';
                
                return (
                  <div
                    key={expense.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      background: 'white',
                      borderRadius: '12px',
                      border: '1px solid rgba(0, 48, 135, 0.1)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 48, 135, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: isIncome ? 'rgba(0, 48, 135, 0.1)' : 'rgba(0, 163, 224, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px'
                      }}>
                        {categoryIcon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#001435', marginBottom: '4px' }}>
                          {expense.description || 'Untitled Transaction'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(0, 20, 53, 0.6)' }}>
                          {category?.name || 'Uncategorized'} • {formatDisplayDate(expense.date)}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: isIncome ? '#003087' : '#00A3E0'
                      }}>
                        {isIncome ? '+' : '-'}₹{Math.abs(parseFloat(expense.amount)).toFixed(2)}
                      </div>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'transparent',
                          color: '#f14668',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(241, 70, 104, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                        title="Delete transaction"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Buttons */}
            {filteredExpenses.length > itemsToShow && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '16px',
                marginTop: '32px'
              }}>
                {itemsToShow > INITIAL_ITEMS && (
                  <button
                    onClick={handleShowLess}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      border: '2px solid rgba(0, 163, 224, 0.3)',
                      background: 'rgba(255, 255, 255, 0.9)',
                      color: '#001435',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(0, 163, 224, 0.1)';
                      e.target.style.borderColor = '#00A3E0';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                      e.target.style.borderColor = 'rgba(0, 163, 224, 0.3)';
                    }}
                  >
                    <FaChevronUp size={14} />
                    Show Less
                  </button>
                )}
                <button
                  onClick={handleShowMore}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: '2px solid rgba(0, 163, 224, 0.3)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#001435',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(0, 163, 224, 0.1)';
                    e.target.style.borderColor = '#00A3E0';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                    e.target.style.borderColor = 'rgba(0, 163, 224, 0.3)';
                  }}
                >
                  <FaChevronDown size={14} />
                  Show More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Expenses;