// frontend/src/pages/Expenses.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ExpenseForm from '../components/ExpenseForm';
import { expenseAPI, categoryAPI } from '../services/api';
import { useUpload } from '../context/UploadContext';
import { useNotification } from '../context/NotificationContext';
import { resolveExpenseCategoryIcon } from '../utils/categoryIcon';
import { 
  FaEdit, FaTrash, FaDownload, FaCloudUploadAlt, 
  FaSync, FaArrowDown, FaArrowUp, FaFilter,
  FaFileCsv, FaMoneyBillWave, FaExclamationTriangle, FaTimes
} from 'react-icons/fa';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingExpense, setEditingExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
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

  const handleEdit = (expense) => {
    if (expense) {
      setEditingExpense(expense);
    }
  };

  const handleFormSubmit = async (formData) => {
    if (!formData) return;
    
    try {
      if (editingExpense) {
        const res = await expenseAPI.update(editingExpense.id, formData);
        setExpenses(prev => prev.map(exp => exp.id === editingExpense.id ? res.data : exp));
        setEditingExpense(null);
        showNotification('Transaction updated!', 'success');
      } else {
        const res = await expenseAPI.create(formData);
        setExpenses(prev => [res.data, ...prev]);
        showNotification('Transaction added!', 'success');
      }
    } catch (error) {
      console.error('Error saving:', error);
      showNotification('❌ Error saving transaction', 'error');
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

  const handleSyncUploadedData = async () => {
    if (!uploadedData) {
      showNotification('No uploaded data to sync', 'info');
      return;
    }

    setSyncing(true);
    try {
      refetchData();
      showNotification('Data refreshed!', 'success');
    } catch (error) {
      console.error('Sync error:', error);
      showNotification('Failed to refresh data', 'error');
    } finally {
      setSyncing(false);
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

  const filteredExpenses = getFilteredExpenses();

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
          <style>{`
            .expenses-header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%);
              pointer-events: none;
            }
          `}</style>
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

            {uploadedData && (
              <button 
                onClick={handleSyncUploadedData}
                className="btn"
                disabled={syncing}
                style={{
                  background: 'rgba(173, 216, 230, 0.8)',
                  backdropFilter: 'blur(5px)',
                  color: '#001435',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  cursor: syncing ? 'not-allowed' : 'pointer',
                  opacity: syncing ? 0.7 : 1,
                  fontWeight: '500'
                }}
              >
                <FaSync className={syncing ? 'fa-spin' : ''} />
                {syncing ? 'Refreshing...' : 'Refresh Data'}
              </button>
            )}
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

        {/* Summary Cards - Enhanced Design */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '48px'
        }}>
          {/* Total Income Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 48, 135, 0.1) 0%, rgba(0, 163, 224, 0.1) 100%)',
            backdropFilter: 'blur(10px)',
            padding: '32px',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 48, 135, 0.15)',
            border: '1px solid rgba(0, 48, 135, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #003087, #00A3E0)',
              opacity: 0.1
            }}></div>
            <div style={{
              position: 'absolute',
              top: '30px',
              right: '30px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #003087, #00A3E0)',
              opacity: 0.2
            }}></div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #003087, #00A3E0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0, 48, 135, 0.3)'
                }}>
                  <FaArrowDown style={{ color: 'white', fontSize: '20px' }} />
                </div>
                <div>
                  <h4 style={{
                    color: '#003087',
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0 0 4px 0'
                  }}>
                    Total Income
                  </h4>
                  <p style={{
                    color: 'rgba(0, 48, 135, 0.7)',
                    fontSize: '12px',
                    margin: '0',
                    fontWeight: '500'
                  }}>
                    {stats.incomeCount} transactions
                  </p>
                </div>
              </div>

              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#003087',
                marginBottom: '8px'
              }}>
                ₹{stats.totalIncome.toFixed(2)}
              </div>

              <div style={{
                width: '100%',
                height: '4px',
                background: 'rgba(0, 48, 135, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${stats.totalIncome > 0 ? Math.min((stats.totalIncome / (stats.totalIncome + stats.totalExpenses)) * 100, 100) : 0}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #003087, #00A3E0)',
                  borderRadius: '2px',
                  transition: 'width 0.5s ease'
                }}></div>
              </div>
            </div>
          </div>

          {/* Total Expenses Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 163, 224, 0.1) 0%, rgba(0, 48, 135, 0.1) 100%)',
            backdropFilter: 'blur(10px)',
            padding: '32px',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 163, 224, 0.15)',
            border: '1px solid rgba(0, 163, 224, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00A3E0, #003087)',
              opacity: 0.1
            }}></div>
            <div style={{
              position: 'absolute',
              top: '30px',
              right: '30px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00A3E0, #003087)',
              opacity: 0.2
            }}></div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #00A3E0, #003087)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0, 163, 224, 0.3)'
                }}>
                  <FaArrowUp style={{ color: 'white', fontSize: '20px' }} />
                </div>
                <div>
                  <h4 style={{
                    color: '#00A3E0',
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0 0 4px 0'
                  }}>
                    Total Expenses
                  </h4>
                  <p style={{
                    color: 'rgba(0, 163, 224, 0.7)',
                    fontSize: '12px',
                    margin: '0',
                    fontWeight: '500'
                  }}>
                    {stats.expenseCount} transactions
                  </p>
                </div>
              </div>

              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#00A3E0',
                marginBottom: '8px'
              }}>
                ₹{stats.totalExpenses.toFixed(2)}
              </div>

              <div style={{
                width: '100%',
                height: '4px',
                background: 'rgba(0, 163, 224, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${stats.totalExpenses > 0 ? Math.min((stats.totalExpenses / (stats.totalIncome + stats.totalExpenses)) * 100, 100) : 0}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #00A3E0, #003087)',
                  borderRadius: '2px',
                  transition: 'width 0.5s ease'
                }}></div>
              </div>
            </div>
          </div>

          {/* Net Balance Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(173, 216, 230, 0.1) 100%)',
            backdropFilter: 'blur(10px)',
            padding: '32px',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '2px solid rgba(0, 163, 224, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            gridColumn: '1 / -1'
          }}>
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: stats.netBalance >= 0
                ? 'linear-gradient(135deg, #003087, #00A3E0)'
                : 'linear-gradient(135deg, #00A3E0, #003087)',
              opacity: 0.1
            }}></div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: stats.netBalance >= 0
                    ? 'linear-gradient(135deg, #003087, #00A3E0)'
                    : 'linear-gradient(135deg, #00A3E0, #003087)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: stats.netBalance >= 0
                    ? '0 4px 12px rgba(0, 48, 135, 0.3)'
                    : '0 4px 12px rgba(0, 163, 224, 0.3)'
                }}>
                  <FaMoneyBillWave style={{ color: 'white', fontSize: '20px' }} />
                </div>
                <div>
                  <h4 style={{
                    color: '#001435',
                    fontSize: '18px',
                    fontWeight: '700',
                    margin: '0 0 4px 0'
                  }}>
                    Net Balance
                  </h4>
                  <p style={{
                    color: 'rgba(0, 20, 53, 0.7)',
                    fontSize: '12px',
                    margin: '0',
                    fontWeight: '500'
                  }}>
                    {stats.netBalance >= 0 ? 'Positive balance' : 'Negative balance'}
                  </p>
                </div>
              </div>

              <div style={{
                fontSize: '36px',
                fontWeight: '800',
                color: stats.netBalance >= 0 ? '#003087' : '#00A3E0',
                marginBottom: '12px'
              }}>
                {stats.netBalance >= 0 ? '+' : ''}₹{Math.abs(stats.netBalance).toFixed(2)}
              </div>

              <div style={{
                width: '100%',
                height: '6px',
                background: 'rgba(0, 20, 53, 0.1)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(Math.abs(stats.netBalance) / Math.max(stats.totalIncome, stats.totalExpenses, 1) * 100, 100)}%`,
                  height: '100%',
                  background: stats.netBalance >= 0
                    ? 'linear-gradient(90deg, #003087, #00A3E0)'
                    : 'linear-gradient(90deg, #00A3E0, #003087)',
                  borderRadius: '3px',
                  transition: 'width 0.5s ease'
                }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* CSV Banner - Show if there's uploaded data */}
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
            <style>{`
              .csv-banner::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%);
                pointer-events: none;
              }
            `}</style>
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

        {/* Expense Form */}
        <div style={{ marginBottom: '48px' }}>
          <ExpenseForm
            onSubmit={handleFormSubmit}
            categories={categories}
            editingExpense={editingExpense}
            onCancel={() => setEditingExpense(null)}
            embedded={true}
          />
        </div>

        {/* Filters Section - Modern Design */}
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
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid rgba(0, 163, 224, 0.2)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#001435',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#00A3E0'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(0, 163, 224, 0.2)'}
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
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid rgba(0, 163, 224, 0.2)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#001435',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#00A3E0'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(0, 163, 224, 0.2)'}
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
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid rgba(0, 163, 224, 0.2)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#001435',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#00A3E0'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(0, 163, 224, 0.2)'}
              />
            </div>

            {/* Apply Filters Button */}
            <div>
              <button
                onClick={handleFilter}
                style={{
                  width: '100%',
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
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 48, 135, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
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
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(0, 163, 224, 0.1)';
                  e.target.style.borderColor = '#00A3E0';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                  e.target.style.borderColor = 'rgba(0, 163, 224, 0.3)';
                }}
              >
                <FaTimes size={14} />
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Transactions List - Modern Card Design */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '48px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              color: '#001435',
              fontWeight: '700',
              fontSize: '24px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '8px',
                height: '24px',
                background: 'linear-gradient(135deg, #003087, #00A3E0)',
                borderRadius: '4px'
              }}></div>
              All Transactions
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: 'rgba(0, 20, 53, 0.7)',
                background: 'rgba(0, 163, 224, 0.1)',
                padding: '4px 12px',
                borderRadius: '12px',
                border: '1px solid rgba(0, 163, 224, 0.2)'
              }}>
                {filteredExpenses.length} of {expenses.length}
              </span>
            </h3>
            <p style={{ color: 'rgba(0, 20, 53, 0.6)', fontSize: '14px' }}>
              Manage your income and expenses with detailed transaction tracking
            </p>
          </div>

          {filteredExpenses.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 40px',
              background: 'linear-gradient(135deg, rgba(173, 216, 230, 0.1) 0%, rgba(173, 216, 230, 0.05) 100%)',
              borderRadius: '16px',
              border: '2px dashed rgba(0, 163, 224, 0.3)'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #003087, #00A3E0)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 8px 24px rgba(0, 48, 135, 0.3)'
              }}>
                <FaFileCsv size={32} style={{ color: 'white' }} />
              </div>
              <h3 style={{ color: '#001435', marginBottom: '8px', fontSize: '20px' }}>No transactions yet</h3>
              <p style={{ color: 'rgba(0, 20, 53, 0.6)', marginBottom: '24px' }}>
                Start tracking your finances by adding your first transaction or importing a CSV file
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  to="/upload"
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #003087, #00A3E0)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '12px',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(0, 48, 135, 0.3)',
                    border: 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <FaCloudUploadAlt /> Import CSV
                </Link>
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#001435',
                    border: '2px solid rgba(0, 163, 224, 0.3)',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <FaMoneyBillWave /> Add Transaction
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
              gap: '20px'
            }}>
              {filteredExpenses.map(expense => (
                <div key={expense.id} style={{
                  background: expense.type === 'income'
                    ? 'linear-gradient(135deg, rgba(0, 48, 135, 0.05) 0%, rgba(0, 163, 224, 0.05) 100%)'
                    : 'linear-gradient(135deg, rgba(0, 163, 224, 0.05) 0%, rgba(0, 48, 135, 0.05) 100%)',
                  border: expense.type === 'income'
                    ? '1px solid rgba(0, 48, 135, 0.2)'
                    : '1px solid rgba(0, 163, 224, 0.2)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Type indicator */}
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: expense.type === 'income' ? '#003087' : '#00A3E0',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                  }}></div>

                  {/* Header */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <span style={{
                        fontSize: '12px',
                        color: 'rgba(0, 20, 53, 0.6)',
                        fontWeight: '500',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {formatDisplayDate(expense.date)}
                      </span>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: expense.type === 'income'
                          ? 'rgba(0, 48, 135, 0.1)'
                          : 'rgba(0, 163, 224, 0.1)',
                        color: expense.type === 'income' ? '#003087' : '#00A3E0',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {expense.type === 'income' ? <FaArrowDown size={10} /> : <FaArrowUp size={10} />}
                        {expense.type === 'income' ? 'Income' : 'Expense'}
                      </div>
                    </div>
                  </div>

                  {/* Category */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(255, 255, 255, 0.8)',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#001435',
                      border: '1px solid rgba(0, 20, 53, 0.1)'
                    }}>
                      <span style={{ fontSize: '14px' }}>{resolveExpenseCategoryIcon(expense)}</span>
                      {expense.category_name || 'Other'}
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{
                      color: '#001435',
                      fontSize: '15px',
                      fontWeight: '500',
                      margin: '0',
                      lineHeight: '1.4'
                    }}>
                      {expense.description || 'No description'}
                    </p>
                  </div>

                  {/* Amount and Actions */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: expense.type === 'income' ? '#003087' : '#00A3E0'
                    }}>
                      {expense.type === 'income' ? '+' : '-'}₹{parseFloat(expense.amount).toFixed(2)}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(expense)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'rgba(255, 255, 255, 0.9)',
                          color: '#003087',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}
                        title="Edit transaction"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'rgba(255, 255, 255, 0.9)',
                          color: '#f14668',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}
                        title="Delete transaction"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  );
};

export default Expenses;