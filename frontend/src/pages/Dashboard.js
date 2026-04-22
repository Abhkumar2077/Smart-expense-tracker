// frontend/src/pages/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resolveExpenseCategoryIcon } from '../utils/categoryIcon';

import { dashboardAPI } from '../services/api';
import SuggestionsInbox from '../components/SuggestionsInbox';
import WeeklyDigest from '../components/WeeklyDigest';
import { 
  PieChart, Pie, Cell, 
  LineChart, Line, 
  Bar,
  XAxis, YAxis, 
  CartesianGrid,
  Tooltip, Legend, 
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { 
  FaWallet, FaChartLine, 
  FaArrowDown, FaArrowUp,
  FaExclamationTriangle, FaCalendarAlt
} from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [goals, setGoals] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Time range state
  const [timeRange, setTimeRange] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const COLORS = ['#667eea', '#764ba2', '#48c774', '#f14668', '#ffdd57', '#00d1b2', '#ff9f1c', '#a06ab4', '#dda0dd', '#98d8c8'];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const [sparklineData, setSparklineData] = useState({});
  const [typedGreeting, setTypedGreeting] = useState('');
  const [typedSubtitle, setTypedSubtitle] = useState('');

  // Fetch sparkline data separately (always get monthly data for trends)
  const fetchSparklineData = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const sparklineRes = await dashboardAPI.getSummary('month', currentMonth, currentYear);
      
      console.log('📊 Sparkline API response:', sparklineRes.data);
      
      const monthlyData = sparklineRes.data?.summary?.monthly_summary || [];
      console.log('📊 Monthly data for sparklines:', monthlyData);
      
      // Create a complete dataset for the last 5 months
      const currentDate = new Date();
      const last5Months = [];
      
      for (let i = 4; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthNum = date.getMonth() + 1;
        const yearNum = date.getFullYear();
        
        // Find data for this month
        const monthData = monthlyData.find(item => parseInt(item.month) === monthNum) || {
          month: monthNum,
          total_income: 0,
          total_expenses: 0,
          total_transactions: 0
        };
        
        last5Months.push({
          month: monthNum,
          year: yearNum,
          total_income: parseFloat(monthData.total_income) || 0,
          total_expenses: parseFloat(monthData.total_expenses) || 0,
          total_transactions: parseFloat(monthData.total_transactions) || 0
        });
      }
      
      console.log('📊 Last 5 months data:', last5Months);
      
      const processedData = {
        savings: last5Months.map((item, index) => ({
          x: index,
          value: item.total_income - item.total_expenses
        })),
        income: last5Months.map((item, index) => ({
          x: index,
          value: item.total_income
        })),
        expenses: last5Months.map((item, index) => ({
          x: index,
          value: item.total_expenses
        })),
        transactions: last5Months.map((item, index) => ({
          x: index,
          value: item.total_transactions
        }))
      };
      
      console.log('📊 Processed sparkline data:', processedData);
      setSparklineData(processedData);
    } catch (error) {
      console.error('❌ Error fetching sparkline data:', error);
      // Set fallback data
      const fallbackData = Array.from({ length: 5 }, (_, i) => ({
        x: i,
        value: Math.random() * 100 + 20
      }));
      setSparklineData({
        savings: fallbackData,
        income: fallbackData,
        expenses: fallbackData,
        transactions: fallbackData
      });
    }
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Fetching dashboard data...');
      console.log('Time range:', timeRange, 'Month:', selectedMonth, 'Year:', selectedYear);
      
      // Fetch comprehensive dashboard data
      const dashboardRes = await dashboardAPI.getSummary(timeRange, selectedMonth, selectedYear);
      console.log('📊 Dashboard data:', dashboardRes.data);
      console.log('📊 Recent expenses:', dashboardRes.data.recent_expenses);
      
      setDashboardData(dashboardRes.data);
      setGoals(dashboardRes.data.goals || []);
      setReminders(dashboardRes.data.reminders || []);
      
    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, timeRange]);

  useEffect(() => {
    fetchDashboardData();
    fetchSparklineData(); // Fetch sparkline data separately
    
    const handleUploadChange = () => {
      fetchDashboardData();
      fetchSparklineData();
    };
    
    window.addEventListener('upload-data-changed', handleUploadChange);
    window.addEventListener('upload-data-cleared', handleUploadChange);
    window.addEventListener('storage', handleUploadChange);
    
    return () => {
      window.removeEventListener('upload-data-changed', handleUploadChange);
      window.removeEventListener('upload-data-cleared', handleUploadChange);
      window.removeEventListener('storage', handleUploadChange);
    };
  }, [selectedMonth, selectedYear, timeRange, fetchDashboardData]);

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getPieChartData = () => {
    if (!dashboardData?.summary) return [];
    
    if (timeRange === 'month' && dashboardData.summary.category_summary) {
      return dashboardData.summary.category_summary
        .filter(cat => parseFloat(cat.total_expense || cat.total_amount || 0) > 0)
        .map(cat => ({
          name: cat.name || 'Other',
          value: parseFloat(cat.total_expense || cat.total_amount || 0),
          color: cat.color || COLORS[Math.floor(Math.random() * COLORS.length)]
        }));
    }
    return [];
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

  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const greetingText = `${getTimeBasedGreeting()}, ${dashboardData?.user?.name || user?.name || 'User'}!`;
  const subtitleText = `Welcome to your financial dashboard. Here's your overview for ${timeRange === 'month' ? `${months[selectedMonth - 1]} ${selectedYear}` : timeRange === 'year' ? selectedYear : 'all time'}.`;

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setTypedGreeting(greetingText);
      setTypedSubtitle(subtitleText);
      return undefined;
    }

    setTypedGreeting('');
    setTypedSubtitle('');

    let greetingIndex = 0;
    let subtitleIndex = 0;
    let subtitleTimerId = null;

    const greetingTimer = window.setInterval(() => {
      greetingIndex += 1;
      setTypedGreeting(greetingText.slice(0, greetingIndex));

      if (greetingIndex >= greetingText.length) {
        window.clearInterval(greetingTimer);

        subtitleTimerId = window.setInterval(() => {
          subtitleIndex += 1;
          setTypedSubtitle(subtitleText.slice(0, subtitleIndex));

          if (subtitleIndex >= subtitleText.length) {
            window.clearInterval(subtitleTimerId);
          }
        }, 12);
      }
    }, 28);

    return () => {
      window.clearInterval(greetingTimer);
      if (subtitleTimerId) {
        window.clearInterval(subtitleTimerId);
      }
    };
  }, [greetingText, subtitleText]);

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
    );
  }

  if (error) {
    return (
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
    );
  }

  // Calculate totals based on dashboard data
  const totalIncome = dashboardData?.summary?.total_income || 0;
  const totalExpenses = dashboardData?.summary?.total_expenses || 0;
  const netSavings = totalIncome - totalExpenses;

  // Get monthly trend data for charts
  const getMonthlyTrendData = () => {
    if (!dashboardData?.summary) return [];
    
    if (timeRange === 'month' && dashboardData.summary.monthly_summary) {
      return dashboardData.summary.monthly_summary.map(item => ({
        month: item.month,
        monthName: months[item.month - 1].substring(0, 3),
        fullMonthName: months[item.month - 1],
        expenses: item.total_expenses || 0,
        income: item.total_income || 0,
        savings: (item.total_income || 0) - (item.total_expenses || 0)
      }));
    }
    return [];
  };

  const trendData = getMonthlyTrendData();

  // Generate sparkline data for KPIs
  const getSparklineData = (dataKey) => {
    return sparklineData[dataKey] || Array.from({ length: 5 }, (_, i) => ({
      x: i,
      value: Math.random() * 100 + 20
    }));
  };

  // Calculate percentage change for KPIs
  const calculatePercentageChange = (dataKey) => {
    const data = sparklineData[dataKey];
    if (!data || data.length < 2) return 0;
    
    const current = data[data.length - 1]?.value || 0;
    const previous = data[data.length - 2]?.value || 0;
    
    if (previous === 0) return 0;
    
    return ((current - previous) / previous) * 100;
  };

  return (
    <div>
      {/* Greeting Block */}
        <div className="greeting-block">
          <div className="greeting-content">
            <h1 className="greeting-title">{typedGreeting}<span className="typing-cursor">|</span></h1>
            <p className="greeting-subtitle">{typedSubtitle}</p>
          </div>
          <div className="greeting-decoration">
            <div className="time-indicator">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Header Controls */}
        <div className="dashboard-header">
          <div className="header-controls">
            {/* Time Range Selector */}
            <div className="time-range-selector">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="time-range-select"
              >
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="all">All Time</option>
              </select>
              {timeRange === 'month' && (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="month-select"
                >
                  {months.map((month, index) => (
                    <option key={index + 1} value={index + 1}>{month}</option>
                  ))}
                </select>
              )}
              {(timeRange === 'month' || timeRange === 'year') && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="year-select"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Search Bar */}
            <div className="search-bar">
              <input type="text" placeholder="Search transactions..." />
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="kpi-cards">
          <div className="kpi-card">
            <div className="kpi-icon">
              <FaWallet />
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{formatCurrency(netSavings)}</div>
              <div className="kpi-label">Net Savings</div>
              <div className="kpi-change">
                {(() => {
                  const change = calculatePercentageChange('savings');
                  return change >= 0 ? 
                    <span className="positive">↗ +{change.toFixed(1)}%</span> : 
                    <span className="negative">↘ {change.toFixed(1)}%</span>;
                })()}
              </div>
            </div>
            <div className="kpi-sparkline">
              <ResponsiveContainer width="100%" height={40}>
                <LineChart data={getSparklineData('savings')}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#667eea" 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              <FaArrowDown />
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{formatCurrency(totalIncome)}</div>
              <div className="kpi-label">Total Income</div>
              <div className="kpi-change">
                {(() => {
                  const change = calculatePercentageChange('income');
                  return change >= 0 ? 
                    <span className="positive">↗ +{change.toFixed(1)}%</span> : 
                    <span className="negative">↘ {change.toFixed(1)}%</span>;
                })()}
              </div>
            </div>
            <div className="kpi-sparkline">
              <ResponsiveContainer width="100%" height={40}>
                <LineChart data={getSparklineData('income')}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#48c774" 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              <FaArrowUp />
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{formatCurrency(totalExpenses)}</div>
              <div className="kpi-label">Total Expenses</div>
              <div className="kpi-change">
                {(() => {
                  const change = calculatePercentageChange('expenses');
                  return change >= 0 ? 
                    <span className="positive">↗ +{change.toFixed(1)}%</span> : 
                    <span className="negative">↘ {change.toFixed(1)}%</span>;
                })()}
              </div>
            </div>
            <div className="kpi-sparkline">
              <ResponsiveContainer width="100%" height={40}>
                <LineChart data={getSparklineData('expenses')}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#f14668" 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">
              <FaChartLine />
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{dashboardData?.summary?.total_transactions || 0}</div>
              <div className="kpi-label">Transactions</div>
              <div className="kpi-change">
                <span className="neutral">→ 0.0%</span>
              </div>
            </div>
            <div className="kpi-sparkline">
              <ResponsiveContainer width="100%" height={40}>
                <LineChart data={getSparklineData('transactions', 5)}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#667eea" 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-row">
            {/* Income vs Expenses Trend */}
            <div className="primary-chart">
              <div className="chart-header">
                <h2>Income vs Expenses Trend</h2>
                <div className="chart-controls">
                  <button className="chart-toggle active">Monthly</button>
                  <button className="chart-toggle">Yearly</button>
                </div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="income" fill="#48c774" name="Income" />
                    <Bar dataKey="expenses" fill="#f14668" name="Expenses" />
                    <Line type="monotone" dataKey="savings" stroke="#667eea" strokeWidth={3} name="Savings" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="category-chart">
              <h2>Expense Categories</h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getPieChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getPieChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Goals and Reminders Section */}
        <div className="goals-reminders-section">
          <div className="goals-widget">
            <h3>Savings Goals</h3>
            {goals.length > 0 ? (
              <div className="goals-list">
                {goals.slice(0, 3).map(goal => {
                  const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
                  return (
                    <div key={goal.id} className="goal-item">
                      <div className="goal-info">
                        <span className="goal-name">{goal.name}</span>
                        <span className="goal-progress">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="goal-bar">
                        <div 
                          className="goal-fill" 
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                      <div className="goal-amounts">
                        <span>{formatCurrency(goal.current_amount)}</span>
                        <span>{formatCurrency(goal.target_amount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-goals">
                <p>No savings goals set yet</p>
                <Link to="/goals" className="create-goal-btn">Create Goal</Link>
              </div>
            )}
          </div>

          <div className="reminders-widget">
            <h3>Upcoming Bills</h3>
            {reminders.length > 0 ? (
              <div className="reminders-list">
                {reminders.map(reminder => (
                  <div key={reminder.id} className="reminder-item">
                    <div className="reminder-icon">
                      <FaCalendarAlt />
                    </div>
                    <div className="reminder-info">
                      <span className="reminder-name">{reminder.name}</span>
                      <span className="reminder-date">{new Date(reminder.due_date).toLocaleDateString()}</span>
                    </div>
                    <div className="reminder-amount">{formatCurrency(reminder.amount)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-reminders">
                <p>No upcoming bills</p>
                <Link to="/reminders" className="create-reminder-btn">Add Bill Reminder</Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions and AI Insights */}
        <div className="bottom-section">
          <div className="transaction-table">
            <div className="table-header">
              <h2>Recent Transactions</h2>
              <Link to="/expenses" className="view-all-btn">View All</Link>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData?.recent_expenses?.slice(0, 5).map(expense => (
                    <tr key={expense.id}>
                      <td>{expense.description || 'No description'}</td>
                      <td>
                        <span className="category-badge" style={{ backgroundColor: expense.color || '#667eea' }}>
                          {resolveExpenseCategoryIcon(expense)}{' '}
                          {expense.category_name || 'Other'}
                        </span>
                      </td>
                      <td>{new Date(expense.date).toLocaleDateString()}</td>
                      <td className={expense.type === 'income' ? 'positive' : 'negative'}>
                        {expense.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(expense.amount))}
                      </td>
                      <td>
                        <span className={`type-badge ${expense.type}`}>
                          {expense.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!dashboardData?.recent_expenses || dashboardData.recent_expenses.length === 0) && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        No recent transactions found. <Link to="/expenses" style={{ color: '#001435' }}>Add your first expense</Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="ai-insights-widget">
            <h3>AI Insights</h3>
            <div className="weekly-digest-section">
              <WeeklyDigest />
            </div>
            <div className="suggestions-section">
              <SuggestionsInbox />
            </div>
          </div>
        </div>

      <style>{`
        .dashboard {
          display: flex;
          min-height: 100vh;
          background: #F4F4F5;
          padding-top: 60px; /* Account for fixed TopNav */
        }

        .dashboard .sidebar {
          top: 60px;
          height: calc(100vh - 60px);
        }

        .dashboard .floating-toggle {
          top: 76px; /* 60px TopNav + 16px */
        }

        .main-content {
          flex: 1;
          padding: 32px;
          margin-left: 280px;
          background: linear-gradient(135deg, #E6F3FF 0%, #B3D9FF 50%, #80BFFF 100%);
          overflow-x: hidden;
          width: calc(100vw - 280px);
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
            width: 100vw;
            padding: 20px;
          }
          }
        }

        .dashboard.sidebar-collapsed .main-content {
          margin-left: 64px;
          width: calc(100vw - 64px);
        }

        .dashboard.sidebar-collapsed .sidebar {
          width: 64px;
        }

        .greeting-block {
          background: linear-gradient(135deg, #001435 0%, #003087 50%, #00A3E0 100%);
          color: white;
          padding: 48px 32px;
          border-radius: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 48px;
          box-shadow: 0 12px 40px rgba(0, 3, 135, 0.3);
          min-height: 140px;
          position: relative;
          overflow: hidden;
        }

        .greeting-block::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%);
          pointer-events: none;
        }

        .greeting-content {
          flex: 1;
          position: relative;
          z-index: 1;
        }

        .greeting-title {
          font-size: 36px;
          font-weight: 700;
          margin: 0 0 12px 0;
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .typing-cursor {
          display: inline-block;
          margin-left: 2px;
          animation: blink-cursor 1s steps(1) infinite;
          opacity: 0.9;
        }

        @keyframes blink-cursor {
          0%, 50% {
            opacity: 1;
          }
          50.01%, 100% {
            opacity: 0;
          }
        }

        .greeting-subtitle {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.95);
          margin: 0;
          line-height: 1.6;
          font-weight: 400;
        }

        .greeting-decoration {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          position: relative;
          z-index: 1;
        }

        .time-indicator {
          font-size: 20px;
          font-weight: 600;
          color: white;
          background: rgba(255, 255, 255, 0.15);
          padding: 12px 20px;
          border-radius: 25px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          padding: 24px 32px;
          background: linear-gradient(135deg, #001435 0%, #003087 50%, #00A3E0 100%);
          border-radius: 16px;
          box-shadow: 0 12px 40px rgba(0, 3, 135, 0.3);
          position: relative;
          overflow: hidden;
        }

        .dashboard-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%);
          pointer-events: none;
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
          position: relative;
          z-index: 1;
        }

        .time-range-selector {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-shrink: 0;
        }

        .search-bar {
          flex: 1;
          min-width: 200px;
        }

        .search-bar input {
          padding: 12px 16px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          width: 100%;
          font-size: 14px;
          background: rgba(173, 216, 230, 0.8);
          backdrop-filter: blur(5px);
          color: #001435;
          font-weight: 500;
        }

        .search-bar input::placeholder {
          color: rgba(0, 20, 53, 0.7);
        }

        .search-bar input:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.5);
          box-shadow: 0 0 0 3px rgba(0, 163, 224, 0.2);
        }
          transition: border-color 0.2s ease;
        }

        .search-bar input:focus {
          outline: none;
          border-color: #003087;
          box-shadow: 0 0 0 3px rgba(0, 48, 135, 0.1);
        }

        .time-range-select, .month-select, .year-select {
          padding: 12px 16px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          background: rgba(173, 216, 230, 0.8);
          backdrop-filter: blur(5px);
          font-size: 14px;
          cursor: pointer;
          transition: border-color 0.2s ease;
          min-width: 120px;
          color: #001435;
          font-weight: 500;
        }

        .time-range-select:focus, .month-select:focus, .year-select:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.5);
          box-shadow: 0 0 0 3px rgba(0, 163, 224, 0.2);
        }

        .kpi-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
          background: linear-gradient(135deg, #001435 0%, #003087 50%, #00A3E0 100%);
          padding: 32px;
          border-radius: 16px;
          box-shadow: 0 12px 40px rgba(0, 3, 135, 0.3);
          position: relative;
          overflow: hidden;
        }

        .kpi-cards::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%);
          pointer-events: none;
        }

        .kpi-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 16px;
          transition: transform 0.2s ease;
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          z-index: 1;
        }

        .kpi-card:hover {
          transform: translateY(-2px);
        }

        .kpi-icon {
          font-size: 24px;
          color: #595298;
        }

        .kpi-content {
          flex: 1;
        }

        .kpi-value {
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }

        .kpi-label {
          font-size: 14px;
          color: #666;
        }

        .kpi-change {
          font-size: 12px;
          margin-top: 4px;
        }

        .kpi-change .positive {
          color: #48c774;
        }

        .kpi-change .negative {
          color: #f14668;
        }

        .kpi-change .neutral {
          color: #666;
        }

        .kpi-sparkline {
          width: 80px;
          margin-left: auto;
        }

        .charts-section {
          margin-bottom: 48px;
          background: linear-gradient(135deg, #001435 0%, #003087 50%, #00A3E0 100%);
          padding: 32px;
          border-radius: 16px;
          box-shadow: 0 12px 40px rgba(0, 3, 135, 0.3);
          position: relative;
          overflow: hidden;
        }

        .charts-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%);
          pointer-events: none;
        }

        .chart-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
          position: relative;
          z-index: 1;
        }

        .primary-chart, .category-chart {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .chart-header h2 {
          font-size: 20px;
          font-weight: bold;
          margin: 0;
          color: #333;
        }

        .chart-controls {
          display: flex;
          gap: 8px;
        }

        .chart-toggle {
          padding: 6px 12px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        }

        .chart-toggle.active {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }

        .chart-container {
          height: 300px;
        }

        .goals-reminders-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 48px;
          background: linear-gradient(135deg, #001435 0%, #003087 50%, #00A3E0 100%);
          padding: 32px;
          border-radius: 16px;
          box-shadow: 0 12px 40px rgba(0, 3, 135, 0.3);
          position: relative;
          overflow: hidden;
        }

        .goals-reminders-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%);
          pointer-events: none;
        }

        .goals-widget, .reminders-widget {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          z-index: 1;
        }

        .goals-widget h3, .reminders-widget h3 {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 16px;
          color: #333;
        }

        .goals-list, .reminders-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .goal-item, .reminder-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .goal-info {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .goal-name {
          font-weight: 500;
        }

        .goal-progress {
          font-size: 12px;
          color: #666;
        }

        .goal-bar {
          width: 100%;
          height: 6px;
          background: #e0e0e0;
          border-radius: 3px;
          margin: 8px 0;
          overflow: hidden;
        }

        .goal-fill {
          height: 100%;
          background: linear-gradient(90deg, #48c774, #667eea);
          border-radius: 3px;
        }

        .goal-amounts {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #666;
        }

        .reminder-icon {
          color: #f14668;
        }

        .reminder-info {
          flex: 1;
        }

        .reminder-name {
          display: block;
          font-weight: 500;
        }

        .reminder-date {
          display: block;
          font-size: 12px;
          color: #666;
        }

        .reminder-amount {
          font-weight: bold;
          color: #f14668;
        }

        .no-goals, .no-reminders {
          text-align: center;
          padding: 20px;
          color: #666;
        }

        .create-goal-btn, .create-reminder-btn {
          display: inline-block;
          margin-top: 8px;
          padding: 8px 16px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-size: 14px;
        }

        .bottom-section {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 24px;
          background: linear-gradient(135deg, #001435 0%, #003087 50%, #00A3E0 100%);
          padding: 32px;
          border-radius: 16px;
          box-shadow: 0 12px 40px rgba(0, 3, 135, 0.3);
          position: relative;
          overflow: hidden;
        }

        .bottom-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%);
          pointer-events: none;
        }

        .transaction-table {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          z-index: 1;
        }

        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .table-header h2 {
          font-size: 20px;
          font-weight: bold;
          margin: 0;
          color: #333;
        }

        .view-all-btn {
          color: #667eea;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        th {
          font-weight: bold;
          color: #333;
        }

        .category-badge {
          padding: 4px 8px;
          border-radius: 12px;
          color: white;
          font-size: 12px;
          font-weight: 500;
        }

        .type-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .type-badge.income {
          background: #48c774;
          color: white;
        }

        .type-badge.expense {
          background: #f14668;
          color: white;
        }

        .positive {
          color: #48c774;
          font-weight: bold;
        }

        .negative {
          color: #f14668;
          font-weight: bold;
        }

        .ai-insights-widget {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          z-index: 1;
        }

        .ai-insights-widget h3 {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 16px;
          color: #333;
        }

        .insights-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .insight-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }

        .insight-icon {
          font-size: 18px;
        }

        .insight-text {
          flex: 1;
          font-size: 14px;
          line-height: 1.4;
        }

        .no-insights {
          text-align: center;
          padding: 20px;
          color: #666;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }

        .status-badge.success {
          background: #48c774;
          color: white;
        }

        .status-badge.failed {
          background: #f14668;
          color: white;
        }

        .credit-card {
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 16px;
          padding: 24px;
          color: white;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }

        .credit-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: shimmer 3s infinite;
        }

        @keyframes shimmer {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .card-type {
          font-size: 16px;
          font-weight: bold;
        }

        .card-network {
          font-size: 24px;
        }

        .card-balance {
          margin-bottom: 24px;
        }

        .balance-label {
          font-size: 14px;
          opacity: 0.8;
        }

        .balance-amount {
          font-size: 28px;
          font-weight: bold;
        }

        .card-details {
          margin-bottom: 24px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: end;
        }

        .cardholder-name {
          font-size: 16px;
          font-weight: bold;
        }

        .card-period {
          font-size: 12px;
          opacity: 0.8;
        }

        .quick-actions h3 {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 16px;
          color: white;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .action-btn span {
          font-size: 14px;
        }

        @media (max-width: 1200px) {
          .utility-panel {
            display: none;
          }
          .main-content {
            margin-right: 0;
          }
        }

        @media (max-width: 900px) {
          .header-controls {
            flex-wrap: wrap;
            gap: 12px;
          }
          .time-range-selector {
            flex: 1;
            min-width: 200px;
            justify-content: flex-start;
          }
          .search-bar {
            flex: 1;
            min-width: 200px;
          }
          .time-range-select, .month-select, .year-select {
            min-width: 110px;
          }
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
            padding: 16px;
          }
          .kpi-cards {
            flex-direction: column;
          }
          .dashboard-header {
            flex-direction: column;
            gap: 16px;
            text-align: center;
            padding: 20px 20px;
          }
          .header-controls {
            flex-direction: column;
            gap: 12px;
            width: 100%;
          }
          .time-range-selector {
            justify-content: center;
            flex-wrap: wrap;
          }
          .search-bar {
            width: 100%;
            min-width: unset;
          }
          .greeting-block {
            flex-direction: column;
            text-align: center;
            padding: 32px 20px;
            min-height: 120px;
            margin-bottom: 32px;
          }
          .greeting-decoration {
            align-items: center;
            margin-top: 20px;
          }
          .greeting-title {
            font-size: 28px;
          }
          .greeting-subtitle {
            font-size: 16px;
          }
          .bottom-section {
            padding: 20px;
            grid-template-columns: 1fr;
            gap: 20px;
            margin-bottom: 32px;
          }
          .charts-section {
            padding: 20px;
            margin-bottom: 32px;
          }
          .goals-reminders-section {
            padding: 20px;
            margin-bottom: 32px;
          }
        }

        .dashboard.sidebar-collapsed .main-content {
          margin-left: 64px;
          width: calc(100vw - 64px);
        }

        .dashboard.sidebar-collapsed .sidebar {
          width: 64px;
        }
        .weekly-digest-section {
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .weekly-digest {
          margin-bottom: 16px;
        }

        .digest-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .digest-header h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          color: #333;
        }

        .digest-range {
          font-size: 12px;
          color: #666;
        }

        .digest-headline {
          font-size: 16px;
          font-weight: 500;
          color: #333;
          margin-bottom: 12px;
          line-height: 1.4;
        }

        .digest-bullets {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .digest-bullet {
          display: flex;
          align-items: flex-start;
          margin-bottom: 8px;
          font-size: 14px;
          color: #555;
          line-height: 1.4;
        }

        .bullet-icon {
          margin-right: 8px;
          font-weight: bold;
          min-width: 16px;
        }

        .digest-increase .bullet-icon {
          color: #22c55e;
        }

        .digest-decrease .bullet-icon {
          color: #ef4444;
        }

        .digest-alert .bullet-icon {
          color: #f59e0b;
        }

        .digest-neutral .bullet-icon {
          color: #6b7280;
        }

        .suggestions-inbox {
          margin-top: 16px;
        }

        .suggestions-inbox h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #333;
        }

        .suggestions-empty {
          text-align: center;
          padding: 20px;
          color: #666;
          font-style: italic;
        }

        .suggestion-card {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .suggestion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .suggestion-action {
          font-weight: 600;
          color: #333;
          text-transform: capitalize;
        }

        .suggestion-confidence {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.1);
        }

        .suggestion-category {
          font-size: 14px;
          color: #666;
          margin-bottom: 4px;
        }

        .suggestion-change, .suggestion-rationale {
          font-size: 14px;
          color: #555;
          margin-bottom: 4px;
        }

        .suggestion-rationale {
          font-style: italic;
        }

        .suggestion-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .btn-accept, .btn-reject {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-accept {
          background: #22c55e;
          color: white;
        }

        .btn-accept:hover {
          background: #16a34a;
        }

        .btn-reject {
          background: #ef4444;
          color: white;
        }

        .btn-reject:hover {
          background: #dc2626;
        }

      `}</style>
    </div>
  );
};

export default Dashboard;
