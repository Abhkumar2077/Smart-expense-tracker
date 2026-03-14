// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUpload } from '../context/UploadContext';
import { expenseAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import AIDashboard from '../components/AIDashboard';
import { 
  PieChart, Pie, Cell, 
  LineChart, Line, 
  BarChart, Bar,
  XAxis, YAxis, 
  Tooltip, Legend, 
  ResponsiveContainer,
  AreaChart, Area,
  ComposedChart
} from 'recharts';
import { 
  FaWallet, FaCreditCard, FaChartLine, 
  FaCloudUploadAlt, FaArrowDown, FaArrowUp,
  FaPiggyBank, FaExclamationTriangle, FaCalendarAlt,
  FaChartBar, FaChartPie, FaHistory, FaFilter
} from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useAuth();
  const { uploadedData } = useUpload();
  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [budget, setBudget] = useState(user?.monthly_budget || 0);
  
  // New state for time range
  const [timeRange, setTimeRange] = useState('month'); // 'month', 'quarter', 'year', 'all'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [allTimeData, setAllTimeData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalSavings: 0,
    avgMonthlyIncome: 0,
    avgMonthlyExpenses: 0,
    bestMonth: null,
    worstMonth: null
  });
  const [yearlyData, setYearlyData] = useState([]);
  const [categoryTotals, setCategoryTotals] = useState([]);

  const COLORS = ['#667eea', '#764ba2', '#48c774', '#f14668', '#ffdd57', '#00d1b2', '#ff9f1c', '#a06ab4', '#dda0dd', '#98d8c8'];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchDashboardData();
    
    const handleUploadChange = () => {
      fetchDashboardData();
    };
    
    window.addEventListener('upload-data-changed', handleUploadChange);
    window.addEventListener('upload-data-cleared', handleUploadChange);
    
    return () => {
      window.removeEventListener('upload-data-changed', handleUploadChange);
      window.removeEventListener('upload-data-cleared', handleUploadChange);
    };
  }, [selectedMonth, selectedYear, timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Fetching dashboard data...');
      
      // Fetch data based on time range
      let summaryRes, insightsRes, expensesRes, allExpensesRes;
      
      if (timeRange === 'month') {
        // Current month data
        summaryRes = await expenseAPI.getSummary(selectedMonth, selectedYear);
        insightsRes = await expenseAPI.getInsights();
        expensesRes = await expenseAPI.getAll();
        
        setSummary(summaryRes.data);
        setInsights(insightsRes.data);
        setRecentExpenses(expensesRes.data.slice(0, 5));
      } else {
        // All-time data
        allExpensesRes = await expenseAPI.getAll();
        
        // Calculate all-time statistics
        calculateAllTimeStats(allExpensesRes.data);
        
        // Get monthly summaries for charts
        const monthlyPromises = [];
        for (let year = 2026; year <= 2026; year++) {
          for (let month = 1; month <= 12; month++) {
            monthlyPromises.push(expenseAPI.getSummary(month, year).catch(() => null));
          }
        }
        
        const monthlyResults = await Promise.all(monthlyPromises);
        const validMonthlyData = monthlyResults.filter(r => r && r.data).map(r => r.data);
        
        processYearlyData(validMonthlyData);
        
        // Get category totals across all time
        calculateCategoryTotals(allExpensesRes.data);
        
        setRecentExpenses(allExpensesRes.data.slice(0, 5));
      }
      
    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateAllTimeStats = (expenses) => {
    const income = expenses.filter(e => e.type === 'income')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    const expense = expenses.filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    // Group by month
    const monthlyData = {};
    expenses.forEach(e => {
      const date = new Date(e.date);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!monthlyData[key]) {
        monthlyData[key] = { income: 0, expense: 0 };
      }
      
      if (e.type === 'income') {
        monthlyData[key].income += parseFloat(e.amount);
      } else {
        monthlyData[key].expense += parseFloat(e.amount);
      }
    });
    
    const months = Object.keys(monthlyData).length;
    const avgMonthlyIncome = income / months;
    const avgMonthlyExpenses = expense / months;
    
    // Find best and worst months
    let bestMonth = null;
    let worstMonth = null;
    let bestSavings = -Infinity;
    let worstSavings = Infinity;
    
    Object.entries(monthlyData).forEach(([key, data]) => {
      const savings = data.income - data.expense;
      if (savings > bestSavings) {
        bestSavings = savings;
        bestMonth = key;
      }
      if (savings < worstSavings) {
        worstSavings = savings;
        worstMonth = key;
      }
    });
    
    setAllTimeData({
      totalIncome: income,
      totalExpenses: expense,
      totalSavings: income - expense,
      avgMonthlyIncome,
      avgMonthlyExpenses,
      bestMonth,
      worstMonth,
      totalTransactions: expenses.length
    });
  };

  const processYearlyData = (monthlyData) => {
    const processed = monthlyData.map(data => ({
      month: data.current_month,
      year: data.current_year,
      monthName: months[data.current_month - 1],
      expenses: data.category_summary?.reduce((sum, cat) => 
        sum + parseFloat(cat.total_expense || 0), 0) || 0,
      income: data.category_summary?.reduce((sum, cat) => 
        sum + parseFloat(cat.total_income || 0), 0) || 0
    })).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    
    setYearlyData(processed);
  };

  const calculateCategoryTotals = (expenses) => {
    const categoryMap = new Map();
    
    expenses.forEach(e => {
      const key = e.category_name || 'Other';
      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          name: key,
          expense: 0,
          income: 0,
          color: e.color || COLORS[categoryMap.size % COLORS.length],
          icon: e.icon || '📌'
        });
      }
      
      const cat = categoryMap.get(key);
      if (e.type === 'income') {
        cat.income += parseFloat(e.amount);
      } else {
        cat.expense += parseFloat(e.amount);
      }
    });
    
    setCategoryTotals(Array.from(categoryMap.values()));
  };

  const handleBudgetUpdate = async () => {
    try {
      await expenseAPI.updateBudget(budget);
      alert('Budget updated successfully!');
    } catch (error) {
      console.error('Error updating budget:', error);
      alert('Failed to update budget');
    }
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatLargeNumber = (value) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value}`;
  };

  const getPieChartData = () => {
    if (timeRange === 'month' && summary?.category_summary) {
      return summary.category_summary.map(cat => ({
        name: cat.name || 'Other',
        value: parseFloat(cat.total_expense || cat.total_amount || 0),
        color: cat.color || COLORS[Math.floor(Math.random() * COLORS.length)]
      }));
    } else {
      return categoryTotals
        .filter(cat => cat.expense > 0)
        .map(cat => ({
          name: cat.name,
          value: cat.expense,
          color: cat.color
        }));
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          padding: '10px 15px',
          border: '1px solid #e0e0e0',
          borderRadius: '5px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: '5px 0 0', color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

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
            <p style={{ color: '#666' }}>Loading your financial dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

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
              onClick={fetchDashboardData}
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

  // Safely get values with defaults
  const totalIncome = timeRange === 'month' 
    ? (insights?.current_month?.total_income || 0)
    : allTimeData.totalIncome;
    
  const totalExpenses = timeRange === 'month'
    ? (insights?.current_month?.total_expenses || 0)
    : allTimeData.totalExpenses;
    
  const netSavings = totalIncome - totalExpenses;
  const hasData = totalIncome > 0 || totalExpenses > 0;

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        {/* Header with Time Range Selector */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaChartLine style={{ color: '#667eea' }} />
            Financial Dashboard
            {timeRange !== 'month' && (
              <span style={{
                fontSize: '14px',
                background: '#667eea20',
                color: '#667eea',
                padding: '4px 12px',
                borderRadius: '20px',
                marginLeft: '10px'
              }}>
                {timeRange === 'year' ? 'Year to Date' : 'All Time'}
              </span>
            )}
          </h2>
          
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            {/* Time Range Selector */}
            <div style={{ display: 'flex', gap: '5px', background: '#f8f9fa', padding: '4px', borderRadius: '8px' }}>
              <button
                className={`btn ${timeRange === 'month' ? 'btn-primary' : ''}`}
                onClick={() => setTimeRange('month')}
                style={{ padding: '8px 16px' }}
              >
                <FaCalendarAlt /> Month
              </button>
              <button
                className={`btn ${timeRange === 'year' ? 'btn-primary' : ''}`}
                onClick={() => setTimeRange('year')}
                style={{ padding: '8px 16px' }}
              >
                <FaChartBar /> Year
              </button>
              <button
                className={`btn ${timeRange === 'all' ? 'btn-primary' : ''}`}
                onClick={() => setTimeRange('all')}
                style={{ padding: '8px 16px' }}
              >
                <FaHistory /> All Time
              </button>
            </div>

            {/* Month/Year Selector (only for month view) */}
            {timeRange === 'month' && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="form-control"
                  style={{ width: '120px' }}
                >
                  {months.map((month, index) => (
                    <option key={index} value={index + 1}>{month}</option>
                  ))}
                </select>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="form-control"
                  style={{ width: '100px' }}
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {/* Income Card */}
          <div className="stat-card" style={{ 
            background: 'linear-gradient(135deg, #48c77410, #36a15e10)',
            border: '2px solid #48c774',
            padding: '20px',
            borderRadius: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#48c774',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FaArrowDown size={25} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {timeRange === 'month' ? 'Income This Month' : 'Total Income'}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#48c774' }}>
                  {formatCurrency(totalIncome)}
                </div>
                {timeRange !== 'month' && (
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    Avg: {formatCurrency(allTimeData.avgMonthlyIncome)}/month
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Expenses Card */}
          <div className="stat-card" style={{ 
            background: 'linear-gradient(135deg, #f1466820, #d13a5820)',
            border: '2px solid #f14668',
            padding: '20px',
            borderRadius: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#f14668',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FaArrowUp size={25} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {timeRange === 'month' ? 'Expenses This Month' : 'Total Expenses'}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f14668' }}>
                  {formatCurrency(totalExpenses)}
                </div>
                {timeRange !== 'month' && (
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    Avg: {formatCurrency(allTimeData.avgMonthlyExpenses)}/month
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Net Savings Card */}
          <div className="stat-card" style={{ 
            background: netSavings >= 0 ? '#48c77410' : '#f1466820',
            border: `2px solid ${netSavings >= 0 ? '#48c774' : '#f14668'}`,
            padding: '20px',
            borderRadius: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: netSavings >= 0 ? '#48c774' : '#f14668',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FaPiggyBank size={25} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {timeRange === 'month' ? 'Net Savings' : 'Total Savings'}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: netSavings >= 0 ? '#48c774' : '#f14668' }}>
                  {formatCurrency(Math.abs(netSavings))}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {netSavings >= 0 ? 'Surplus' : 'Deficit'}
                </div>
              </div>
            </div>
          </div>

          {/* Budget Card (only for month view) */}
          {timeRange === 'month' && (
            <div className="stat-card" style={{
              background: 'white',
              border: '2px solid #ffdd57',
              padding: '20px',
              borderRadius: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: '#ffdd57',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaCreditCard size={25} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', color: '#666' }}>Monthly Budget</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9f1c' }}>
                    {formatCurrency(budget)}
                  </div>
                  <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      style={{
                        width: '80px',
                        padding: '5px',
                        border: '1px solid #ddd',
                        borderRadius: '5px'
                      }}
                    />
                    <button 
                      onClick={handleBudgetUpdate}
                      style={{
                        padding: '5px 10px',
                        background: '#ffdd57',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Time Stats Card (for year/all view) */}
          {timeRange !== 'month' && (
            <div className="stat-card" style={{
              background: 'white',
              border: '2px solid #667eea',
              padding: '20px',
              borderRadius: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: '#667eea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaHistory size={25} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Total Transactions</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>
                    {allTimeData.totalTransactions || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    Across {Object.keys(yearlyData).length} months
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Best/Worst Months (for year/all view) */}
        {timeRange !== 'month' && allTimeData.bestMonth && (
          <div className="card" style={{
            background: 'linear-gradient(135deg, #667eea10, #764ba210)',
            border: '2px solid #667eea',
            marginBottom: '30px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#48c774', fontSize: '14px', marginBottom: '5px' }}>🏆 Best Month</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {months[parseInt(allTimeData.bestMonth.split('-')[1]) - 1]} {allTimeData.bestMonth.split('-')[0]}
                </div>
                <div style={{ color: '#48c774', fontSize: '20px', fontWeight: 'bold' }}>
                  {formatCurrency(allTimeData.totalSavings)}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>saved</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#f14668', fontSize: '14px', marginBottom: '5px' }}>📉 Needs Improvement</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {months[parseInt(allTimeData.worstMonth.split('-')[1]) - 1]} {allTimeData.worstMonth.split('-')[0]}
                </div>
                <div style={{ color: '#f14668', fontSize: '20px', fontWeight: 'bold' }}>
                  {formatCurrency(Math.abs(allTimeData.totalSavings - allTimeData.totalIncome + allTimeData.totalExpenses))}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>deficit</div>
              </div>
            </div>
          </div>
        )}

        {/* CSV Banner */}
        {uploadedData && (
          <div className="card" style={{
            background: 'linear-gradient(135deg, #667eea10, #764ba210)',
            border: '2px solid #667eea',
            marginBottom: '30px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <FaCloudUploadAlt size={40} color="#667eea" />
                <div>
                  <h3 style={{ margin: 0, color: '#667eea' }}>📊 CSV Data Active</h3>
                  <p style={{ margin: '5px 0 0', color: '#666' }}>
                    {uploadedData?.valid_records || 0} transactions imported
                  </p>
                </div>
              </div>
              <Link to="/reports" className="btn btn-primary">View Detailed Reports</Link>
            </div>
          </div>
        )}

        {/* No Data Message */}
        {!hasData && (
          <div className="card" style={{
            textAlign: 'center',
            padding: '50px',
            background: '#f8f9fa',
            marginBottom: '30px'
          }}>
            <FaCloudUploadAlt size={60} color="#ccc" />
            <h3 style={{ margin: '20px 0', color: '#666' }}>No Data Available</h3>
            <p style={{ color: '#999', marginBottom: '20px' }}>
              Start by adding your first transaction or importing a CSV file.
            </p>
            <Link to="/upload" className="btn btn-primary">
              Import CSV
            </Link>
          </div>
        )}

        {/* AI Insights */}
        {hasData && (
          <div style={{ marginBottom: '30px' }}>
            <AIDashboard />
          </div>
        )}

        {/* Charts Row */}
        {hasData && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '30px' }}>
              {/* Pie Chart - Category Breakdown */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">
                    <FaChartPie /> Category Breakdown
                  </h3>
                  {timeRange !== 'month' && (
                    <span style={{ fontSize: '12px', color: '#666' }}>All-time expenses</span>
                  )}
                </div>
                <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={getPieChartData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => 
                          percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                        }
                      >
                        {getPieChartData().map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Line/Bar Chart - Monthly Trend */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">
                    <FaChartLine /> {timeRange === 'month' ? 'Monthly Trend' : 'Yearly Overview'}
                  </h3>
                </div>
                <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer>
                    {timeRange === 'month' ? (
                      <LineChart data={summary?.monthly_summary || []}>
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="total_expenses" stroke="#f14668" name="Expenses" strokeWidth={2} />
                        <Line type="monotone" dataKey="total_income" stroke="#48c774" name="Income" strokeWidth={2} />
                      </LineChart>
                    ) : (
                      <BarChart data={yearlyData}>
                        <XAxis dataKey="monthName" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="expenses" fill="#f14668" name="Expenses" />
                        <Bar dataKey="income" fill="#48c774" name="Income" />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Income vs Expense Stacked Bar (for year/all view) */}
            {timeRange !== 'month' && categoryTotals.length > 0 && (
              <div className="card" style={{ marginBottom: '30px' }}>
                <div className="card-header">
                  <h3 className="card-title">Income vs Expenses by Category</h3>
                </div>
                <div style={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={categoryTotals}
                      layout="vertical"
                      margin={{ left: 100, right: 30, top: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(value) => formatLargeNumber(value)} />
                      <YAxis type="category" dataKey="name" width={100} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="expense" name="Expenses" stackId="a" fill="#f14668" />
                      <Bar dataKey="income" name="Income" stackId="a" fill="#48c774" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}

        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Transactions</h3>
            <Link to="/expenses" className="btn btn-primary">View All</Link>
          </div>
          <div className="table-container">
            {!recentExpenses || recentExpenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <p>No recent transactions. Add your first transaction or import a CSV file!</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExpenses.slice(0, 5).map(expense => (
                    <tr key={expense.id}>
                      <td>{expense.date}</td>
                      <td>
                        <span className="category-badge" style={{ backgroundColor: expense.color || '#667eea' }}>
                          <span className="category-icon">{expense.icon || '📌'}</span>
                          {expense.category_name || 'Other'}
                        </span>
                      </td>
                      <td>{expense.description || '-'}</td>
                      <td>
                        {expense.type === 'income' ? (
                          <span style={{ color: '#48c774', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaArrowDown /> Income
                          </span>
                        ) : (
                          <span style={{ color: '#f14668', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaArrowUp /> Expense
                          </span>
                        )}
                      </td>
                      <td style={{ 
                        color: expense.type === 'income' ? '#48c774' : '#f14668',
                        fontWeight: 'bold'
                      }}>
                        {expense.type === 'income' ? '+' : '-'} ₹{parseFloat(expense.amount).toFixed(2)}
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

export default Dashboard;