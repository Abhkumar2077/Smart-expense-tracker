// frontend/src/pages/Reports.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { expenseAPI } from '../services/api';
import { useUpload } from '../context/UploadContext';
import { useNotification } from '../context/NotificationContext';
import { normalizeCategoryIcon } from '../utils/categoryIcon';
import {
    PieChart, Pie, Cell, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, Sector, Line,
    ComposedChart
} from 'recharts';
import { 
    FaDownload, FaCalendarAlt, FaCloudUploadAlt, 
    FaChartPie, FaChartBar, FaChartLine, FaMoneyBillWave,
    FaArrowUp, FaArrowDown, FaExchangeAlt, FaCalendarWeek,
    FaCalendarDay, FaCalendarCheck
} from 'react-icons/fa';

const Reports = () => {
    const [summary, setSummary] = useState(null);
    const [insights, setInsights] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);
    const [chartType, setChartType] = useState('pie');
    const [dataType, setDataType] = useState('both');
    const [trendType, setTrendType] = useState('monthly');
    const [dailyData, setDailyData] = useState([]);
    const [weeklyData, setWeeklyData] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [expenseData, setExpenseData] = useState([]);
    const [incomeData, setIncomeData] = useState([]);
    const [combinedData, setCombinedData] = useState([]);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [totalIncome, setTotalIncome] = useState(0);
    const [netSavings, setNetSavings] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { uploadedData } = useUpload();
    const { showNotification } = useNotification();

    const months = useMemo(() => [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ], []);

    const years = useMemo(() => Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i), []);

    const EXPENSE_COLORS = useMemo(() => ['#f14668', '#ff6b6b', '#ff8787', '#ffa8a8', '#ffc9c9'], []);
    const INCOME_COLORS = useMemo(() => ['#48c774', '#51cf66', '#69db7e', '#8ce99a', '#b2f2bb'], []);
    const COMBINED_COLORS = useMemo(() => ['#667eea', '#764ba2', '#48c774', '#f14668', '#ff9f1c'], []);

    const fetchReportData = useCallback(async () => {
        try {
            setLoading(true);
            
            // Get summary from API
            const summaryRes = await expenseAPI.getSummary(selectedMonth, selectedYear);
            
            setSummary(summaryRes.data);
            
            // Get insights
            const insightsRes = await expenseAPI.getInsights();
            setInsights(insightsRes.data);
            
        } catch (error) {
            console.error('❌ Error fetching report data:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        fetchReportData();
        setCurrentPage(1); // Reset to first page when month/year changes
    }, [selectedMonth, selectedYear, fetchReportData]);

    const processCategoryData = useCallback(() => {
        if (!summary?.category_summary) return;
        
        const expenses = [];
        const incomes = [];
        const combined = [];
        
        summary.category_summary.forEach((cat, index) => {
            const expenseAmount = parseFloat(cat.total_expense || cat.total_amount || 0);
            const incomeAmount = parseFloat(cat.total_income || 0);
            
            if (expenseAmount > 0 || incomeAmount > 0) {
                combined.push({
                    name: cat.name || 'Other',
                    expense: expenseAmount,
                    income: incomeAmount,
                    total: expenseAmount + incomeAmount,
                    color: cat.color || COMBINED_COLORS[index % COMBINED_COLORS.length],
                    count: parseInt(cat.transaction_count) || 0,
                    icon: cat.icon || '\uD83D\uDCCC'
                });
            }
            
            if (expenseAmount > 0) {
                expenses.push({
                    name: cat.name || 'Other',
                    value: expenseAmount,
                    color: cat.color || EXPENSE_COLORS[index % EXPENSE_COLORS.length],
                    count: parseInt(cat.transaction_count) || 0,
                    icon: cat.icon || '\uD83D\uDCCC',
                    type: 'expense'
                });
            }
            
            if (incomeAmount > 0) {
                incomes.push({
                    name: cat.name || 'Other',
                    value: incomeAmount,
                    color: cat.color || INCOME_COLORS[index % INCOME_COLORS.length],
                    count: parseInt(cat.transaction_count) || 0,
                    icon: cat.icon || '\uD83D\uDCCC',
                    type: 'income'
                });
            }
        });
        
        setExpenseData(expenses);
        setIncomeData(incomes);
        setCombinedData(combined);
        
        const totalExp = expenses.reduce((sum, item) => sum + item.value, 0);
        const totalInc = incomes.reduce((sum, item) => sum + item.value, 0);
        setTotalExpenses(totalExp);
        setTotalIncome(totalInc);
        setNetSavings(totalInc - totalExp);
    }, [summary, COMBINED_COLORS, EXPENSE_COLORS, INCOME_COLORS]);

    const getWeekNumber = (date) => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    const processDailyData = useCallback(() => {
        if (!summary?.daily_summary || summary.daily_summary.length === 0) {
            setDailyData([]);
            setWeeklyData([]);
            return;
        }

        
        // Process daily data
        const daily = summary.daily_summary.map(day => ({
            date: day.date,
            day: new Date(day.date).getDate(),
            dayName: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
            expenses: parseFloat(day.total_expenses || 0),
            income: parseFloat(day.total_income || 0),
            net: parseFloat(day.total_income || 0) - parseFloat(day.total_expenses || 0),
            count: day.transaction_count || 0
        }));
        
        setDailyData(daily);

        // Process weekly data
        const weeks = {};
        daily.forEach(day => {
            const date = new Date(day.date);
            const weekNum = getWeekNumber(date);
            const weekKey = `${date.getFullYear()}-W${weekNum}`;
            
            if (!weeks[weekKey]) {
                weeks[weekKey] = {
                    week: weekNum,
                    startDate: new Date(date),
                    endDate: new Date(date),
                    expenses: 0,
                    income: 0,
                    count: 0
                };
            }
            
            weeks[weekKey].expenses += day.expenses;
            weeks[weekKey].income += day.income;
            weeks[weekKey].count += day.count;
            
            if (date < weeks[weekKey].startDate) weeks[weekKey].startDate = new Date(date);
            if (date > weeks[weekKey].endDate) weeks[weekKey].endDate = new Date(date);
        });

        const weekly = Object.values(weeks).map(week => ({
            ...week,
            label: `Week ${week.week}`,
            range: `${week.startDate.getDate()} ${months[week.startDate.getMonth()].substring(0,3)} - ${week.endDate.getDate()} ${months[week.endDate.getMonth()].substring(0,3)}`,
            net: week.income - week.expenses
        })).sort((a, b) => a.week - b.week);

        setWeeklyData(weekly);
    }, [summary, months]);

    useEffect(() => {
        if (summary?.category_summary) {
            processCategoryData();
        }
        if (summary?.daily_summary) {
            processDailyData();
        }
    }, [summary, processCategoryData, processDailyData]);

    const handleExportReport = () => {
        if (combinedData.length === 0 && dailyData.length === 0) {
            showNotification('No data to export', 'info');
            return;
        }

        let csv = '';
        
        // Category breakdown
        csv += 'CATEGORY BREAKDOWN\n';
        csv += 'Category,Transactions,Expenses,Income,Net,Daily Avg\n';
        combinedData.forEach(item => {
            const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
            const dailyAvg = item.expense / daysInMonth;
            csv += `${item.name},${item.count},${item.expense.toFixed(2)},${item.income.toFixed(2)},${(item.income - item.expense).toFixed(2)},${dailyAvg.toFixed(2)}\n`;
        });
        
        csv += '\n';
        
        // Daily breakdown
        csv += 'DAILY BREAKDOWN\n';
        csv += 'Date,Day,Expenses,Income,Net,Transactions\n';
        dailyData.forEach(day => {
            csv += `${day.date},${day.dayName},${day.expenses.toFixed(2)},${day.income.toFixed(2)},${day.net.toFixed(2)},${day.count}\n`;
        });
        
        csv += '\n';
        
        // Weekly breakdown
        csv += 'WEEKLY BREAKDOWN\n';
        csv += 'Week,Date Range,Expenses,Income,Net,Transactions\n';
        weeklyData.forEach(week => {
            csv += `${week.label},${week.range},${week.expenses.toFixed(2)},${week.income.toFixed(2)},${week.net.toFixed(2)},${week.count}\n`;
        });
        
        csv += '\n';
        csv += `SUMMARY\n`;
        csv += `Total Expenses,${totalExpenses.toFixed(2)}\n`;
        csv += `Total Income,${totalIncome.toFixed(2)}\n`;
        csv += `Net Savings,${netSavings.toFixed(2)}\n`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `detailed-report-${selectedMonth}-${selectedYear}.csv`);
        document.body.appendChild(link);
        link.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        
        showNotification('✅ Detailed report exported successfully!', 'success');
    };

    const renderActiveShape = (props) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
        
        return (
            <g>
                <text x={cx} y={cy - 25} dy={8} textAnchor="middle" fill={fill} style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    {payload.name}
                </text>
                <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#333" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    ₹{value.toLocaleString()}
                </text>
                <text x={cx} y={cy + 25} dy={8} textAnchor="middle" fill="#666" style={{ fontSize: '12px' }}>
                    {`${(percent * 100).toFixed(1)}%`}
                </text>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius + 10}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                />
                <Sector
                    cx={cx}
                    cy={cy}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    innerRadius={outerRadius + 12}
                    outerRadius={outerRadius + 15}
                    fill={fill}
                />
            </g>
        );
    };

    const onPieEnter = (_, index) => {
        setActiveIndex(index);
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={{
                    background: 'white',
                    padding: '15px 20px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '10px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    maxWidth: '300px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        {data.icon && <span style={{ fontSize: '24px' }}>{data.icon}</span>}
                        <span style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '16px' }}>
                            {data.name || data.dayName || data.label}
                        </span>
                    </div>
                    
                    {data.date && (
                        <div style={{ color: '#666', marginBottom: '5px', fontSize: '13px' }}>
                            {data.date} ({data.dayName})
                        </div>
                    )}
                    
                    {data.range && (
                        <div style={{ color: '#666', marginBottom: '5px', fontSize: '13px' }}>
                            {data.range}
                        </div>
                    )}
                    
                    <div style={{ display: 'grid', gap: '5px' }}>
                        {(data.expenses !== undefined) && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Expenses:</span>
                                <span style={{ color: '#f14668', fontWeight: 'bold' }}>₹{data.expenses.toLocaleString()}</span>
                            </div>
                        )}
                        {(data.income !== undefined) && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Income:</span>
                                <span style={{ color: '#48c774', fontWeight: 'bold' }}>₹{data.income.toLocaleString()}</span>
                            </div>
                        )}
                        {(data.net !== undefined) && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '5px' }}>
                                <span>Net:</span>
                                <span style={{ 
                                    color: data.net >= 0 ? '#48c774' : '#f14668',
                                    fontWeight: 'bold' 
                                }}>
                                    ₹{Math.abs(data.net).toLocaleString()}
                                </span>
                            </div>
                        )}
                        {(data.value !== undefined) && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Amount:</span>
                                <span style={{ color: data.type === 'income' ? '#48c774' : '#f14668', fontWeight: 'bold' }}>
                                    ₹{data.value.toLocaleString()}
                                </span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', color: '#666' }}>
                            <span>Transactions:</span>
                            <span>{data.count || 0}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderTrendChart = () => {
        if (trendType === 'monthly' && summary?.monthly_summary) {
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={summary.monthly_summary}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tickFormatter={(month) => months[month - 1].substring(0, 3)} />
                        <YAxis yAxisId="left" tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="total_expenses" fill="#f14668" name="Expenses" barSize={20} />
                        <Bar yAxisId="left" dataKey="total_income" fill="#48c774" name="Income" barSize={20} />
                        <Line yAxisId="right" type="monotone" dataKey="total_expenses" stroke="#f14668" strokeWidth={2} dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="total_income" stroke="#48c774" strokeWidth={2} dot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            );
        }

        if (trendType === 'weekly' && weeklyData.length > 0) {
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis yAxisId="left" tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="expenses" fill="#f14668" name="Expenses" />
                        <Bar yAxisId="left" dataKey="income" fill="#48c774" name="Income" />
                        <Line yAxisId="right" type="monotone" dataKey="net" stroke="#667eea" name="Net" strokeWidth={2} />
                    </ComposedChart>
                </ResponsiveContainer>
            );
        }

        if (trendType === 'daily' && dailyData.length > 0) {
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis yAxisId="left" tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="expenses" fill="#f14668" name="Expenses" />
                        <Bar yAxisId="left" dataKey="income" fill="#48c774" name="Income" />
                        <Line yAxisId="right" type="monotone" dataKey="net" stroke="#667eea" name="Net" strokeWidth={2} />
                    </ComposedChart>
                </ResponsiveContainer>
            );
        }

        return (
            <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
                <FaCalendarAlt size={50} style={{ color: '#ccc', marginBottom: '20px' }} />
                <h4>No trend data available</h4>
                <p>Add more transactions to see daily and weekly trends</p>
            </div>
        );
    };

    const renderDailyTable = () => {
        if (dailyData.length === 0) return null;

        return (
            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <h3 className="card-title">
                        <FaCalendarDay /> Daily Breakdown
                    </h3>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Day</th>
                                <th>Expenses</th>
                                <th>Income</th>
                                <th>Net</th>
                                <th>Transactions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dailyData.map(day => (
                                <tr key={day.date}>
                                    <td>{day.date}</td>
                                    <td>{day.dayName}</td>
                                    <td style={{ color: '#f14668' }}>₹{day.expenses.toLocaleString()}</td>
                                    <td style={{ color: '#48c774' }}>₹{day.income.toLocaleString()}</td>
                                    <td style={{ 
                                        color: day.net >= 0 ? '#48c774' : '#f14668',
                                        fontWeight: 'bold'
                                    }}>
                                        ₹{Math.abs(day.net).toLocaleString()}
                                    </td>
                                    <td>{day.count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderWeeklyTable = () => {
        if (weeklyData.length === 0) return null;

        return (
            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <h3 className="card-title">
                        <FaCalendarWeek /> Weekly Breakdown
                    </h3>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Week</th>
                                <th>Date Range</th>
                                <th>Expenses</th>
                                <th>Income</th>
                                <th>Net</th>
                                <th>Transactions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {weeklyData.map(week => (
                                <tr key={week.week}>
                                    <td>{week.label}</td>
                                    <td>{week.range}</td>
                                    <td style={{ color: '#f14668' }}>₹{week.expenses.toLocaleString()}</td>
                                    <td style={{ color: '#48c774' }}>₹{week.income.toLocaleString()}</td>
                                    <td style={{ 
                                        color: week.net >= 0 ? '#48c774' : '#f14668',
                                        fontWeight: 'bold'
                                    }}>
                                        ₹{Math.abs(week.net).toLocaleString()}
                                    </td>
                                    <td>{week.count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const getCurrentData = () => {
        if (dataType === 'expense') return expenseData;
        if (dataType === 'income') return incomeData;
        return combinedData;
    };

    const renderPieChart = () => {
        const currentData = getCurrentData();
        
        if (currentData.length === 0) {
            return (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '80px 20px',
                    background: '#f8f9fa',
                    borderRadius: '12px',
                    color: '#666'
                }}>
                    <FaMoneyBillWave size={50} style={{ color: '#ccc', marginBottom: '20px' }} />
                    <h4>No Data Available</h4>
                    <p style={{ marginTop: '10px', color: '#999' }}>
                        No {dataType === 'both' ? 'transactions' : dataType} found for {months[selectedMonth - 1]} {selectedYear}
                    </p>
                </div>
            );
        }

        const chartHeight = dataType === 'both' ? 500 : 450;

        return (
            <ResponsiveContainer width="100%" height={chartHeight}>
                <PieChart>
                    <Pie
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        data={currentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={dataType === 'both' ? 120 : 100}
                        outerRadius={dataType === 'both' ? 160 : 140}
                        dataKey={dataType === 'both' ? 'total' : 'value'}
                        onMouseEnter={onPieEnter}
                        labelLine={false}
                        label={({ name, percent }) => 
                            percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''
                        }
                    >
                        {currentData.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={entry.color}
                                stroke="#fff"
                                strokeWidth={2}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                        layout="vertical" 
                        align="right" 
                        verticalAlign="middle"
                        wrapperStyle={{
                            fontSize: '12px',
                            paddingLeft: '20px',
                            maxHeight: '400px',
                            overflowY: 'auto'
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        );
    };

    const renderBarChart = () => {
        if (dataType === 'both') {
            return (
                <ResponsiveContainer width="100%" height={500}>
                    <BarChart data={combinedData} layout="vertical" margin={{ left: 120, right: 30, top: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                        <YAxis type="category" dataKey="name" width={100} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="expense" name="Expenses" stackId="a" fill="#f14668" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="income" name="Income" stackId="a" fill="#48c774" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            );
        }

        const currentData = getCurrentData();
        
        return (
            <ResponsiveContainer width="100%" height={450}>
                <BarChart data={currentData} layout="vertical" margin={{ left: 100, right: 30, top: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                        dataKey="value" 
                        name={dataType === 'expense' ? 'Expenses' : 'Income'} 
                        radius={[0, 4, 4, 0]}
                    >
                        {currentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        );
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                        <div className="loading-spinner" style={{
                            border: '4px solid #f3f3f3',
                            borderTop: '4px solid #667eea',
                            borderRadius: '50%',
                            width: '50px',
                            height: '50px',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 20px'
                        }}></div>
                        <p>Loading financial reports...</p>
                    </div>
        );
    }

    return (
        <div style={{
            background: 'linear-gradient(135deg, #E0F2FE 0%, #B3E5FC 100%)',
            minHeight: '100vh',
            padding: '20px'
        }}>
            {/* Header */}
            <div style={{
                    background: 'linear-gradient(135deg, #003087 0%, #001435 100%)',
                    color: 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: 'var(--spacing-2xl)',
                    boxShadow: '0 4px 20px rgba(0, 3, 135, 0.3)'
                }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 'var(--spacing-lg)'
                }}>
                    <div>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xs)', fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
                            <FaChartPie style={{ color: 'var(--color-primary)' }} />
                            Financial Reports
                        </h2>
                        {uploadedData && (
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '4px 12px',
                                background: '#48c77420',
                                color: '#48c774',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}>
                                <FaCloudUploadAlt />
                                Including CSV data
                            </span>
                        )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <FaCalendarAlt color="#666" />
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="form-control"
                                style={{
                                    width: '120px',
                                    border: '2px solid rgba(0, 163, 224, 0.2)',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    background: 'white',
                                    color: '#003087'
                                }}
                            >
                                {months.map((month, index) => (
                                    <option key={index} value={index + 1}>{month}</option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="form-control"
                                style={{
                                    width: '100px',
                                    border: '2px solid rgba(0, 163, 224, 0.2)',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    background: 'white',
                                    color: '#003087'
                                }}
                            >
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                        
                        <button
                            onClick={handleExportReport}
                            className="btn btn-primary"
                            style={{
                                background: 'linear-gradient(135deg, #003087, #00A3E0)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                padding: '10px 20px',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(0, 48, 135, 0.3)'
                            }}
                            onMouseOver={(e) => e.target.style.background = 'linear-gradient(135deg, #001435, #003087)'}
                            onMouseOut={(e) => e.target.style.background = 'linear-gradient(135deg, #003087, #00A3E0)'}
                        >
                            <FaDownload /> Export Detailed Report
                        </button>
                    </div>
                </div>
                </div>

                {/* Summary Cards */}
                <div className="stats-grid">
                    <div className="stat-card" style={{
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                        borderLeft: '4px solid #f14668',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #f14668, #ff6b6b)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '18px'
                            }}>
                                <FaArrowUp />
                            </div>
                            <div>
                                <div className="stat-label">Total Expenses</div>
                                <div style={{
                                    width: '100%',
                                    height: '4px',
                                    background: '#f0f0f0',
                                    borderRadius: '2px',
                                    marginTop: '5px'
                                }}>
                                    <div style={{
                                        width: `${totalExpenses > 0 ? Math.min((totalExpenses / (totalExpenses + totalIncome)) * 100, 100) : 0}%`,
                                        height: '100%',
                                        background: 'linear-gradient(135deg, #f14668, #ff6b6b)',
                                        borderRadius: '2px'
                                    }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="stat-value" style={{ color: '#f14668', fontSize: '24px', fontWeight: 'bold' }}>
                            ₹{totalExpenses.toLocaleString()}
                        </div>
                        <div className="stat-label">{months[selectedMonth - 1]} {selectedYear}</div>
                    </div>

                    <div className="stat-card" style={{
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                        borderLeft: '4px solid #48c774',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #48c774, #51cf66)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '18px'
                            }}>
                                <FaArrowDown />
                            </div>
                            <div>
                                <div className="stat-label">Total Income</div>
                                <div style={{
                                    width: '100%',
                                    height: '4px',
                                    background: '#f0f0f0',
                                    borderRadius: '2px',
                                    marginTop: '5px'
                                }}>
                                    <div style={{
                                        width: `${totalIncome > 0 ? Math.min((totalIncome / (totalExpenses + totalIncome)) * 100, 100) : 0}%`,
                                        height: '100%',
                                        background: 'linear-gradient(135deg, #48c774, #51cf66)',
                                        borderRadius: '2px'
                                    }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="stat-value" style={{ color: '#48c774', fontSize: '24px', fontWeight: 'bold' }}>
                            ₹{totalIncome.toLocaleString()}
                        </div>
                        <div className="stat-label">{months[selectedMonth - 1]} {selectedYear}</div>
                    </div>

                    <div className="stat-card" style={{
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                        borderLeft: `4px solid ${netSavings >= 0 ? '#48c774' : '#f14668'}`,
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${netSavings >= 0 ? '#48c774' : '#f14668'}, ${netSavings >= 0 ? '#51cf66' : '#ff6b6b'})`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '18px'
                            }}>
                                <FaExchangeAlt />
                            </div>
                            <div>
                                <div className="stat-label">Net Savings</div>
                                <div style={{
                                    width: '100%',
                                    height: '4px',
                                    background: '#f0f0f0',
                                    borderRadius: '2px',
                                    marginTop: '5px'
                                }}>
                                    <div style={{
                                        width: `${netSavings > 0 ? Math.min((Math.abs(netSavings) / (totalExpenses + totalIncome)) * 100, 100) : 0}%`,
                                        height: '100%',
                                        background: `linear-gradient(135deg, ${netSavings >= 0 ? '#48c774' : '#f14668'}, ${netSavings >= 0 ? '#51cf66' : '#ff6b6b'})`,
                                        borderRadius: '2px'
                                    }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="stat-value" style={{
                            color: netSavings >= 0 ? '#48c774' : '#f14668',
                            fontSize: '24px',
                            fontWeight: 'bold'
                        }}>
                            ₹{Math.abs(netSavings).toLocaleString()}
                        </div>
                        <div className="stat-label">{netSavings >= 0 ? 'Surplus' : 'Deficit'}</div>
                    </div>

                    <div className="stat-card" style={{
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                        borderLeft: '4px solid #003087',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #003087, #00A3E0)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '18px'
                            }}>
                                <FaMoneyBillWave />
                            </div>
                            <div>
                                <div className="stat-label">Transactions</div>
                                <div style={{
                                    width: '100%',
                                    height: '4px',
                                    background: '#f0f0f0',
                                    borderRadius: '2px',
                                    marginTop: '5px'
                                }}>
                                    <div style={{
                                        width: `${combinedData.reduce((sum, item) => sum + item.count, 0) > 0 ? Math.min((combinedData.reduce((sum, item) => sum + item.count, 0) / 100) * 100, 100) : 0}%`,
                                        height: '100%',
                                        background: 'linear-gradient(135deg, #003087, #00A3E0)',
                                        borderRadius: '2px'
                                    }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="stat-value" style={{ color: '#003087', fontSize: '24px', fontWeight: 'bold' }}>
                            {combinedData.reduce((sum, item) => sum + item.count, 0)}
                        </div>
                        <div className="stat-label">This Month</div>
                    </div>
                </div>

                {/* Chart Controls */}
                <div className="card" style={{
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    border: 'none'
                }}>
                    <div className="card-header">
                        <h3 className="card-title">Visualization Options</h3>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            {/* Data Type Selector */}
                            <div style={{ display: 'flex', gap: '5px', background: '#f8f9fa', padding: '4px', borderRadius: '8px' }}>
                                <button
                                    className={`btn ${dataType === 'both' ? 'btn-primary' : ''}`}
                                    onClick={() => setDataType('both')}
                                    style={{
                                        padding: '6px 12px',
                                        fontSize: '13px',
                                        background: dataType === 'both' ? 'linear-gradient(135deg, #003087, #00A3E0)' : 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        color: dataType === 'both' ? 'white' : '#003087',
                                        transition: 'all 0.3s ease',
                                        boxShadow: dataType === 'both' ? '0 4px 15px rgba(0, 48, 135, 0.3)' : 'none'
                                    }}
                                >
                                    <FaExchangeAlt /> Both
                                </button>
                                <button
                                    className={`btn ${dataType === 'expense' ? 'btn-primary' : ''}`}
                                    onClick={() => setDataType('expense')}
                                    style={{
                                        padding: '6px 12px',
                                        fontSize: '13px',
                                        background: dataType === 'expense' ? 'linear-gradient(135deg, #f14668, #ff6b6b)' : 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        color: dataType === 'expense' ? 'white' : '#f14668',
                                        transition: 'all 0.3s ease',
                                        boxShadow: dataType === 'expense' ? '0 4px 15px rgba(241, 70, 104, 0.3)' : 'none'
                                    }}
                                >
                                    <FaArrowUp /> Expenses
                                </button>
                                <button
                                    className={`btn ${dataType === 'income' ? 'btn-primary' : ''}`}
                                    onClick={() => setDataType('income')}
                                    style={{
                                        padding: '6px 12px',
                                        fontSize: '13px',
                                        background: dataType === 'income' ? 'linear-gradient(135deg, #48c774, #51cf66)' : 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        color: dataType === 'income' ? 'white' : '#48c774',
                                        transition: 'all 0.3s ease',
                                        boxShadow: dataType === 'income' ? '0 4px 15px rgba(72, 199, 116, 0.3)' : 'none'
                                    }}
                                >
                                    <FaArrowDown /> Income
                                </button>
                            </div>

                            {/* Chart Type Selector */}
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button
                                    className={`btn ${chartType === 'pie' ? 'btn-primary' : ''}`}
                                    onClick={() => setChartType('pie')}
                                    style={{
                                        background: chartType === 'pie' ? 'linear-gradient(135deg, #003087, #00A3E0)' : 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        color: chartType === 'pie' ? 'white' : '#003087',
                                        transition: 'all 0.3s ease',
                                        boxShadow: chartType === 'pie' ? '0 4px 15px rgba(0, 48, 135, 0.3)' : 'none'
                                    }}
                                >
                                    <FaChartPie /> Pie
                                </button>
                                <button
                                    className={`btn ${chartType === 'bar' ? 'btn-primary' : ''}`}
                                    onClick={() => setChartType('bar')}
                                    style={{
                                        background: chartType === 'bar' ? 'linear-gradient(135deg, #003087, #00A3E0)' : 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        color: chartType === 'bar' ? 'white' : '#003087',
                                        transition: 'all 0.3s ease',
                                        boxShadow: chartType === 'bar' ? '0 4px 15px rgba(0, 48, 135, 0.3)' : 'none'
                                    }}
                                >
                                    <FaChartBar /> Bar
                                </button>
                                <button
                                    className={`btn ${chartType === 'trend' ? 'btn-primary' : ''}`}
                                    onClick={() => setChartType('trend')}
                                    style={{
                                        background: chartType === 'trend' ? 'linear-gradient(135deg, #003087, #00A3E0)' : 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        color: chartType === 'trend' ? 'white' : '#003087',
                                        transition: 'all 0.3s ease',
                                        boxShadow: chartType === 'trend' ? '0 4px 15px rgba(0, 48, 135, 0.3)' : 'none'
                                    }}
                                >
                                    <FaChartLine /> Trend
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ padding: '20px', minHeight: '500px' }}>
                        {chartType === 'pie' && renderPieChart()}
                        {chartType === 'bar' && renderBarChart()}
                        {chartType === 'trend' && (
                            <div>
                                {/* Trend Type Selector */}
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '10px', 
                                    marginBottom: '20px',
                                    justifyContent: 'center'
                                }}>
                                    <button
                                        className={`btn ${trendType === 'monthly' ? 'btn-primary' : ''}`}
                                        onClick={() => setTrendType('monthly')}
                                        style={{
                                            background: trendType === 'monthly' ? 'linear-gradient(135deg, #003087, #00A3E0)' : 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            color: trendType === 'monthly' ? 'white' : '#003087',
                                            transition: 'all 0.3s ease',
                                            boxShadow: trendType === 'monthly' ? '0 4px 15px rgba(0, 48, 135, 0.3)' : 'none'
                                        }}
                                    >
                                        <FaCalendarCheck /> Monthly
                                    </button>
                                    <button
                                        className={`btn ${trendType === 'weekly' ? 'btn-primary' : ''}`}
                                        onClick={() => setTrendType('weekly')}
                                        style={{
                                            background: trendType === 'weekly' ? 'linear-gradient(135deg, #003087, #00A3E0)' : 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            color: trendType === 'weekly' ? 'white' : '#003087',
                                            transition: 'all 0.3s ease',
                                            boxShadow: trendType === 'weekly' ? '0 4px 15px rgba(0, 48, 135, 0.3)' : 'none'
                                        }}
                                    >
                                        <FaCalendarWeek /> Weekly
                                    </button>
                                    <button
                                        className={`btn ${trendType === 'daily' ? 'btn-primary' : ''}`}
                                        onClick={() => setTrendType('daily')}
                                        style={{
                                            background: trendType === 'daily' ? 'linear-gradient(135deg, #003087, #00A3E0)' : 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            color: trendType === 'daily' ? 'white' : '#003087',
                                            transition: 'all 0.3s ease',
                                            boxShadow: trendType === 'daily' ? '0 4px 15px rgba(0, 48, 135, 0.3)' : 'none'
                                        }}
                                    >
                                        <FaCalendarDay /> Daily
                                    </button>
                                </div>
                                
                                {renderTrendChart()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Daily and Weekly Tables */}
                {chartType === 'trend' && (
                    <>
                        {trendType === 'daily' && renderDailyTable()}
                        {trendType === 'weekly' && renderWeeklyTable()}
                    </>
                )}

                {/* Category Breakdown Table */}
                <div className="card" style={{
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    border: 'none'
                }}>
                    <div className="card-header">
                        <h3 className="card-title">Category Breakdown</h3>
                        {uploadedData && (
                            <span style={{
                                padding: '5px 12px',
                                background: '#667eea20',
                                color: '#667eea',
                                borderRadius: '20px',
                                fontSize: '13px'
                            }}>
                                Includes CSV Data
                            </span>
                        )}
                    </div>

                    {combinedData.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            color: '#666'
                        }}>
                            <FaCloudUploadAlt size={50} style={{ color: '#ccc', marginBottom: '20px' }} />
                            <h3>No Data Available</h3>
                            <p>No transactions found for {months[selectedMonth - 1]} {selectedYear}</p>
                        </div>
                    ) : (
                        <>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Category</th>
                                            <th>Transactions</th>
                                            <th>Expenses</th>
                                            <th>Income</th>
                                            <th>Net</th>
                                            <th>Daily Avg</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {combinedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(item => {
                                            const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
                                            const dailyExpense = item.expense / daysInMonth;
                                            const net = item.income - item.expense;

                                            return (
                                                <tr key={item.name}>
                                                    <td>
                                                        <span className="category-badge" style={{
                                                            backgroundColor: item.color,
                                                            color: 'white',
                                                            padding: '5px 12px',
                                                            borderRadius: '20px',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '5px'
                                                        }}>
                                                            <span className="category-icon">{normalizeCategoryIcon(item.icon, item.name)}</span>
                                                            {item.name}
                                                        </span>
                                                    </td>
                                                    <td><strong>{item.count}</strong></td>
                                                    <td style={{ color: '#f14668', fontWeight: 'bold' }}>
                                                        ₹{item.expense.toLocaleString()}
                                                    </td>
                                                    <td style={{ color: '#48c774', fontWeight: 'bold' }}>
                                                        ₹{item.income.toLocaleString()}
                                                    </td>
                                                    <td style={{
                                                        color: net >= 0 ? '#48c774' : '#f14668',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        ₹{net.toLocaleString()}
                                                    </td>
                                                    <td>₹{dailyExpense.toFixed(0)}/day</td>
                                                    <td>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5px'
                                                        }}>
                                                            <div style={{
                                                                width: '10px',
                                                                height: '10px',
                                                                borderRadius: '50%',
                                                                backgroundColor: net > 0 ? '#48c774' : net < 0 ? '#f14668' : '#ffa500'
                                                            }}></div>
                                                            <span style={{ fontSize: '12px', color: '#666' }}>
                                                                {net > 0 ? 'Profit' : net < 0 ? 'Loss' : 'Break-even'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{
                                            background: 'linear-gradient(135deg, #00308710, #00A3E010)',
                                            fontWeight: 'bold',
                                            borderTop: '2px solid #003087'
                                        }}>
                                            <td><strong>TOTAL</strong></td>
                                            <td><strong>{combinedData.reduce((sum, item) => sum + item.count, 0)}</strong></td>
                                            <td style={{ color: '#f14668' }}>
                                                <strong>₹{totalExpenses.toLocaleString()}</strong>
                                            </td>
                                            <td style={{ color: '#48c774' }}>
                                                <strong>₹{totalIncome.toLocaleString()}</strong>
                                            </td>
                                            <td style={{
                                                color: netSavings >= 0 ? '#48c774' : '#f14668'
                                            }}>
                                                <strong>₹{Math.abs(netSavings).toLocaleString()}</strong>
                                            </td>
                                            <td>
                                                <strong>
                                                    ₹{(totalExpenses / new Date(selectedYear, selectedMonth, 0).getDate()).toFixed(0)}/day
                                                </strong>
                                            </td>
                                            <td>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px'
                                                }}>
                                                    <div style={{
                                                        width: '10px',
                                                        height: '10px',
                                                        borderRadius: '50%',
                                                        backgroundColor: netSavings > 0 ? '#48c774' : netSavings < 0 ? '#f14668' : '#ffa500'
                                                    }}></div>
                                                    <span style={{ fontSize: '12px' }}>
                                                        {netSavings > 0 ? 'Surplus' : netSavings < 0 ? 'Deficit' : 'Balanced'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Pagination */}
                            {combinedData.length > itemsPerPage && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '20px',
                                    borderTop: '1px solid #e0e0e0'
                                }}>
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        style={{
                                            padding: '8px 12px',
                                            background: currentPage === 1 ? '#f0f0f0' : 'linear-gradient(135deg, #003087, #00A3E0)',
                                            color: currentPage === 1 ? '#666' : 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        Previous
                                    </button>

                                    <span style={{ color: '#666', fontWeight: 'bold' }}>
                                        Page {currentPage} of {Math.ceil(combinedData.length / itemsPerPage)}
                                    </span>

                                    <button
                                        onClick={() => setCurrentPage(Math.min(Math.ceil(combinedData.length / itemsPerPage), currentPage + 1))}
                                        disabled={currentPage === Math.ceil(combinedData.length / itemsPerPage)}
                                        style={{
                                            padding: '8px 12px',
                                            background: currentPage === Math.ceil(combinedData.length / itemsPerPage) ? '#f0f0f0' : 'linear-gradient(135deg, #003087, #00A3E0)',
                                            color: currentPage === Math.ceil(combinedData.length / itemsPerPage) ? '#666' : 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: currentPage === Math.ceil(combinedData.length / itemsPerPage) ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* AI Insights */}
                {insights?.suggestions?.length > 0 && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title"><FaChartLine /> AI Financial Insights</h3>
                        </div>
                        <div style={{ padding: '20px' }}>
                            {insights.suggestions.map((suggestion, index) => (
                                <div key={index} style={{
                                    padding: '15px',
                                    marginBottom: '10px',
                                    background: 'linear-gradient(135deg, #00308715, #00A3E015)',
                                    borderRadius: '10px',
                                    borderLeft: '4px solid #003087'
                                }}>
                                    {suggestion}
                                </div>
                            ))}
                            
                            {netSavings > 0 && (
                                <div style={{
                                    marginTop: '15px',
                                    padding: '15px',
                                    background: '#48c77415',
                                    borderRadius: '10px',
                                    borderLeft: '4px solid #48c774',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <FaMoneyBillWave color="#48c774" size={20} />
                                    <span>
                                        <strong>Great job!</strong> You saved ₹{netSavings.toLocaleString()} this month 
                                        ({((netSavings / totalIncome) * 100).toFixed(1)}% of income)
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}} />
        </div>
    );
};

export default Reports;
