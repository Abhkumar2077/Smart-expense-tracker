// frontend/src/components/AIDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaRobot, FaLightbulb, FaChartLine, FaExclamationTriangle, 
    FaPiggyBank, FaCalendarAlt, FaArrowUp, FaArrowDown,
    FaCheckCircle, FaInfoCircle, FaBell, FaChartPie
} from 'react-icons/fa';

const AIDashboard = () => {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        fetchAIInsights();
        
        // Refresh when data changes
        const handleDataChange = () => {
            fetchAIInsights();
        };
        
        window.addEventListener('upload-data-changed', handleDataChange);
        window.addEventListener('upload-data-cleared', handleDataChange);
        window.addEventListener('storage', handleDataChange);
        
        return () => {
            window.removeEventListener('upload-data-changed', handleDataChange);
            window.removeEventListener('upload-data-cleared', handleDataChange);
            window.removeEventListener('storage', handleDataChange);
        };
    }, []);

    const fetchAIInsights = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('🤖 Fetching AI insights...');
            const res = await axios.get('/api/ai/insights');
            
            console.log('✅ AI insights received:', res.data);
            setInsights(res.data);
            
        } catch (error) {
            console.error('❌ Error fetching AI insights:', error);
            setError('Failed to load AI insights');
        } finally {
            setLoading(false);
        }
    };

    const getImpactColor = (impact) => {
        switch(impact) {
            case 'high': return '#f14668';
            case 'medium': return '#ff9f1c';
            case 'low': return '#48c774';
            case 'positive': return '#48c774';
            default: return '#667eea';
        }
    };

    const getImpactIcon = (impact) => {
        switch(impact) {
            case 'high': return <FaExclamationTriangle />;
            case 'medium': return <FaInfoCircle />;
            case 'low': return <FaCheckCircle />;
            case 'positive': return <FaCheckCircle />;
            default: return <FaLightbulb />;
        }
    };

    const renderPatterns = () => {
        if (!insights?.patterns || insights.patterns.length === 0) return null;
        
        return (
            <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                    <h3 className="card-title">
                        <FaChartLine style={{ marginRight: '10px', color: '#667eea' }} />
                        📊 Spending Patterns
                    </h3>
                </div>
                <div style={{ padding: '20px' }}>
                    {insights.patterns.map((pattern, index) => (
                        <div key={index} style={{
                            padding: '15px',
                            marginBottom: '10px',
                            background: '#f8f9fa',
                            borderRadius: '8px',
                            borderLeft: `4px solid ${getImpactColor(pattern.impact)}`,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '15px'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: `${getImpactColor(pattern.impact)}20`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: getImpactColor(pattern.impact),
                                fontSize: '20px'
                            }}>
                                {pattern.type === 'income_pattern' ? '💰' : 
                                 pattern.type === 'category_dominance' ? '🎯' : 
                                 pattern.type === 'weekend_spending' ? '🎉' : '📊'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '5px'
                                }}>
                                    <h4 style={{ margin: 0, color: '#2c3e50' }}>{pattern.title}</h4>
                                    <span style={{
                                        padding: '2px 10px',
                                        background: `${getImpactColor(pattern.impact)}20`,
                                        color: getImpactColor(pattern.impact),
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}>
                                        {pattern.impact} impact
                                    </span>
                                </div>
                                <p style={{ color: '#666', marginBottom: '8px' }}>{pattern.description}</p>
                                <div style={{
                                    background: 'white',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #e0e0e0',
                                    fontSize: '14px',
                                    color: '#2c3e50'
                                }}>
                                    <strong>💡 Suggestion:</strong> {pattern.suggestion}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderAlerts = () => {
        if (!insights?.alerts || insights.alerts.length === 0) return null;
        
        return (
            <div className="card" style={{ marginBottom: '20px', border: '2px solid #f1466840' }}>
                <div className="card-header">
                    <h3 className="card-title" style={{ color: '#f14668' }}>
                        <FaBell style={{ marginRight: '10px', color: '#f14668' }} />
                        ⚠️ Active Alerts
                    </h3>
                </div>
                <div style={{ padding: '20px' }}>
                    {insights.alerts.map((alert, index) => (
                        <div key={index} style={{
                            padding: '15px',
                            marginBottom: '10px',
                            background: '#f1466810',
                            borderRadius: '8px',
                            border: '1px solid #f1466830',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '15px'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: '#f1466820',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#f14668',
                                fontSize: '20px'
                            }}>
                                <FaExclamationTriangle />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '5px'
                                }}>
                                    <h4 style={{ margin: 0, color: '#f14668' }}>{alert.title}</h4>
                                    <span style={{
                                        padding: '2px 10px',
                                        background: '#f1466820',
                                        color: '#f14668',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase'
                                    }}>
                                        {alert.severity || 'high'} priority
                                    </span>
                                </div>
                                <p style={{ color: '#666', marginBottom: '8px' }}>{alert.message}</p>
                                {alert.suggestion && (
                                    <div style={{
                                        background: 'white',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: '1px solid #f1466830',
                                        fontSize: '14px',
                                        color: '#2c3e50'
                                    }}>
                                        <strong>💡 Suggestion:</strong> {alert.suggestion}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderRecommendations = () => {
        if (!insights?.recommendations || insights.recommendations.length === 0) return null;
        
        return (
            <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                    <h3 className="card-title">
                        <FaLightbulb style={{ marginRight: '10px', color: '#ff9f1c' }} />
                        💡 Smart Recommendations
                    </h3>
                </div>
                <div style={{ padding: '20px' }}>
                    {insights.recommendations.map((rec, index) => (
                        <div key={index} style={{
                            padding: '15px',
                            marginBottom: '10px',
                            background: '#fff3cd',
                            borderRadius: '8px',
                            borderLeft: '4px solid #ff9f1c',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '15px'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: '#ff9f1c20',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ff9f1c',
                                fontSize: '20px'
                            }}>
                                {rec.type === 'savings_rate' ? '💰' : 
                                 rec.type === 'good_savings' ? '🌟' : 
                                 rec.type === 'budget_overshoot' ? '⚠️' : '💡'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>{rec.title}</h4>
                                <p style={{ color: '#666', marginBottom: '8px' }}>{rec.description}</p>
                                <div style={{
                                    background: 'white',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}>
                                    <strong>✨ Action:</strong> {rec.suggestion}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderSavings = () => {
        if (!insights?.savings || insights.savings.length === 0) return null;
        
        return (
            <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                    <h3 className="card-title">
                        <FaPiggyBank style={{ marginRight: '10px', color: '#48c774' }} />
                        🐷 Savings Opportunities
                    </h3>
                </div>
                <div style={{ padding: '20px' }}>
                    {insights.savings.map((saving, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '15px',
                            marginBottom: '10px',
                            background: '#48c77410',
                            borderRadius: '8px',
                            border: '1px solid #48c77430'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: saving.color ? `${saving.color}20` : '#48c77420',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px'
                                }}>
                                    {saving.icon || '💰'}
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, color: '#2c3e50' }}>{saving.category}</h4>
                                    <p style={{ margin: '5px 0 0', color: '#666', fontSize: '14px' }}>
                                        Current: {saving.current} | Potential: {saving.potential}
                                    </p>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{
                                    padding: '4px 12px',
                                    background: saving.impact === 'high' ? '#f1466820' : '#48c77420',
                                    color: saving.impact === 'high' ? '#f14668' : '#48c774',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    {saving.impact || 'medium'} impact
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderForecast = () => {
        if (!insights?.forecast) return null;
        
        const { forecast } = insights;
        
        return (
            <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                    <h3 className="card-title">
                        <FaCalendarAlt style={{ marginRight: '10px', color: '#667eea' }} />
                        🔮 Spending Forecast
                    </h3>
                </div>
                <div style={{ padding: '30px', textAlign: 'center' }}>
                    <div style={{
                        background: `linear-gradient(135deg, ${forecast.projected_expense > forecast.projected_income ? '#f1466820' : '#48c77420'})`,
                        padding: '30px',
                        borderRadius: '15px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
                            <div>
                                <div style={{ fontSize: '14px', color: '#666' }}>Projected Income</div>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#48c774' }}>
                                    ₹{forecast.projected_monthly_income?.toLocaleString() || 0}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', color: '#666' }}>Projected Expenses</div>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f14668' }}>
                                    ₹{forecast.projected_monthly_expense?.toLocaleString() || 0}
                                </div>
                            </div>
                        </div>
                        
                        {forecast.projected_savings !== undefined && (
                            <div style={{
                                marginTop: '20px',
                                padding: '15px',
                                background: forecast.projected_savings >= 0 ? '#48c77410' : '#f1466810',
                                borderRadius: '8px'
                            }}>
                                <div style={{ fontSize: '16px', color: '#666' }}>Projected Savings</div>
                                <div style={{ 
                                    fontSize: '24px', 
                                    fontWeight: 'bold',
                                    color: forecast.projected_savings >= 0 ? '#48c774' : '#f14668'
                                }}>
                                    ₹{Math.abs(forecast.projected_savings).toLocaleString()}
                                    {forecast.projected_savings < 0 && ' deficit'}
                                </div>
                            </div>
                        )}
                        
                        <p style={{ marginTop: '20px', color: '#666' }}>
                            {forecast.message}
                        </p>
                        {forecast.suggestions && (
                            <div style={{
                                marginTop: '15px',
                                padding: '10px',
                                background: '#667eea10',
                                borderRadius: '8px',
                                fontSize: '14px'
                            }}>
                                💡 {forecast.suggestions}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderAnomalies = () => {
        if (!insights?.anomalies || insights.anomalies.length === 0) return null;
        
        return (
            <div className="card" style={{ marginBottom: '20px', border: '2px solid #ff9f1c40' }}>
                <div className="card-header">
                    <h3 className="card-title" style={{ color: '#ff9f1c' }}>
                        <FaExclamationTriangle style={{ marginRight: '10px', color: '#ff9f1c' }} />
                        🔍 Unusual Transactions Detected
                    </h3>
                </div>
                <div style={{ padding: '20px' }}>
                    {insights.anomalies.map((anomaly, index) => (
                        <div key={index} style={{
                            padding: '15px',
                            marginBottom: '10px',
                            background: '#ff9f1c10',
                            borderRadius: '8px',
                            border: '1px solid #ff9f1c30'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 5px 0', color: '#ff9f1c' }}>{anomaly.title}</h4>
                                    <p style={{ color: '#666' }}>{anomaly.description}</p>
                                    {anomaly.suggestion && (
                                        <p style={{ marginTop: '10px', fontSize: '14px' }}>
                                            <strong>💡</strong> {anomaly.suggestion}
                                        </p>
                                    )}
                                </div>
                                <span style={{
                                    background: anomaly.impact === 'high' ? '#f14668' : '#ff9f1c',
                                    color: 'white',
                                    padding: '4px 12px',
                                    borderRadius: '15px',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    {anomaly.impact}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <FaRobot size={50} style={{ color: '#667eea', animation: 'pulse 2s infinite' }} />
                <p style={{ marginTop: '20px', color: '#666' }}>AI is analyzing your finances...</p>
                <style>{`
                    @keyframes pulse {
                        0% { opacity: 1; }
                        50% { opacity: 0.5; }
                        100% { opacity: 1; }
                    }
                `}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: '#f14668' }}>
                <FaExclamationTriangle size={50} />
                <p style={{ marginTop: '20px' }}>{error}</p>
                <button 
                    onClick={fetchAIInsights}
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

    if (!insights || (!insights.patterns?.length && !insights.alerts?.length && 
        !insights.recommendations?.length && !insights.savings?.length && 
        !insights.anomalies?.length && !insights.forecast)) {
        return (
            <div style={{ 
                textAlign: 'center', 
                padding: '40px',
                background: '#f8f9fa',
                borderRadius: '10px',
                border: '1px solid #e0e0e0'
            }}>
                <FaRobot size={50} style={{ color: '#ccc' }} />
                <h3 style={{ margin: '20px 0', color: '#666' }}>No AI Insights Available</h3>
                <p style={{ color: '#999' }}>
                    Add more transactions to get personalized financial insights!
                </p>
            </div>
        );
    }

    const hasPatterns = insights.patterns?.length > 0;
    const hasAlerts = insights.alerts?.length > 0;
    const hasRecommendations = insights.recommendations?.length > 0;
    const hasSavings = insights.savings?.length > 0;
    const hasAnomalies = insights.anomalies?.length > 0;
    const hasForecast = insights.forecast;

    return (
        <div className="ai-dashboard">
            {/* AI Header */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '15px',
                padding: '25px',
                color: 'white',
                marginBottom: '25px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <FaRobot size={50} />
                    <div>
                        <h2 style={{ margin: 0, fontSize: '24px' }}>AI Financial Assistant</h2>
                        <p style={{ margin: '5px 0 0', opacity: 0.9 }}>
                            Intelligent insights powered by machine learning
                        </p>
                    </div>
                </div>
                <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px'
                }}>
                    Confidence: {insights.aiConfidence || 'medium'}
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={{ 
                display: 'flex', 
                gap: '10px', 
                marginBottom: '25px', 
                flexWrap: 'wrap',
                borderBottom: '1px solid #e0e0e0',
                paddingBottom: '15px'
            }}>
                <button
                    onClick={() => setActiveTab('all')}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '25px',
                        border: activeTab === 'all' ? 'none' : '2px solid #ddd',
                        background: activeTab === 'all' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'white',
                        color: activeTab === 'all' ? 'white' : '#666',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    All Insights ({Object.values(insights).filter(v => Array.isArray(v) ? v.length : v).length})
                </button>
                
                {hasAlerts && (
                    <button
                        onClick={() => setActiveTab('alerts')}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '25px',
                            border: activeTab === 'alerts' ? 'none' : '2px solid #f14668',
                            background: activeTab === 'alerts' ? '#f14668' : 'white',
                            color: activeTab === 'alerts' ? 'white' : '#f14668',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        ⚠️ Alerts ({insights.alerts.length})
                    </button>
                )}
                
                {hasPatterns && (
                    <button
                        onClick={() => setActiveTab('patterns')}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '25px',
                            border: activeTab === 'patterns' ? 'none' : '2px solid #667eea',
                            background: activeTab === 'patterns' ? '#667eea' : 'white',
                            color: activeTab === 'patterns' ? 'white' : '#667eea',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        📊 Patterns ({insights.patterns.length})
                    </button>
                )}
                
                {hasRecommendations && (
                    <button
                        onClick={() => setActiveTab('recommendations')}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '25px',
                            border: activeTab === 'recommendations' ? 'none' : '2px solid #ff9f1c',
                            background: activeTab === 'recommendations' ? '#ff9f1c' : 'white',
                            color: activeTab === 'recommendations' ? 'white' : '#ff9f1c',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        💡 Tips ({insights.recommendations.length})
                    </button>
                )}
                
                {hasSavings && (
                    <button
                        onClick={() => setActiveTab('savings')}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '25px',
                            border: activeTab === 'savings' ? 'none' : '2px solid #48c774',
                            background: activeTab === 'savings' ? '#48c774' : 'white',
                            color: activeTab === 'savings' ? 'white' : '#48c774',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        🐷 Savings ({insights.savings.length})
                    </button>
                )}
                
                {hasAnomalies && (
                    <button
                        onClick={() => setActiveTab('anomalies')}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '25px',
                            border: activeTab === 'anomalies' ? 'none' : '2px solid #ff9f1c',
                            background: activeTab === 'anomalies' ? '#ff9f1c' : 'white',
                            color: activeTab === 'anomalies' ? 'white' : '#ff9f1c',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        🔍 Unusual ({insights.anomalies.length})
                    </button>
                )}
            </div>

            {/* Content based on active tab */}
            <div style={{ minHeight: '300px' }}>
                {(activeTab === 'all' || activeTab === 'alerts') && renderAlerts()}
                {(activeTab === 'all' || activeTab === 'patterns') && renderPatterns()}
                {(activeTab === 'all' || activeTab === 'recommendations') && renderRecommendations()}
                {(activeTab === 'all' || activeTab === 'savings') && renderSavings()}
                {(activeTab === 'all' || activeTab === 'anomalies') && renderAnomalies()}
                {(activeTab === 'all' || activeTab === 'forecast') && renderForecast()}
            </div>

            {/* Refresh Button */}
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                    onClick={fetchAIInsights}
                    style={{
                        padding: '8px 20px',
                        background: 'white',
                        border: '2px solid #667eea',
                        color: '#667eea',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}
                >
                    🔄 Refresh AI Insights
                </button>
            </div>
        </div>
    );
};

export default AIDashboard;