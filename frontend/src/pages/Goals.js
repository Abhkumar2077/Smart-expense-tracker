// frontend/src/pages/Goals.js
import React, { useState } from 'react';
import { FaWallet, FaChartLine, FaArrowUp, FaPlus, FaBullseye } from 'react-icons/fa';

const Goals = () => {
  const [savingsData] = useState({
    totalBalance: 125000,
    monthlySavings: 15000,
    savingsGoal: 200000,
    currentGoalProgress: 62.5
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #E6F3FF 0%, #B3D9FF 50%, #80BFFF 100%)',
      padding: '32px',
      minHeight: 'calc(100vh - 60px)'
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
        padding: '28px 32px',
        borderRadius: '16px',
        boxShadow: '0 12px 40px rgba(0, 48, 135, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'white',
            margin: 0,
            fontSize: '28px',
            fontWeight: 700
          }}>
            <FaBullseye size={32} />
            Savings Goals
          </h2>
          <p style={{
            margin: '8px 0 0',
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: '16px',
            fontWeight: 400,
            lineHeight: 1.5,
            maxWidth: '600px'
          }}>
            Track your savings goals, monitor progress, and achieve financial milestones.
          </p>
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button style={{
            padding: '12px 24px',
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '10px',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            <FaBullseye /> Filter
          </button>
          <button style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #003087 0%, #00A3E0 100%)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0, 48, 135, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #00A3E0 0%, #003087 100%)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 48, 135, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #003087 0%, #00A3E0 100%)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 48, 135, 0.3)';
          }}>
            <FaPlus /> Add Goal
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '48px'
      }}>
        {/* Total Balance Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 48, 135, 0.12)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 48, 135, 0.18)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 48, 135, 0.12)';
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #003087, #00A3E0)'
          }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #003087, #00A3E0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: 'white',
              boxShadow: '0 4px 12px rgba(0, 48, 135, 0.3)'
            }}>
              <FaWallet />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#003087', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Saved
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#001435', lineHeight: 1.2 }}>
                {formatCurrency(savingsData.totalBalance)}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#10b981', fontWeight: 600 }}>
            <span>↗ +12.5%</span>
            <span style={{ color: '#64748b', fontWeight: 400 }}>from last month</span>
          </div>
        </div>

        {/* Monthly Savings Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 48, 135, 0.12)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 48, 135, 0.18)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 48, 135, 0.12)';
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #10b981, #34d399)'
          }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #10b981, #34d399)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: 'white',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}>
              <FaArrowUp />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#003087', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Monthly Savings
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#001435', lineHeight: 1.2 }}>
                {formatCurrency(savingsData.monthlySavings)}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#10b981', fontWeight: 600 }}>
            <span>↗ +8.2%</span>
            <span style={{ color: '#64748b', fontWeight: 400 }}>vs last month</span>
          </div>
        </div>

        {/* Goal Progress Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 48, 135, 0.12)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 48, 135, 0.18)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 48, 135, 0.12)';
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #f59e0b, #fbbf24)'
          }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: 'white',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
            }}>
              <FaChartLine />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#003087', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Goal Progress
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#001435', lineHeight: 1.2 }}>
                {savingsData.currentGoalProgress}%
              </div>
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{
              height: '8px',
              background: '#e2e8f0',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(savingsData.currentGoalProgress, 100)}%`,
                background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                borderRadius: '4px',
                transition: 'width 0.6s ease'
              }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#94a3b8' }}>
              <span>{formatCurrency(savingsData.totalBalance)} saved</span>
              <span>{formatCurrency(savingsData.savingsGoal)} goal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Goals List Section */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 48, 135, 0.12)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        overflow: 'hidden',
        marginBottom: '48px'
      }}>
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: 'white'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 700,
            color: '#001435',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FaBullseye color="#003087" />
            Your Savings Goals
          </h3>
        </div>
        
        <div style={{ padding: '24px 28px' }}>
          {[
            { name: 'Emergency Fund', target: 100000, current: 75000, deadline: 'Dec 2024', color: '#003087' },
            { name: 'Dream Vacation', target: 50000, current: 32000, deadline: 'Jun 2024', color: '#00A3E0' },
            { name: 'New Car', target: 500000, current: 180000, deadline: 'Dec 2025', color: '#f59e0b' },
            { name: 'Retirement Fund', target: 1000000, current: 250000, deadline: 'Dec 2030', color: '#10b981' }
          ].map((goal, idx) => {
            const progress = Math.round((goal.current / goal.target) * 100);
            return (
              <div key={idx} style={{
                marginBottom: idx === 3 ? 0 : '24px',
                padding: '20px',
                background: 'rgba(0, 48, 135, 0.02)',
                borderRadius: '12px',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 48, 135, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#001435' }}>{goal.name}</h4>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>Deadline: {goal.deadline}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: goal.color }}>
                      {progress}%
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                    </div>
                  </div>
                </div>
                <div style={{
                  height: '8px',
                  background: '#e2e8f0',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${goal.color}, ${goal.color}dd)`,
                    borderRadius: '4px',
                    transition: 'width 0.6s ease'
                  }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                  <button style={{
                    padding: '6px 12px',
                    background: 'transparent',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#003087',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#003087';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.borderColor = '#003087';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#003087';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}>
                    Update Progress
                  </button>
                  <button style={{
                    padding: '6px 12px',
                    background: 'transparent',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#64748b',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.borderColor = '#ef4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#64748b';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}>
                    Delete Goal
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Goals;