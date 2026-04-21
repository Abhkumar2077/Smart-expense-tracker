// frontend/src/pages/Expenses.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ExpenseForm from '../components/ExpenseForm';
import { expenseAPI, categoryAPI } from '../services/api';
import { useUpload } from '../context/UploadContext';
import { useNotification } from '../context/NotificationContext';
import { 
  FaEdit, FaTrash, FaDownload, FaCloudUploadAlt, 
  FaSync, FaArrowDown, FaArrowUp, FaFilter,
  FaFileCsv, FaMoneyBillWave, FaExclamationTriangle
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

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Listen for upload data changes
  useEffect(() => {
    const handleUploadChange = () => {
      console.log('🔄 Upload data changed, refreshing expenses...');
      fetchData();
    };
    
    const handleStorageChange = (e) => {
      if (e.key === 'uploadedData' || e.key === 'uploadHistory') {
        console.log('🔄 Storage changed, refreshing expenses...');
        fetchData();
      }
    };
    
    // Add event listeners
    window.addEventListener('upload-data-changed', handleUploadChange);
    window.addEventListener('upload-data-cleared', handleUploadChange);
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('upload-data-changed', handleUploadChange);
      window.removeEventListener('upload-data-cleared', handleUploadChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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

  // Re-fetch when uploadedData changes (context update)
  useEffect(() => {
    console.log('📦 uploadedData changed in context:', uploadedData);
    fetchData();
  }, [uploadedData]);

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

  const fetchData = async () => {
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
      }
      setCategories(categoriesData);
      
      // Fetch expenses
      let expensesData = [];
      try {
        const expensesRes = await expenseAPI.getAll();
        expensesData = expensesRes.data || [];
        console.log('✅ Expenses loaded:', expensesData.length);
      } catch (expErr) {
        console.error('Error fetching expenses:', expErr);
        setError('Failed to load expenses. Please try again.');
      }
      
      setExpenses(expensesData);
      
    } catch (err) {
      console.error('❌ Error in fetchData:', err);
      setError('An unexpected error occurred. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

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
        fetchData();
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
      await fetchData();
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
    fetchData();
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
              onClick={fetchData}
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

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '48px',
          background: 'linear-gradient(135deg, #001435 0%, #003087 50%, #00A3E0 100%)',
          padding: '32px',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0, 3, 135, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <style>{`
            .summary-cards::before {
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
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Total Income</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#003087', margin: '8px 0' }}>
              ₹{stats.totalIncome.toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              {stats.incomeCount} transactions
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Total Expenses</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00A3E0', margin: '8px 0' }}>
              ₹{stats.totalExpenses.toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              {stats.expenseCount} transactions
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Net Balance</div>
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: stats.netBalance >= 0 ? '#003087' : '#00A3E0',
              margin: '8px 0'
            }}>
              ₹{Math.abs(stats.netBalance).toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              {stats.netBalance >= 0 ? 'Surplus' : 'Deficit'}
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

        {/* Filters */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '48px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#001435', fontWeight: '600' }}>
                <FaFilter /> Filters
              </h3>
              
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  onClick={() => setFilterType('all')}
                  style={{
                    padding: '8px 16px',
                    background: filterType === 'all' ? 'rgba(0, 20, 53, 0.8)' : 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(5px)',
                    color: filterType === 'all' ? 'white' : '#666',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('income')}
                  style={{
                    padding: '8px 16px',
                    background: filterType === 'income' ? 'rgba(0, 20, 53, 0.8)' : 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(5px)',
                    color: filterType === 'income' ? 'white' : '#666',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: '500'
                  }}
                >
                  <FaArrowDown /> Income
                </button>
                <button
                  onClick={() => setFilterType('expense')}
                  style={{
                    padding: '8px 16px',
                    background: filterType === 'expense' ? 'rgba(0, 20, 53, 0.8)' : 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(5px)',
                    color: filterType === 'expense' ? 'white' : '#666',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: '500'
                  }}
                >
                  <FaArrowUp /> Expense
                </button>
              </div>

              {(filters.startDate || filters.endDate || filterType !== 'all') && (
                <button
                  onClick={clearFilters}
                  style={{
                    padding: '6px 14px',
                    background: 'rgba(0, 20, 53, 0.8)',
                    backdropFilter: 'blur(5px)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '15px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#001435', fontWeight: '500' }}>Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid rgba(255, 255, 255, 0.3)', 
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(5px)',
                  color: '#001435',
                  fontWeight: '500'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#001435', fontWeight: '500' }}>End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid rgba(255, 255, 255, 0.3)', 
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(5px)',
                  color: '#001435',
                  fontWeight: '500'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                onClick={handleFilter} 
                style={{
                  padding: '10px 20px',
                  background: 'rgba(0, 20, 53, 0.8)',
                  backdropFilter: 'blur(5px)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div style={{
          background: 'rgba(173, 216, 230, 0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '48px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#001435', fontWeight: '600' }}>
              All Transactions
              <span style={{ 
                marginLeft: '10px',
                fontSize: '14px', 
                fontWeight: 'normal',
                color: 'rgba(0, 20, 53, 0.8)'
              }}>
                ({filteredExpenses.length} of {expenses.length})
              </span>
            </h3>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            {filteredExpenses.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                color: '#001435'
              }}>
                <FaFileCsv size={50} style={{ color: 'rgba(0, 20, 53, 0.6)', marginBottom: '20px' }} />
                <h3 style={{ color: '#001435' }}>No transactions found</h3>
                <p>Add your first transaction or import a CSV file!</p>
                <Link 
                  to="/upload" 
                  className="btn btn-primary" 
                  style={{ 
                    marginTop: '20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(5px)',
                    color: '#001435',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 20, 53, 0.2)',
                    fontWeight: '500'
                  }}
                >
                  <FaCloudUploadAlt /> Import CSV
                </Link>
              </div>
            ) : (
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      background: 'rgba(255, 255, 255, 0.5)', 
                      borderBottom: '2px solid rgba(0, 20, 53, 0.3)',
                      color: '#001435',
                      fontWeight: '600'
                    }}>Date</th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      background: 'rgba(255, 255, 255, 0.5)', 
                      borderBottom: '2px solid rgba(0, 20, 53, 0.3)',
                      color: '#001435',
                      fontWeight: '600'
                    }}>Category</th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      background: 'rgba(255, 255, 255, 0.5)', 
                      borderBottom: '2px solid rgba(0, 20, 53, 0.3)',
                      color: '#001435',
                      fontWeight: '600'
                    }}>Description</th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      background: 'rgba(255, 255, 255, 0.5)', 
                      borderBottom: '2px solid rgba(0, 20, 53, 0.3)',
                      color: '#001435',
                      fontWeight: '600'
                    }}>Type</th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      background: 'rgba(255, 255, 255, 0.5)', 
                      borderBottom: '2px solid rgba(0, 20, 53, 0.3)',
                      color: '#001435',
                      fontWeight: '600'
                    }}>Amount</th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      background: 'rgba(255, 255, 255, 0.5)', 
                      borderBottom: '2px solid rgba(0, 20, 53, 0.3)',
                      color: '#001435',
                      fontWeight: '600'
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(expense => (
                    <tr key={expense.id} style={{ borderBottom: '1px solid rgba(0, 20, 53, 0.1)' }}>
                      <td style={{ padding: '16px 12px', color: '#001435', fontWeight: '500' }}>{formatDisplayDate(expense.date)}</td>
                      <td style={{ padding: '16px 12px' }}>
                        <span style={{
                          backgroundColor: 'rgba(0, 20, 53, 0.1)',
                          color: '#001435',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: '500',
                          border: '1px solid rgba(0, 20, 53, 0.2)'
                        }}>
                          <span>{expense.icon || '\uD83D\uDCCC'}</span>  {expense.category_name || 'Other'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 12px', color: '#001435', fontWeight: '500' }}>{expense.description || '-'}</td>
                      <td style={{ padding: '12px' }}>
                        {expense.type === 'income' ? (
                          <span style={{
                            color: '#003087',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 'bold'
                          }}>
                            <FaArrowDown /> Income
                          </span>
                        ) : (
                          <span style={{
                            color: '#00A3E0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 'bold'
                          }}>
                            <FaArrowUp /> Expense
                          </span>
                        )}
                      </td>
                      <td style={{
                        padding: '16px 12px',
                        fontWeight: 'bold',
                        color: '#001435'
                      }}>
                        {expense.type === 'income' ? '+' : '-'} ₹{parseFloat(expense.amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleEdit(expense)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.8)',
                              color: '#001435',
                              border: '1px solid rgba(0, 20, 53, 0.2)',
                              padding: '8px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '36px',
                              height: '36px',
                              fontSize: '14px'
                            }}
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.8)',
                              color: '#001435',
                              border: '1px solid rgba(0, 20, 53, 0.2)',
                              padding: '8px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '36px',
                              height: '36px',
                              fontSize: '14px'
                            }}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
    </div>
  );
};

export default Expenses;