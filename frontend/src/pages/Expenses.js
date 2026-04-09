// frontend/src/pages/Expenses.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ExpenseForm from '../components/ExpenseForm';
import { expenseAPI, categoryAPI } from '../services/api';
import { useUpload } from '../context/UploadContext';
import { useNotification } from '../context/NotificationContext';
import { 
  FaEdit, FaTrash, FaDownload, FaCloudUploadAlt, 
  FaSync, FaArrowDown, FaArrowUp, FaFilter,
  FaFileCsv, FaMoneyBillWave, FaExclamationTriangle
} from 'react-icons/fa';
import { MdPushPin } from 'react-icons/md';

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
  }, [expenses]);

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

  const calculateStats = () => {
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
      <div className="dashboard">
        <Sidebar />
        <div className="main-content">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '80vh',
            flexDirection: 'column',
            gap: '20px'
          }}>
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
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="dashboard">
        <Sidebar />
        <div className="main-content">
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            background: '#f1466810',
            borderRadius: '10px',
            border: '1px solid #f14668',
            marginTop: '50px'
          }}>
            <FaExclamationTriangle size={50} color="#f14668" />
            <h3 style={{ margin: '20px 0', color: '#f14668' }}>Oops! Something went wrong</h3>
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
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaMoneyBillWave style={{ color: '#667eea' }} />
            Transaction Management
            {expenses.length > 0 && (
              <span style={{
                fontSize: '14px',
                background: '#667eea20',
                color: '#667eea',
                padding: '4px 12px',
                borderRadius: '20px',
                marginLeft: '10px'
              }}>
                {expenses.length} total
              </span>
            )}
          </h2>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            {uploadedData && (
              <button 
                onClick={handleSyncUploadedData}
                className="btn"
                disabled={syncing}
                style={{
                  background: 'linear-gradient(135deg, #48c774, #36a15e)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: syncing ? 'not-allowed' : 'pointer',
                  opacity: syncing ? 0.7 : 1
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
                background: expenses.length === 0 ? '#ccc' : 'linear-gradient(135deg, #003087, #00A3E0)',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: expenses.length === 0 ? 'not-allowed' : 'pointer',
                opacity: expenses.length === 0 ? 0.7 : 1
              }}
            >
              <FaDownload /> Export CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '25px'
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            borderLeft: '4px solid #48c774'
          }}>
            <div style={{ fontSize: '14px', color: '#666' }}>Total Income</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#48c774' }}>
              ₹{stats.totalIncome.toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              {stats.incomeCount} transactions
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            borderLeft: '4px solid #f14668'
          }}>
            <div style={{ fontSize: '14px', color: '#666' }}>Total Expenses</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f14668' }}>
              ₹{stats.totalExpenses.toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              {stats.expenseCount} transactions
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            borderLeft: `4px solid ${stats.netBalance >= 0 ? '#48c774' : '#f14668'}`
          }}>
            <div style={{ fontSize: '14px', color: '#666' }}>Net Balance</div>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: stats.netBalance >= 0 ? '#48c774' : '#f14668' 
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
            background: 'linear-gradient(135deg, #667eea20, #764ba220)',
            border: '2px solid #667eea',
            borderRadius: '10px',
            padding: '15px 20px',
            marginBottom: '25px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '15px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <FaCloudUploadAlt size={30} color="#667eea" />
              <div>
                <h4 style={{ margin: 0, color: '#667eea' }}>CSV Data Active</h4>
                <p style={{ margin: '5px 0 0', color: '#666' }}>
                  {uploadedData.valid_records || 0} transactions from {uploadedData.fileName || 'CSV file'}
                </p>
              </div>
            </div>
            <span style={{
              background: '#48c774',
              color: 'white',
              padding: '5px 15px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 'bold'
            }}>
              ✓ Active
            </span>
          </div>
        )}

        {/* Expense Form */}
        <ExpenseForm
          onSubmit={handleFormSubmit}
          categories={categories}
          editingExpense={editingExpense}
          onCancel={() => setEditingExpense(null)}
        />

        {/* Filters */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaFilter /> Filters
              </h3>
              
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  onClick={() => setFilterType('all')}
                  style={{
                    padding: '5px 15px',
                    background: filterType === 'all' ? '#667eea' : 'white',
                    color: filterType === 'all' ? 'white' : '#666',
                    border: '1px solid #ddd',
                    borderRadius: '20px',
                    cursor: 'pointer'
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('income')}
                  style={{
                    padding: '5px 15px',
                    background: filterType === 'income' ? '#48c774' : 'white',
                    color: filterType === 'income' ? 'white' : '#666',
                    border: '1px solid #ddd',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <FaArrowDown /> Income
                </button>
                <button
                  onClick={() => setFilterType('expense')}
                  style={{
                    padding: '5px 15px',
                    background: filterType === 'expense' ? '#f14668' : 'white',
                    color: filterType === 'expense' ? 'white' : '#666',
                    border: '1px solid #ddd',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <FaArrowUp /> Expense
                </button>
              </div>

              {(filters.startDate || filters.endDate || filterType !== 'all') && (
                <button
                  onClick={clearFilters}
                  style={{
                    padding: '4px 12px',
                    background: '#f14668',
                    color: 'black',
                    border: 'none',
                    borderRadius: '15px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
          
          <div className="form-row" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
            padding: '20px'
          }}>
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                className="form-control"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                className="form-control"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}
              />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                onClick={handleFilter} 
                className="btn btn-primary"
                style={{
                  padding: '8px 16px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              All Transactions
              <span style={{ 
                marginLeft: '10px', 
                fontSize: '14px', 
                fontWeight: 'normal',
                color: '#666'
              }}>
                ({filteredExpenses.length} of {expenses.length})
              </span>
            </h3>
          </div>
          
          <div className="table-container" style={{ overflowX: 'auto' }}>
            {filteredExpenses.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                color: '#666'
              }}>
                <FaFileCsv size={50} style={{ color: '#ccc', marginBottom: '20px' }} />
                <h3>No transactions found</h3>
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
                    background: 'linear-gradient(135deg, #003087, #00A3E0)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '5px'
                  }}
                >
                  <FaCloudUploadAlt /> Import CSV
                </Link>
              </div>
            ) : (
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', background: '#f8f9fa', borderBottom: '2px solid #003087' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', background: '#f8f9fa', borderBottom: '2px solid #003087' }}>Category</th>
                    <th style={{ padding: '12px', textAlign: 'left', background: '#f8f9fa', borderBottom: '2px solid #003087' }}>Description</th>
                    <th style={{ padding: '12px', textAlign: 'left', background: '#f8f9fa', borderBottom: '2px solid #003087' }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'left', background: '#f8f9fa', borderBottom: '2px solid #003087' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'left', background: '#f8f9fa', borderBottom: '2px solid #003087' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(expense => (
                    <tr key={expense.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>{formatDisplayDate(expense.date)}</td>
                      <td style={{ padding: '12px' }}>
                        <span className="category-badge" style={{ 
                          backgroundColor: expense.color || '#667eea',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span className="category-icon">{expense.icon || '\uD83D\uDCCC'}</span>  {expense.category_name || 'Other'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{expense.description || '-'}</td>
                      <td style={{ padding: '12px' }}>
                        {expense.type === 'income' ? (
                          <span style={{ 
                            color: '#48c774', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            fontWeight: 'bold'
                          }}>
                            <FaArrowDown /> Income
                          </span>
                        ) : (
                          <span style={{ 
                            color: '#f14668', 
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
                        padding: '12px',
                        fontWeight: 'bold',
                        color: expense.type === 'income' ? '#48c774' : '#f14668'
                      }}>
                        {expense.type === 'income' ? '+' : '-'} ₹{parseFloat(expense.amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button 
                          onClick={() => handleEdit(expense)}
                          className="btn"
                          style={{ 
                            marginRight: '8px', 
                            background: '#ffdd57',
                            color: '#2c3e50',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          <FaEdit /> Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(expense.id)}
                          className="btn btn-danger"
                          style={{
                            background: '#f14668',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          <FaTrash /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Expenses;