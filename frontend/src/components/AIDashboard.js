// frontend/src/components/AIDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaRobot, FaLightbulb, FaChartLine, FaExclamationTriangle, 
    FaPiggyBank, FaCalendarAlt,
    FaBell,
    FaBrain, FaFire, FaMedal, FaRocket, FaSyncAlt
} from 'react-icons/fa';

const AIDashboard = () => {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [geminiInsights, setGeminiInsights] = useState(null);
    const [geminiLoading, setGeminiLoading] = useState(false);
    const [summaryStats, setSummaryStats] = useState({
        patterns: 0,
        alerts: 0,
        recommendations: 0,
        savings: 0,
        anomalies: 0
    });

    // Remove auto-fetch. Only fetch on button click.
    useEffect(() => {
        // No auto-fetch on mount
        return () => {};
    }, []);

    useEffect(() => {
        if (insights) {
            setSummaryStats({
                patterns: insights.patterns?.length || 0,
                alerts: insights.alerts?.length || 0,
                recommendations: insights.recommendations?.length || 0,
                savings: insights.savings?.length || 0,
                anomalies: insights.anomalies?.length || 0
            });
        }
    }, [insights]);

    const fetchAIInsights = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const res = await axios.get('/api/ai/insights');
            
            setInsights(res.data);
            
            // Check if Gemini is available and enhanced
            if (res.data.geminiEnhanced) {
            }
            
        } catch (error) {
            console.error('❌ Error fetching AI insights:', error);
            setError('Failed to load AI insights');
        } finally {
            setLoading(false);
        }
    };

    const fetchGeminiInsights = async () => {
        try {
            setGeminiLoading(true);

            const res = await axios.get('/api/ai/gemini-insights');

            if (res.data.success) {
                setGeminiInsights(res.data);
            } else {
                setGeminiInsights({ error: res.data.message });
            }

        } catch (error) {
            console.error('❌ Error fetching Gemini insights:', error);
            setGeminiInsights({ error: 'Failed to load Gemini insights' });
        } finally {
            setGeminiLoading(false);
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

    const getConfidenceBadge = (confidence) => {
        if (!confidence) return null;
        
        const colors = {
            high: '#48c774',
            medium: '#ff9f1c',
            low: '#f14668'
        };
        
        return (
            <span style={{
                padding: '2px 8px',
                background: `${colors[confidence] || '#667eea'}20`,
                color: colors[confidence] || '#667eea',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 'bold',
                marginLeft: '10px'
            }}>
                {confidence} confidence
            </span>
        );
    };

    const renderPatterns = () => {
        if (!insights?.patterns || insights.patterns.length === 0) return null;
        
        return (
            <div className="card insight-section" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                    <h3 className="card-title">
                        <FaChartLine style={{ marginRight: '10px', color: '#667eea' }} />
                        Spending Patterns
                        <span style={{
                            marginLeft: '10px',
                            padding: '2px 8px',
                            background: '#667eea20',
                            color: '#667eea',
                            borderRadius: '12px',
                            fontSize: '12px'
                        }}>
                            {insights.patterns.length} detected
                        </span>
                    </h3>
                </div>
                <div style={{ padding: '20px' }}>
                    {insights.patterns.map((pattern, index) => (
                        <div 
                            key={index} 
                            className="insight-card"
                            style={{
                                padding: '15px',
                                marginBottom: '10px',
                                background: '#f8f9fa',
                                borderRadius: '8px',
                                borderLeft: `4px solid ${getImpactColor(pattern.impact)}`,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '15px',
                                animation: 'slideIn 0.3s ease-out',
                                animationFillMode: 'both',
                                animationDelay: `${index * 0.1}s`
                            }}
                        >
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
                                    marginBottom: '5px',
                                    flexWrap: 'wrap',
                                    gap: '10px'
                                }}>
                                    <h4 style={{ margin: 0, color: '#2c3e50' }}>{pattern.title}</h4>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {pattern.confidence && getConfidenceBadge(pattern.confidence)}
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
            <div className="card insight-section" style={{ marginBottom: '20px', border: '2px solid #f1466840' }}>
                <div className="card-header">
                    <h3 className="card-title" style={{ color: '#f14668' }}>
                        <FaBell style={{ marginRight: '10px', color: '#f14668' }} />
                        Active Alerts
                        <span style={{
                            marginLeft: '10px',
                            padding: '2px 8px',
                            background: '#f1466820',
                            color: '#f14668',
                            borderRadius: '12px',
                            fontSize: '12px'
                        }}>
                            {insights.alerts.length} urgent
                        </span>
                    </h3>
                </div>
                <div style={{ padding: '20px' }}>
                    {insights.alerts.map((alert, index) => (
                        <div 
                            key={index} 
                            className="insight-card"
                            style={{
                                padding: '15px',
                                marginBottom: '10px',
                                background: '#f1466810',
                                borderRadius: '8px',
                                border: '1px solid #f1466830',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '15px',
                                animation: 'slideIn 0.3s ease-out',
                                animationFillMode: 'both',
                                animationDelay: `${index * 0.1}s`
                            }}
                        >
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
                                    marginBottom: '5px',
                                    flexWrap: 'wrap',
                                    gap: '10px'
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
            <div className="card insight-section" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                    <h3 className="card-title">
                        <FaLightbulb style={{ marginRight: '10px', color: '#ff9f1c' }} />
                        Smart Recommendations
                        <span style={{
                            marginLeft: '10px',
                            padding: '2px 8px',
                            background: '#ff9f1c20',
                            color: '#ff9f1c',
                            borderRadius: '12px',
                            fontSize: '12px'
                        }}>
                            {insights.recommendations.length} tips
                        </span>
                    </h3>
                </div>
                <div style={{ padding: '20px' }}>
                    {insights.recommendations.map((rec, index) => (
                        <div 
                            key={index} 
                            className="insight-card"
                            style={{
                                padding: '15px',
                                marginBottom: '10px',
                                background: '#fff3cd',
                                borderRadius: '8px',
                                borderLeft: '4px solid #ff9f1c',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '15px',
                                animation: 'slideIn 0.3s ease-out',
                                animationFillMode: 'both',
                                animationDelay: `${index * 0.1}s`
                            }}
                        >
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
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '8px',
                                    flexWrap: 'wrap',
                                    marginBottom: '5px'
                                }}>
                                    <h4 style={{ margin: 0, color: '#2c3e50' }}>{rec.title}</h4>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {rec.priority && (
                                            <span style={{
                                                padding: '2px 10px',
                                                background: rec.priority === 'high' ? '#f1466820' : rec.priority === 'medium' ? '#ff9f1c20' : '#48c77420',
                                                color: rec.priority === 'high' ? '#f14668' : rec.priority === 'medium' ? '#ff9f1c' : '#48c774',
                                                borderRadius: '12px',
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase'
                                            }}>
                                                {rec.priority} priority
                                            </span>
                                        )}
                                        {getConfidenceBadge(rec.confidence)}
                                    </div>
                                </div>
                                <p style={{ color: '#666', marginBottom: '8px' }}>{rec.description}</p>
                                <div style={{
                                    background: 'white',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}>
                                    <strong>✨ Action:</strong> {rec.suggestion}
                                </div>
                                {rec.expected_outcome && (
                                    <div style={{
                                        marginTop: '8px',
                                        background: '#fff',
                                        padding: '8px 10px',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        border: '1px solid #ffd98a',
                                        color: '#5a4a00'
                                    }}>
                                        <strong>🎯 Expected Outcome:</strong> {rec.expected_outcome}
                                    </div>
                                )}
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
            <div className="card insight-section" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                    <h3 className="card-title">
                        <FaPiggyBank style={{ marginRight: '10px', color: '#48c774' }} />
                        Savings Opportunities
                        <span style={{
                            marginLeft: '10px',
                            padding: '2px 8px',
                            background: '#48c77420',
                            color: '#48c774',
                            borderRadius: '12px',
                            fontSize: '12px'
                        }}>
                            Save ₹{(insights.savings.reduce((sum, s) => {
                                const amount = parseInt(s.potential?.replace(/[^0-9]/g, '') || 0);
                                return sum + amount;
                            }, 0)).toLocaleString()}
                        </span>
                    </h3>
                </div>
                <div style={{ padding: '20px' }}>
                    {insights.savings.map((saving, index) => (
                        <div 
                            key={index} 
                            className="insight-card"
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '15px',
                                marginBottom: '10px',
                                background: '#48c77410',
                                borderRadius: '8px',
                                border: '1px solid #48c77430',
                                animation: 'slideIn 0.3s ease-out',
                                animationFillMode: 'both',
                                animationDelay: `${index * 0.1}s`
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
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
                            <div style={{ textAlign: 'right', minWidth: '100px' }}>
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
                                {saving.yearly_savings && (
                                    <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
                                        {saving.yearly_savings}
                                    </div>
                                )}
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
        const isPositive = forecast.projected_savings >= 0;
        
        return (
            <div className="card insight-section" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                    <h3 className="card-title">
                        <FaCalendarAlt style={{ marginRight: '10px', color: '#667eea' }} />
                        Spending Forecast
                        {forecast.confidence && getConfidenceBadge(forecast.confidence)}
                    </h3>
                </div>
                <div style={{ padding: '30px', textAlign: 'center' }}>
                    <div style={{
                        background: `linear-gradient(135deg, ${isPositive ? '#48c77410' : '#f1466810'})`,
                        padding: '30px',
                        borderRadius: '15px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Animated background effect */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: `radial-gradient(circle at 30% 50%, ${isPositive ? '#48c77420' : '#f1466820'} 0%, transparent 50%)`,
                            animation: 'pulse 3s ease-in-out infinite'
                        }} />
                        
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px', flexWrap: 'wrap', gap: '20px' }}>
                                <div>
                                    <div style={{ fontSize: '14px', color: '#666' }}>Projected Income</div>
                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#48c774' }}>
                                        ₹{forecast.projected_monthly_income?.toLocaleString() || 0}
                                    </div>
                                    {forecast.income_message && (
                                        <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                                            {forecast.income_message}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div style={{ fontSize: '14px', color: '#666' }}>Projected Expenses</div>
                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f14668' }}>
                                        ₹{forecast.projected_monthly_expense?.toLocaleString() || 0}
                                    </div>
                                </div>
                            </div>
                            
                            {forecast.projected_savings !== undefined && (
                                <div style={{
                                    marginTop: '20px',
                                    padding: '20px',
                                    background: isPositive ? '#48c77410' : '#f1466810',
                                    borderRadius: '12px',
                                    border: `1px solid ${isPositive ? '#48c774' : '#f14668'}`
                                }}>
                                    <div style={{ fontSize: '16px', color: '#666' }}>Projected Net</div>
                                    <div style={{ 
                                        fontSize: '36px', 
                                        fontWeight: 'bold',
                                        color: isPositive ? '#48c774' : '#f14668'
                                    }}>
                                        {isPositive ? '+' : '-'} ₹{Math.abs(forecast.projected_savings).toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                                        {isPositive ? 'Surplus' : 'Deficit'} projected
                                    </div>
                                </div>
                            )}
                            
                            <p style={{ marginTop: '20px', color: '#666', fontSize: '16px' }}>
                                {forecast.message}
                            </p>
                            
                            {forecast.suggestions && (
                                <div style={{
                                    marginTop: '20px',
                                    padding: '15px',
                                    background: '#667eea10',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    borderLeft: '4px solid #667eea',
                                    textAlign: 'left'
                                }}>
                                    <FaRocket style={{ marginRight: '8px', color: '#667eea' }} />
                                    {forecast.suggestions}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderAnomalies = () => {
        if (!insights?.anomalies || insights.anomalies.length === 0) return null;
        
        return (
            <div className="card insight-section" style={{ marginBottom: '20px', border: '2px solid #ff9f1c40' }}>
                <div className="card-header">
                    <h3 className="card-title" style={{ color: '#ff9f1c' }}>
                        <FaExclamationTriangle style={{ marginRight: '10px', color: '#ff9f1c' }} />
                        Unusual Transactions Detected
                        <span style={{
                            marginLeft: '10px',
                            padding: '2px 8px',
                            background: '#ff9f1c20',
                            color: '#ff9f1c',
                            borderRadius: '12px',
                            fontSize: '12px'
                        }}>
                            {insights.anomalies.length} found
                        </span>
                    </h3>
                </div>
                <div style={{ padding: '20px' }}>
                    {insights.anomalies.map((anomaly, index) => (
                        <div 
                            key={index} 
                            className="insight-card"
                            style={{
                                padding: '15px',
                                marginBottom: '10px',
                                background: '#ff9f1c10',
                                borderRadius: '8px',
                                border: '1px solid #ff9f1c30',
                                animation: 'slideIn 0.3s ease-out',
                                animationFillMode: 'both',
                                animationDelay: `${index * 0.1}s`
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                        <FaFire style={{ color: '#ff9f1c' }} />
                                        <h4 style={{ margin: 0, color: '#ff9f1c' }}>{anomaly.title}</h4>
                                    </div>
                                    <p style={{ color: '#666', marginBottom: '5px' }}>{anomaly.description}</p>
                                    {anomaly.date && (
                                        <p style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>
                                            Date: {new Date(anomaly.date).toLocaleDateString()}
                                        </p>
                                    )}
                                    {anomaly.suggestion && (
                                        <p style={{ marginTop: '10px', fontSize: '14px', background: 'white', padding: '8px', borderRadius: '4px' }}>
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
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap'
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

    const renderGeminiInsights = () => {
        if (geminiLoading) {
            return (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #4285f420',
                        borderTop: '4px solid #4285f4',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto'
                    }} />
                    <p style={{ marginTop: '20px', color: '#666' }}>Gemini AI is analyzing your finances...</p>
                </div>
            );
        }

        if (!geminiInsights || geminiInsights.error) {
            return (
                <div className="card insight-section" style={{ marginBottom: '20px', border: '2px solid #4285f440' }}>
                    <div className="card-header">
                        <h3 className="card-title" style={{ color: '#4285f4' }}>
                            <FaRobot style={{ marginRight: '10px', color: '#4285f4' }} />
                            Gemini AI Insights
                        </h3>
                    </div>
                    <div style={{ padding: '30px', textAlign: 'center' }}>
                        <FaRobot size={40} style={{ color: '#4285f4', marginBottom: '20px' }} />
                        <p style={{ color: '#666', marginBottom: '20px' }}>
                            {geminiInsights?.error === 'API quota exceeded' 
                                ? '🚫 Gemini API quota exceeded. The free tier has been used up. Please try again later or consider upgrading to a paid plan.'
                                : geminiInsights?.error === 'API key invalid'
                                ? '🔑 Invalid Gemini API key. Please check your API key configuration.'
                                : 'Advanced AI insights are not available. Please check your Gemini API configuration.'
                            }
                        </p>
                        <button
                            onClick={fetchGeminiInsights}
                            style={{
                                padding: '10px 20px',
                                background: '#4285f4',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            🔄 Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="card insight-section" style={{ marginBottom: '20px', border: '2px solid #4285f440' }}>
                <div className="card-header">
                    <h3 className="card-title" style={{ color: '#4285f4' }}>
                        <FaRobot style={{ marginRight: '10px', color: '#4285f4' }} />
                        Gemini AI Advanced Insights
                        <span style={{
                            marginLeft: '10px',
                            padding: '2px 8px',
                            background: '#4285f4',
                            color: 'white',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}>
                            {geminiInsights.confidence || 'AI'}
                        </span>
                    </h3>
                </div>
                <div style={{ padding: '20px' }}>
                    {geminiInsights.geminiInsights && geminiInsights.geminiInsights.length > 0 ? (
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {geminiInsights.geminiInsights.map((insight, index) => (
                                <div key={index} className="insight-card" style={{
                                    padding: '20px',
                                    background: 'linear-gradient(135deg, #4285f410, #34a85310)',
                                    borderRadius: '12px',
                                    border: '1px solid #4285f420',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '4px',
                                        height: '100%',
                                        background: insight.type === 'pattern' ? '#4285f4' :
                                                   insight.type === 'saving' ? '#34a853' :
                                                   insight.type === 'alert' ? '#ea4335' : '#ff9f1c'
                                    }} />

                                    <div style={{ marginLeft: '20px' }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            marginBottom: '10px'
                                        }}>
                                            <span style={{
                                                fontSize: '18px',
                                                fontWeight: 'bold',
                                                color: insight.type === 'pattern' ? '#4285f4' :
                                                       insight.type === 'saving' ? '#34a853' :
                                                       insight.type === 'alert' ? '#ea4335' : '#ff9f1c'
                                            }}>
                                                {insight.type === 'pattern' ? '📊' :
                                                 insight.type === 'saving' ? '💰' :
                                                 insight.type === 'alert' ? '⚠️' : '💡'}
                                            </span>
                                            <h4 style={{
                                                margin: 0,
                                                color: '#333',
                                                fontSize: '16px',
                                                fontWeight: 'bold'
                                            }}>
                                                {insight.title}
                                            </h4>
                                            <span style={{
                                                padding: '2px 8px',
                                                background: insight.impact === 'high' ? '#ea433520' :
                                                           insight.impact === 'medium' ? '#ff9f1c20' : '#34a85320',
                                                color: insight.impact === 'high' ? '#ea4335' :
                                                       insight.impact === 'medium' ? '#ff9f1c' : '#34a853',
                                                borderRadius: '10px',
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase'
                                            }}>
                                                {insight.impact}
                                            </span>
                                        </div>

                                        <p style={{
                                            margin: '10px 0',
                                            color: '#555',
                                            lineHeight: '1.5'
                                        }}>
                                            {insight.description}
                                        </p>

                                        <div style={{
                                            marginTop: '15px',
                                            padding: '10px 15px',
                                            background: '#f8f9fa',
                                            borderRadius: '8px',
                                            borderLeft: '3px solid #4285f4'
                                        }}>
                                            <strong style={{ color: '#4285f4' }}>💡 Action:</strong> {insight.actionable}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            <FaRobot size={40} style={{ color: '#4285f4', marginBottom: '20px' }} />
                            <p>No advanced insights available at this time.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="empty-state">
                <FaRobot size={50} className="empty-state-icon" style={{ color: '#667eea', animation: 'pulse 2s infinite' }} />
                <h3 className="empty-state-title">AI is analyzing your finances...</h3>
            </div>
        );
    }

    if (error) {
        return (
            <div className="empty-state" style={{ borderColor: '#f14668' }}>
                <FaExclamationTriangle size={50} className="empty-state-icon" style={{ color: '#f14668' }} />
                <h3 className="empty-state-title" style={{ color: '#f14668' }}>{error}</h3>
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
            <div className="empty-state">
                <FaRobot size={50} className="empty-state-icon" />
                <h3 className="empty-state-title">No AI Insights Available</h3>
                <p className="empty-state-message">
                    Click below to fetch insights from your data.
                </p>
                <button 
                    onClick={fetchAIInsights}
                    style={{
                        marginTop: '20px',
                        padding: '10px 30px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Fetch Insights
                </button>
                {/* Gemini Button/Space */}
                <div style={{ marginTop: '30px' }}>
                    <button
                        onClick={() => {
                            setActiveTab('gemini');
                            if (!geminiInsights) fetchGeminiInsights();
                        }}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '25px',
                            border: '2px solid #4285f4',
                            background: '#fff',
                            color: '#4285f4',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            marginRight: '10px'
                        }}
                    >
                        Fetch Gemini Insights
                    </button>
                    <div style={{ marginTop: '10px', color: '#4285f4', fontWeight: 'bold' }}>
                        Gemini API: Advanced insights on demand
                    </div>
                </div>
            </div>
        );
    }

    const totalInsights = Object.values(insights).filter(v => Array.isArray(v)).reduce((a, b) => a + b.length, 0);
    const hasPatterns = insights.patterns?.length > 0;
    const hasAlerts = insights.alerts?.length > 0;
    const hasRecommendations = insights.recommendations?.length > 0;
    const hasSavings = insights.savings?.length > 0;
    const hasAnomalies = insights.anomalies?.length > 0;
    const hasForecast = insights.forecast;

    return (
        <div>
            {/* Greeting Block */}
            <div className="greeting-block">
                <div className="greeting-content">
                    <h1 className="greeting-title">AI Financial Assistant</h1>
                    <p className="greeting-subtitle">Intelligent insights and personalized recommendations to optimize your finances.</p>
                </div>
                <div className="greeting-decoration">
                    <div className="time-indicator">
                        <FaBrain size={24} />
                    </div>
                </div>
            </div>

            {/* Header Controls */}
            <div className="dashboard-header">
                <div className="header-controls">
                    <div className="time-range-selector">
                        <span style={{ fontSize: '14px', color: '#666', marginRight: '15px' }}>
                            AI Analysis powered by advanced algorithms
                        </span>
                    </div>
                    <div className="search-bar" style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={fetchAIInsights}
                            className="refresh-btn"
                            style={{
                                padding: '8px 16px',
                                background: '#667eea',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <FaSyncAlt /> Refresh AI Insights
                        </button>
                        <button
                            onClick={() => {
                                // If not on gemini tab, switch to it and fetch if needed
                                if (activeTab !== 'gemini') {
                                    setActiveTab('gemini');
                                }
                                if (!geminiInsights || geminiInsights.error) {
                                    fetchGeminiInsights();
                                }
                            }}
                            className="gemini-btn"
                            style={{
                                padding: '8px 16px',
                                background: activeTab === 'gemini' ?
                                    'linear-gradient(135deg, #4285f4 0%, #34a853 100%)' :
                                    'linear-gradient(135deg, #4285f4 0%, #34a853 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: activeTab === 'gemini' ?
                                    '0 4px 12px rgba(66, 133, 244, 0.4)' :
                                    '0 2px 8px rgba(66, 133, 244, 0.3)',
                                transform: activeTab === 'gemini' ? 'translateY(-1px)' : 'none',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <FaBrain /> {geminiLoading ? (
                                <>
                                    <div className="spinner" style={{width: '12px', height: '12px'}}></div>
                                    Analyzing...
                                </>
                            ) : geminiInsights && !geminiInsights.error ? (
                                <>
                                    🚀 Gemini AI Insights
                                    <span style={{
                                        padding: '1px 6px',
                                        background: 'rgba(255,255,255,0.2)',
                                        borderRadius: '8px',
                                        fontSize: '11px'
                                    }}>
                                        {geminiInsights.geminiInsights?.length || 0}
                                    </span>
                                </>
                            ) : (
                                <>
                                    🚀 Get Gemini AI Insights
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-cards">
                <div className="kpi-card">
                    <div className="kpi-icon">
                        <FaChartLine />
                    </div>
                    <div className="kpi-content">
                        <div className="kpi-value">{summaryStats.patterns}</div>
                        <div className="kpi-label">Patterns Detected</div>
                        <div className="kpi-change">
                            <span className="positive">AI Analyzed</span>
                        </div>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon">
                        <FaBell />
                    </div>
                    <div className="kpi-content">
                        <div className="kpi-value">{summaryStats.alerts}</div>
                        <div className="kpi-label">Active Alerts</div>
                        <div className="kpi-change">
                            {summaryStats.alerts > 0 ? 
                                <span className="negative">⚠️ Attention Needed</span> : 
                                <span className="positive">✅ All Clear</span>
                            }
                        </div>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon">
                        <FaLightbulb />
                    </div>
                    <div className="kpi-content">
                        <div className="kpi-value">{summaryStats.recommendations}</div>
                        <div className="kpi-label">Smart Tips</div>
                        <div className="kpi-change">
                            <span className="positive">💡 Actionable</span>
                        </div>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon">
                        <FaPiggyBank />
                    </div>
                    <div className="kpi-content">
                        <div className="kpi-value">{summaryStats.savings}</div>
                        <div className="kpi-label">Savings Opportunities</div>
                        <div className="kpi-change">
                            <span className="positive">🐷 Potential Savings</span>
                        </div>
                    </div>
                </div>
            </div>

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
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '50%',
                        padding: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FaBrain size={40} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '24px' }}>AI Financial Assistant</h2>
                        <p style={{ margin: '5px 0 0', opacity: 0.9 }}>
                            {totalInsights} insights generated from your data
                        </p>
                    </div>
                </div>
                <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                }}>
                    <FaMedal />
                    Confidence: {insights.aiConfidence || 'medium'}
                </div>
            </div>

            {/* Summary Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '15px',
                marginBottom: '25px'
            }}>
                <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    textAlign: 'center',
                    border: '1px solid #667eea20'
                }}>
                    <FaChartLine size={24} style={{ color: '#667eea', marginBottom: '10px' }} />
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#667eea' }}>
                        {summaryStats.patterns}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Patterns</div>
                </div>
                <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    textAlign: 'center',
                    border: '1px solid #f1466820'
                }}>
                    <FaBell size={24} style={{ color: '#f14668', marginBottom: '10px' }} />
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f14668' }}>
                        {summaryStats.alerts}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Alerts</div>
                </div>
                <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    textAlign: 'center',
                    border: '1px solid #ff9f1c20'
                }}>
                    <FaLightbulb size={24} style={{ color: '#ff9f1c', marginBottom: '10px' }} />
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff9f1c' }}>
                        {summaryStats.recommendations}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Tips</div>
                </div>
                <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    textAlign: 'center',
                    border: '1px solid #48c77420'
                }}>
                    <FaPiggyBank size={24} style={{ color: '#48c774', marginBottom: '10px' }} />
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#48c774' }}>
                        {summaryStats.savings}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Savings</div>
                </div>
                {summaryStats.anomalies > 0 && (
                    <div style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '10px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                        textAlign: 'center',
                        border: '1px solid #ff9f1c20'
                    }}>
                        <FaExclamationTriangle size={24} style={{ color: '#ff9f1c', marginBottom: '10px' }} />
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff9f1c' }}>
                            {summaryStats.anomalies}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Anomalies</div>
                    </div>
                )}
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
                    className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '25px',
                        border: activeTab === 'all' ? 'none' : '2px solid #ddd',
                        background: activeTab === 'all' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'white',
                        color: activeTab === 'all' ? 'white' : '#666',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.3s'
                    }}
                >
                    All Insights ({totalInsights})
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
                
                {hasForecast && (
                    <button
                        onClick={() => setActiveTab('forecast')}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '25px',
                            border: activeTab === 'forecast' ? 'none' : '2px solid #667eea',
                            background: activeTab === 'forecast' ? '#667eea' : 'white',
                            color: activeTab === 'forecast' ? 'white' : '#667eea',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        🔮 Forecast
                    </button>
                )}
                
                <button
                    onClick={() => {
                        setActiveTab('gemini');
                        if (!geminiInsights) fetchGeminiInsights();
                    }}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '25px',
                        border: activeTab === 'gemini' ? 'none' : '2px solid #4285f4',
                        background: activeTab === 'gemini' ? '#4285f4' : 'white',
                        color: activeTab === 'gemini' ? 'white' : '#4285f4',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                    }}
                >
                    🚀 Gemini AI {geminiLoading && <div className="spinner" style={{width: '12px', height: '12px'}}></div>}
                </button>
            </div>

            {/* Content based on active tab */}
            <div style={{ minHeight: '300px' }}>
                {(activeTab === 'all' || activeTab === 'alerts') && renderAlerts()}
                {(activeTab === 'all' || activeTab === 'patterns') && renderPatterns()}
                {(activeTab === 'all' || activeTab === 'recommendations') && renderRecommendations()}
                {(activeTab === 'all' || activeTab === 'savings') && renderSavings()}
                {(activeTab === 'all' || activeTab === 'anomalies') && renderAnomalies()}
                {(activeTab === 'all' || activeTab === 'forecast') && renderForecast()}
                {activeTab === 'gemini' && renderGeminiInsights()}

                {/* Show Gemini insights when available, regardless of active tab */}
                {geminiInsights && !geminiInsights.error && activeTab !== 'gemini' && (
                    <div style={{ marginTop: '30px', padding: '20px', background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%)', borderRadius: '12px', border: '1px solid #4285f420' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0, color: '#4285f4', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FaBrain /> Gemini AI Insights
                                <span style={{
                                    padding: '2px 8px',
                                    background: '#4285f4',
                                    color: 'white',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    {geminiInsights.confidence || 'AI'}
                                </span>
                            </h3>
                            <button
                                onClick={() => setActiveTab('gemini')}
                                style={{
                                    padding: '6px 12px',
                                    background: 'transparent',
                                    color: '#4285f4',
                                    border: '1px solid #4285f4',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}
                            >
                                View All →
                            </button>
                        </div>
                        {geminiInsights.geminiInsights && geminiInsights.geminiInsights.length > 0 ? (
                            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                                {geminiInsights.geminiInsights.slice(0, 3).map((insight, index) => (
                                    <div key={index} style={{
                                        padding: '15px',
                                        background: 'white',
                                        borderRadius: '8px',
                                        border: '1px solid #4285f420',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '4px',
                                            height: '100%',
                                            background: insight.type === 'pattern' ? '#4285f4' :
                                                       insight.type === 'saving' ? '#34a853' :
                                                       insight.type === 'alert' ? '#ea4335' : '#ff9f1c'
                                        }} />
                                        <div style={{ marginLeft: '15px' }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                marginBottom: '8px'
                                            }}>
                                                <span style={{
                                                    fontSize: '16px',
                                                    fontWeight: 'bold',
                                                    color: insight.type === 'pattern' ? '#4285f4' :
                                                           insight.type === 'saving' ? '#34a853' :
                                                           insight.type === 'alert' ? '#ea4335' : '#ff9f1c'
                                                }}>
                                                    {insight.type === 'pattern' ? '📊' :
                                                     insight.type === 'saving' ? '💰' :
                                                     insight.type === 'alert' ? '⚠️' : '💡'}
                                                </span>
                                                <h4 style={{
                                                    margin: 0,
                                                    color: '#333',
                                                    fontSize: '14px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {insight.title}
                                                </h4>
                                            </div>
                                            <p style={{
                                                margin: '8px 0',
                                                color: '#555',
                                                fontSize: '13px',
                                                lineHeight: '1.4'
                                            }}>
                                                {insight.description}
                                            </p>
                                            <div style={{
                                                marginTop: '10px',
                                                padding: '8px 10px',
                                                background: '#f8f9fa',
                                                borderRadius: '6px',
                                                fontSize: '12px'
                                            }}>
                                                <strong style={{ color: '#4285f4' }}>💡 Action:</strong> {insight.actionable}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {geminiInsights.geminiInsights.length > 3 && (
                                    <div style={{
                                        padding: '15px',
                                        background: 'white',
                                        borderRadius: '8px',
                                        border: '1px solid #4285f420',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#4285f4',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setActiveTab('gemini')}
                                    >
                                        <span style={{ fontWeight: 'bold' }}>
                                            +{geminiInsights.geminiInsights.length - 3} more insights →
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                <FaBrain size={24} style={{ color: '#4285f4', marginBottom: '10px' }} />
                                <p>No advanced insights available at this time.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Global Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes pulse {
                    0% { opacity: 0.5; }
                    50% { opacity: 0.8; }
                    100% { opacity: 0.5; }
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .insight-card {
                    animation: slideIn 0.3s ease-out;
                    animation-fill-mode: both;
                }
                
                .tab-btn {
                    transition: all 0.3s;
                }
                
                .tab-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
                }
                
                .refresh-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                }

                /* Greeting Block */
                .greeting-block {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 15px;
                    padding: 25px;
                    color: white;
                    margin-bottom: 25px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 20px;
                }

                .greeting-content h1 {
                    margin: 0 0 10px 0;
                    font-size: 28px;
                    font-weight: 700;
                }

                .greeting-subtitle {
                    margin: 0;
                    opacity: 0.9;
                    font-size: 16px;
                }

                .greeting-decoration {
                    display: flex;
                    align-items: center;
                }

                .time-indicator {
                    background: rgba(255,255,255,0.2);
                    padding: 12px 20px;
                    border-radius: 25px;
                    font-size: 14px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                /* Dashboard Header */
                .dashboard-header {
                    margin-bottom: 25px;
                }

                .header-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 20px;
                }

                .time-range-selector {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    flex-wrap: wrap;
                }

                .search-bar {
                    display: flex;
                    align-items: center;
                }

                /* KPI Cards */
                .kpi-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .kpi-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    border: 1px solid #e0e0e0;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .kpi-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }

                .kpi-icon {
                    width: 50px;
                    height: 50px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    color: white;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                }

                .kpi-content {
                    flex: 1;
                }

                .kpi-value {
                    font-size: 28px;
                    font-weight: 700;
                    color: #2c3e50;
                    margin-bottom: 5px;
                }

                .kpi-label {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 5px;
                }

                .kpi-change {
                    font-size: 12px;
                    font-weight: 500;
                }

                .kpi-change .positive {
                    color: #48c774;
                }

                .kpi-change .negative {
                    color: #f14668;
                }

                /* Spinner Animation */
                .spinner {
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top: 2px solid white;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* Gemini Button Hover */
                .gemini-btn:hover {
                    transform: translateY(-2px) !important;
                    box-shadow: 0 4px 12px rgba(66, 133, 244, 0.4) !important;
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .greeting-block {
                        flex-direction: column;
                        text-align: center;
                    }
                    
                    .header-controls {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .kpi-cards {
                        grid-template-columns: 1fr;
                    }
                    
                    .kpi-card {
                        padding: 15px;
                    }
                }
                `
            }} />
        </div>
        </div>
    );
};

export default AIDashboard;
