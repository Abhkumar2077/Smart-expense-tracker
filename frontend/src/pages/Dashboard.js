// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUpload } from '../context/UploadContext';
import { useNotification } from '../context/NotificationContext';
import { expenseAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import AIDashboard from '../components/AIDashboard';
import { 
  PieChart, Pie, Cell, 
  LineChart, Line, 
  BarChart, Bar,
  XAxis, YAxis, 
  CartesianGrid,
  Tooltip, Legend, 
  ResponsiveContainer,
  AreaChart, Area,
  ComposedChart
} from 'recharts';
import { 
  FaWallet, FaCreditCard, FaChartLine, 
  FaCloudUploadAlt, FaArrowDown, FaArrowUp,
  FaPiggyBank, FaExclamationTriangle, FaCalendarAlt,
  FaChartBar, FaChartPie, FaHistory, FaFilter,
  FaSyncAlt, FaDownload, FaFileExport
} from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useAuth();
  const { uploadedData } = useUpload();
  const { showNotification } = useNotification();
  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [budget, setBudget] = useState(user?.monthly_budget || 0);

  // Time range state
  const [timeRange, setTimeRange] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  
  // Data states with proper initialization
  const [allTimeData, setAllTimeData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalSavings: 0,
    avgMonthlyIncome: 0,
    avgMonthlyExpenses: 0,
    bestMonth: null,
    worstMonth: null,
    totalTransactions: 0,
    activeMonths: 0
  });
  
  const [yearlyData, setYearlyData] = useState([]);
  const [categoryTotals, setCategoryTotals] = useState([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState([]);

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
    window.addEventListener('storage', handleUploadChange);
    
    return () => {
      window.removeEventListener('upload-data-changed', handleUploadChange);
      window.removeEventListener('upload-data-cleared', handleUploadChange);
      window.removeEventListener('storage', handleUploadChange);
    };
  }, [selectedMonth, selectedYear, timeRange]);

  const fetchDashboardData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    console.log('📊 Fetching dashboard data...');
    console.log('Time range:', timeRange, 'Month:', selectedMonth, 'Year:', selectedYear);
    
    if (timeRange === 'month') {
      await fetchMonthData();
    } else if (timeRange === 'year') {
      await fetchYearData();
    } else {
      await fetchAllTimeData();
    }
    
  } catch (err) {
    console.error('❌ Error fetching dashboard data:', err);
    setError('Failed to load dashboard data. Please try again.');
  } finally {
    setLoading(false);
  }
};
  const fetchMonthData = async () => {
  try {
    console.log('📅 Fetching data for month:', selectedMonth, 'year:', selectedYear);
    
    // Fetch current month summary
    const summaryRes = await expenseAPI.getSummary(selectedMonth, selectedYear);
    console.log(`📊 Month ${selectedMonth} data:`, summaryRes.data);
    
    // Fetch insights (this might be for current month only - we may need to modify this)
    const insightsRes = await expenseAPI.getInsights();
    
    // Fetch recent expenses (optional, could filter by month)
    const expensesRes = await expenseAPI.getAll();
    
    // Filter expenses for the selected month
    const filteredExpenses = expensesRes.data.filter(expense => {
      const expDate = new Date(expense.date);
      return expDate.getMonth() + 1 === selectedMonth && 
             expDate.getFullYear() === selectedYear;
    });
    
    setSummary(summaryRes.data);
    setInsights(insightsRes.data);
    setRecentExpenses(filteredExpenses.slice(0, 5)); // Show only recent from selected month
    
    // Format monthly trend data for the chart
    if (summaryRes.data?.monthly_summary && summaryRes.data.monthly_summary.length > 0) {
      // Format the monthly summary data for the chart
      const formattedTrendData = summaryRes.data.monthly_summary.map(item => ({
        month: item.month,
        monthName: months[item.month - 1].substring(0, 3),
        fullMonthName: months[item.month - 1],
        expenses: item.total_expenses || 0,
        income: item.total_income || 0,
        savings: (item.total_income || 0) - (item.total_expenses || 0)
      }));
      setMonthlyTrendData(formattedTrendData);
      console.log('📈 Monthly trend data for charts:', formattedTrendData);
    } else {
      // If no monthly summary, create a single data point for the current month
      const currentMonthData = [{
        month: selectedMonth,
        monthName: months[selectedMonth - 1].substring(0, 3),
        fullMonthName: months[selectedMonth - 1],
        expenses: insightsRes.data?.current_month?.total_expenses || 0,
        income: insightsRes.data?.current_month?.total_income || 0,
        savings: (insightsRes.data?.current_month?.total_income || 0) - (insightsRes.data?.current_month?.total_expenses || 0)
      }];
      setMonthlyTrendData(currentMonthData);
      console.log('📈 Single month data for charts:', currentMonthData);
    }
    
    // Update budget from user
    setBudget(user?.monthly_budget || 0);
    
  } catch (error) {
    console.error('Error fetching month data:', error);
    throw error;
  }
};

  const fetchYearData = async () => {
  try {
    const currentYear = selectedYear;
    const yearlyPromises = [];
    
    // Fetch data for all months of the selected year
    for (let month = 1; month <= 12; month++) {
      yearlyPromises.push(
        expenseAPI.getSummary(month, currentYear).catch(() => ({
          data: {
            category_summary: [],
            current_month: month,
            current_year: currentYear,
            monthly_summary: []
          }
        }))
      );
    }
    
    const results = await Promise.all(yearlyPromises);
    
    // Process yearly data
    const processed = [];
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalTransactions = 0; // ✅ ADD THIS - Track total transactions
    let activeMonths = 0;
    
    results.forEach((res, index) => {
      if (res.data && res.data.category_summary) {
        const monthIncome = res.data.category_summary.reduce(
          (sum, cat) => sum + (parseFloat(cat.total_income) || 0), 0
        );
        const monthExpense = res.data.category_summary.reduce(
          (sum, cat) => sum + (parseFloat(cat.total_expense || cat.total_amount) || 0), 0
        );
        
        // Get transaction count for this month
        const monthTransactions = res.data.category_summary.reduce(
          (sum, cat) => sum + (parseInt(cat.transaction_count) || 0), 0
        );
        
        if (monthIncome > 0 || monthExpense > 0) {
          activeMonths++;
        }
        
        totalIncome += monthIncome;
        totalExpenses += monthExpense;
        totalTransactions += monthTransactions; // ✅ ADD THIS
        
        processed.push({
          month: index + 1,
          monthName: months[index].substring(0, 3),
          fullMonthName: months[index],
          income: monthIncome,
          expenses: monthExpense,
          savings: monthIncome - monthExpense,
          transactions: monthTransactions // Optional: add to processed data
        });
      }
    });
    
    setYearlyData(processed);
    setMonthlyTrendData(processed);
    console.log('📈 Yearly trend data:', processed);
    console.log('📊 Total transactions for year:', totalTransactions); // Debug log
    
    setAllTimeData({
      totalIncome,
      totalExpenses,
      totalSavings: totalIncome - totalExpenses,
      avgMonthlyIncome: activeMonths > 0 ? totalIncome / activeMonths : 0,
      avgMonthlyExpenses: activeMonths > 0 ? totalExpenses / activeMonths : 0,
      totalTransactions: totalTransactions, // ✅ NOW THIS WILL BE CORRECT
      activeMonths
    });
    
    // Get all expenses for recent transactions
    const expensesRes = await expenseAPI.getAll();
    setRecentExpenses(expensesRes.data.slice(0, 5));
    
  } catch (error) {
    console.error('Error fetching yearly data:', error);
    throw error;
  }
};

  const fetchAllTimeData = async () => {
    try {
      const expensesRes = await expenseAPI.getAll();
      const expenses = expensesRes.data || [];
      
      if (expenses.length === 0) {
        setAllTimeData({
          totalIncome: 0,
          totalExpenses: 0,
          totalSavings: 0,
          avgMonthlyIncome: 0,
          avgMonthlyExpenses: 0,
          bestMonth: null,
          worstMonth: null,
          totalTransactions: 0,
          activeMonths: 0
        });
        setCategoryTotals([]);
        setMonthlyTrendData([]);
        setRecentExpenses([]);
        return;
      }
      
      const income = expenses.filter(e => e?.type === 'income')
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      
      const expense = expenses.filter(e => e?.type === 'expense')
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      
      const monthlyMap = new Map();
      const yearMap = new Map();
      
      expenses.forEach(e => {
        if (!e?.date) return;
        
        const date = new Date(e.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const yearKey = date.getFullYear().toString();
        
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { 
            income: 0, 
            expense: 0, 
            transactions: 0,
            year: date.getFullYear(),
            month: date.getMonth() + 1
          });
        }
        
        const monthData = monthlyMap.get(monthKey);
        if (e.type === 'income') {
          monthData.income += parseFloat(e.amount) || 0;
        } else {
          monthData.expense += parseFloat(e.amount) || 0;
        }
        monthData.transactions++;
        
        if (!yearMap.has(yearKey)) {
          yearMap.set(yearKey, { year: yearKey, income: 0, expense: 0 });
        }
        const yearData = yearMap.get(yearKey);
        if (e.type === 'income') {
          yearData.income += parseFloat(e.amount) || 0;
        } else {
          yearData.expense += parseFloat(e.amount) || 0;
        }
      });
      
      let bestMonth = null;
      let worstMonth = null;
      let bestSavings = -Infinity;
      let worstSavings = Infinity;
      
      monthlyMap.forEach((data, key) => {
        const savings = data.income - data.expense;
        if (savings > bestSavings) {
          bestSavings = savings;
          bestMonth = { key, ...data };
        }
        if (savings < worstSavings) {
          worstSavings = savings;
          worstMonth = { key, ...data };
        }
      });
      
      const categoryMap = new Map();
      expenses.forEach(e => {
        if (!e?.category_name) return;
        
        const catName = e.category_name || 'Other';
        if (!categoryMap.has(catName)) {
          categoryMap.set(catName, {
            name: catName,
            expense: 0,
            income: 0,
            color: e.color || COLORS[categoryMap.size % COLORS.length],
            icon: e.icon || '\uD83D\uDCCC'
          });
        }
        const cat = categoryMap.get(catName);
        if (e.type === 'income') {
          cat.income += parseFloat(e.amount) || 0;
        } else {
          cat.expense += parseFloat(e.amount) || 0;
        }
      });
      
      const yearlyTrend = Array.from(yearMap.values()).map(data => ({
        year: data.year,
        income: data.income,
        expenses: data.expense,
        savings: data.income - data.expense
      })).sort((a, b) => parseInt(a.year) - parseInt(b.year));
      
      setCategoryTotals(Array.from(categoryMap.values()));
      setMonthlyTrendData(yearlyTrend);
      
      setAllTimeData({
        totalIncome: income,
        totalExpenses: expense,
        totalSavings: income - expense,
        avgMonthlyIncome: monthlyMap.size > 0 ? income / monthlyMap.size : 0,
        avgMonthlyExpenses: monthlyMap.size > 0 ? expense / monthlyMap.size : 0,
        bestMonth: bestMonth ? {
          ...bestMonth,
          monthName: months[bestMonth.month - 1],
          savings: bestSavings
        } : null,
        worstMonth: worstMonth ? {
          ...worstMonth,
          monthName: months[worstMonth.month - 1],
          savings: worstSavings
        } : null,
        totalTransactions: expenses.length,
        activeMonths: monthlyMap.size
      });
      
      setRecentExpenses(expenses.slice(0, 5));
      
    } catch (error) {
      console.error('Error fetching all-time data:', error);
      setAllTimeData({
        totalIncome: 0,
        totalExpenses: 0,
        totalSavings: 0,
        avgMonthlyIncome: 0,
        avgMonthlyExpenses: 0,
        bestMonth: null,
        worstMonth: null,
        totalTransactions: 0,
        activeMonths: 0
      });
      setCategoryTotals([]);
      setMonthlyTrendData([]);
    }
  };

  const handleBudgetUpdate = async () => {
    try {
      await expenseAPI.updateBudget(budget);
      showNotification('✅ Budget updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating budget:', error);
      showNotification('❌ Failed to update budget', 'error');
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
    if (!value) return '₹0';
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value}`;
  };

  const getPieChartData = () => {
    if (timeRange === 'month' && summary?.category_summary) {
      return summary.category_summary
        .filter(cat => parseFloat(cat.total_expense || cat.total_amount || 0) > 0)
        .map(cat => ({
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

  const getIncomePieChartData = () => {
    if (timeRange === 'month' && summary?.category_summary) {
      return summary.category_summary
        .filter(cat => parseFloat(cat.total_income || 0) > 0)
        .map(cat => ({
          name: cat.name || 'Other',
          value: parseFloat(cat.total_income || 0),
          color: cat.color || COLORS[Math.floor(Math.random() * COLORS.length)]
        }));
    } else {
      return categoryTotals
        .filter(cat => cat.income > 0)
        .map(cat => ({
          name: cat.name,
          value: cat.income,
          color: cat.color
        }));
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          padding: '12px 16px',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxWidth: '300px'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#2c3e50', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ 
              margin: '4px 0', 
              color: entry.color,
              display: 'flex',
              justifyContent: 'space-between',
              gap: '20px'
            }}>
              <span>{entry.name}:</span>
              <span style={{ fontWeight: 'bold' }}>{formatCurrency(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleExportDashboard = () => {
    try {
      let csv = 'Dashboard Export\n\n';
      
      if (timeRange === 'month') {
        csv += `Period: ${months[selectedMonth - 1]} ${selectedYear}\n`;
      } else if (timeRange === 'year') {
        csv += `Period: Year ${selectedYear}\n`;
      } else {
        csv += 'Period: All Time\n';
      }
      
      csv += `\nSummary\n`;
      const exportTotalIncome = timeRange === 'month' ? monthlyTotals.income : allTimeData.totalIncome;
      const exportTotalExpenses = timeRange === 'month' ? monthlyTotals.expenses : allTimeData.totalExpenses;
      const exportNetSavings = exportTotalIncome - exportTotalExpenses;
      const exportTransactions = timeRange === 'month' ? recentExpenses.length : (allTimeData.totalTransactions || 0);

      csv += `Total Income,${formatCurrency(exportTotalIncome)}\n`;
      csv += `Total Expenses,${formatCurrency(exportTotalExpenses)}\n`;
      csv += `Net Savings,${formatCurrency(exportNetSavings)}\n`;
      csv += `Transactions,${exportTransactions}\n`;
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showNotification('📄 Dashboard exported successfully!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showNotification('❌ Failed to export dashboard', 'error');
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
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
              onClick={handleRefresh}
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

  // For month view, derive totals from the summary response (rather than the "insights" endpoint which always returns the current month)
  const monthlyTotals = summary?.category_summary ? summary.category_summary.reduce(
    (totals, cat) => {
      totals.income += parseFloat(cat.total_income) || 0;
      totals.expenses += parseFloat(cat.total_expense || cat.total_amount) || 0;
      return totals;
    },
    { income: 0, expenses: 0 }
  ) : { income: 0, expenses: 0 };

  const totalIncome = timeRange === 'month'
    ? monthlyTotals.income
    : allTimeData.totalIncome;

  const totalExpenses = timeRange === 'month'
    ? monthlyTotals.expenses
    : allTimeData.totalExpenses;

  const netSavings = totalIncome - totalExpenses;
  const hasData = totalIncome > 0 || totalExpenses > 0 || (recentExpenses && recentExpenses.length > 0);

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        {/* Header with Controls */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
              <FaChartLine style={{ color: '#667eea' }} />
              Financial Dashboard
            </h2>
            {timeRange !== 'month' && (
              <span style={{
                fontSize: '14px',
                background: '#667eea20',
                color: '#667eea',
                padding: '4px 12px',
                borderRadius: '20px'
              }}>
                {timeRange === 'year' ? `Year ${selectedYear}` : 'All Time'}
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={handleRefresh} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px' }}>
              <FaSyncAlt /> Refresh
            </button>
            
            <button onClick={handleExportDashboard} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px' }} disabled={!hasData}>
              <FaDownload /> Export
            </button>

            {/* Time Range Selector */}
            <div style={{ display: 'flex', gap: '5px', background: '#f8f9fa', padding: '4px', borderRadius: '8px' }}>
              <button className={`btn ${timeRange === 'month' ? 'btn-primary' : ''}`} onClick={() => setTimeRange('month')} style={{ padding: '8px 16px' }}>
                <FaCalendarAlt /> Month
              </button>
              <button className={`btn ${timeRange === 'year' ? 'btn-primary' : ''}`} onClick={() => setTimeRange('year')} style={{ padding: '8px 16px' }}>
                <FaChartBar /> Year
              </button>
              <button className={`btn ${timeRange === 'all' ? 'btn-primary' : ''}`} onClick={() => setTimeRange('all')} style={{ padding: '8px 16px' }}>
                <FaHistory /> All Time
              </button>
            </div>

            {/* Month/Year Selector */}
            {timeRange === 'month' && (
  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
    <select 
      value={selectedMonth} 
      onChange={(e) => {
        console.log('Month changed to:', e.target.value); // Debug log
        setSelectedMonth(parseInt(e.target.value));
      }}
      className="form-control"
      style={{ width: '120px' }}
    >
      {months.map((month, index) => (
        <option key={index} value={index + 1}>{month}</option>
      ))}
    </select>
    <select 
      value={selectedYear} 
      onChange={(e) => {
        console.log('Year changed to:', e.target.value); // Debug log
        setSelectedYear(parseInt(e.target.value));
      }}
      className="form-control"
      style={{ width: '100px' }}
    >
      {years.map(year => (
        <option key={year} value={year}>{year}</option>
      ))}
    </select>
  </div>
)}

            {/* Year Selector for Year View */}
            {timeRange === 'year' && (
              <select value={selectedYear} onChange={(e) => {
                console.log('Year changed to:', e.target.value); // Debug log
                setSelectedYear(parseInt(e.target.value));
              }} className="form-control" style={{ width: '120px' }}>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {/* Income Card */}
<div className="stat-card" style={{ 
  background: 'linear-gradient(135deg, #48c77410, #36a15e10)',
  borderLeft: '4px solid #48c774'
}}>
  <div className="stat-icon"><FaArrowDown style={{ color: '#48c774' }} /></div>
  <div className="stat-value" style={{ color: '#48c774' }}>
    {timeRange === 'month' 
      ? formatCurrency(monthlyTotals.income)
      : formatCurrency(allTimeData.totalIncome)}
  </div>
  <div className="stat-label">
    {timeRange === 'month' ? `Income for ${months[selectedMonth-1]} ${selectedYear}` : 'Total Income'}
  </div>
</div>

{/* Expenses Card */}
<div className="stat-card" style={{ 
  background: 'linear-gradient(135deg, #f1466820, #d13a5820)',
  borderLeft: '4px solid #f14668'
}}>
  <div className="stat-icon"><FaArrowUp style={{ color: '#f14668' }} /></div>
  <div className="stat-value" style={{ color: '#f14668' }}>
    {timeRange === 'month' 
      ? formatCurrency(monthlyTotals.expenses)
      : formatCurrency(allTimeData.totalExpenses)}
  </div>
  <div className="stat-label">
    {timeRange === 'month' ? `Expenses for ${months[selectedMonth-1]} ${selectedYear}` : 'Total Expenses'}
  </div>
</div>

          {/* Net Savings Card */}
          <div className="stat-card" style={{ background: netSavings >= 0 ? '#48c77410' : '#f1466820', borderLeft: `4px solid ${netSavings >= 0 ? '#48c774' : '#f14668'}` }}>
            <div className="stat-icon"><FaPiggyBank style={{ color: netSavings >= 0 ? '#48c774' : '#f14668' }} /></div>
            <div className="stat-value" style={{ color: netSavings >= 0 ? '#48c774' : '#f14668' }}>{formatCurrency(Math.abs(netSavings))}</div>
            <div className="stat-label">{timeRange === 'month' ? 'Net Savings' : 'Total Savings'}</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>{netSavings >= 0 ? 'Surplus' : 'Deficit'}</div>
          </div>
        </div>

        {/* Best/Worst Months */}
        {timeRange !== 'month' && allTimeData.bestMonth && (
          <div className="card" style={{ background: 'linear-gradient(135deg, #00308710, #00A3E010)', border: '2px solid #003087', marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#48c774', fontSize: '14px', marginBottom: '5px' }}>🏆 Best Month</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{allTimeData.bestMonth?.monthName} {allTimeData.bestMonth?.year}</div>
                <div style={{ color: '#48c774', fontSize: '20px', fontWeight: 'bold' }}>{formatCurrency(allTimeData.bestMonth?.savings || 0)}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>saved</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#f14668', fontSize: '14px', marginBottom: '5px' }}>📉 Needs Improvement</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{allTimeData.worstMonth?.monthName} {allTimeData.worstMonth?.year}</div>
                <div style={{ color: '#f14668', fontSize: '20px', fontWeight: 'bold' }}>{formatCurrency(Math.abs(allTimeData.worstMonth?.savings || 0))}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>deficit</div>
              </div>
            </div>
          </div>
        )}

        {/* CSV Banner */}
        {uploadedData && (
          <div className="card" style={{ background: 'linear-gradient(135deg, #667eea10, #764ba210)', border: '2px solid #667eea', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <FaCloudUploadAlt size={40} color="#667eea" />
                <div>
                  <h3 style={{ margin: 0, color: '#667eea' }}>📊 CSV Data Active</h3>
                  <p style={{ margin: '5px 0 0', color: '#666' }}>{uploadedData?.valid_records || 0} transactions imported</p>
                </div>
              </div>
              <Link to="/reports" className="btn btn-primary">View Detailed Reports</Link>
            </div>
          </div>
        )}

        {/* No Data Message */}
        {!hasData && (
          <div className="card" style={{ textAlign: 'center', padding: '50px', background: '#f8f9fa', marginBottom: '30px' }}>
            <FaCloudUploadAlt size={60} color="#ccc" />
            <h3 style={{ margin: '20px 0', color: '#666' }}>No Data Available</h3>
            <p style={{ color: '#999', marginBottom: '20px' }}>Start by adding your first transaction or importing a CSV file.</p>
            <Link to="/upload" className="btn btn-primary">Import CSV</Link>
          </div>
        )}


        {/* Charts Section */}
        {hasData && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '30px' }}>
              {/* Expense Pie Chart */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title"><FaChartPie /> Expense Breakdown</h3>
                  {timeRange !== 'month' && <span style={{ fontSize: '12px', color: '#666' }}>All-time expenses</span>}
                </div>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={getPieChartData()} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value"
                        label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}>
                        {getPieChartData().map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Income Pie Chart */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title"><FaChartPie /> Income Breakdown</h3>
                  {timeRange !== 'month' && <span style={{ fontSize: '12px', color: '#666' }}>All-time income</span>}
                </div>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={getIncomePieChartData()} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value"
                        label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}>
                        {getIncomePieChartData().map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Trend Chart */}
            <div className="card" style={{ marginBottom: '30px', position: 'relative' }}>
              <div className="card-header">
                <h3 className="card-title">
                  <FaChartLine /> 
                  {timeRange === 'month' ? 'Monthly Trend' : timeRange === 'year' ? `Monthly Breakdown - ${selectedYear}` : 'Yearly Overview'}
                </h3>
              </div>
              <div style={{ width: '100%', height: 350 }}>
                {monthlyTrendData.length > 0 ? (
                  <ResponsiveContainer>
                    {timeRange === 'all' ? (
                      <BarChart data={monthlyTrendData}>
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={(value) => formatLargeNumber(value)} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="expenses" fill="#f14668" name="Expenses" />
                        <Bar dataKey="income" fill="#48c774" name="Income" />
                      </BarChart>
                    ) : (
                      <ComposedChart data={monthlyTrendData}>
                        <XAxis dataKey="monthName" scale="point" padding={{ left: 10, right: 10 }} />
                        <YAxis yAxisId="left" tickFormatter={(value) => formatLargeNumber(value)} />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatLargeNumber(value)} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="expenses" fill="#f14668" name="Expenses" barSize={30} />
                        <Bar yAxisId="left" dataKey="income" fill="#48c774" name="Income" barSize={30} />
                        <Line yAxisId="right" type="monotone" dataKey="savings" stroke="#667eea" name="Savings" strokeWidth={2} dot={{ r: 4 }} />
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
                    <FaChartLine size={50} style={{ color: '#ccc', marginBottom: '15px' }} />
                    <p>No trend data available for this period</p>
                    <p style={{ fontSize: '13px', marginTop: '5px' }}>
                      {timeRange === 'month' ? 'Add transactions for multiple months to see trends' :
                       timeRange === 'year' ? 'No data found for the selected year' : 'No historical data available'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Category Comparison */}
            {timeRange !== 'month' && categoryTotals.length > 0 && (
              <div className="card" style={{ marginBottom: '30px' }}>
                <div className="card-header">
                  <h3 className="card-title">Income vs Expenses by Category</h3>
                </div>
                <div style={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer>
                    <BarChart data={categoryTotals} layout="vertical" margin={{ left: 100, right: 30, top: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(value) => formatLargeNumber(value)} />
                      <YAxis type="category" dataKey="name" width={100} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="expense" name="Expenses" fill="#f14668" />
                      <Bar dataKey="income" name="Income" fill="#48c774" />
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
                          <span className="category-icon">{expense.icon || '\uD83D\uDCCC'}</span>
                          {expense.category_name || 'Other'}
                        </span>
                      </td>
                      <td>{expense.description || '-'}</td>
                      <td>
                        {expense.type === 'income' ? (
                          <span style={{ color: '#48c774', display: 'flex', alignItems: 'center', gap: '4px' }}><FaArrowDown /> Income</span>
                        ) : (
                          <span style={{ color: '#f14668', display: 'flex', alignItems: 'center', gap: '4px' }}><FaArrowUp /> Expense</span>
                        )}
                      </td>
                      <td style={{ color: expense.type === 'income' ? '#48c774' : '#f14668', fontWeight: 'bold' }}>
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