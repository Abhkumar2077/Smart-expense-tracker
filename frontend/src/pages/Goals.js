// frontend/src/pages/Goals.js
import React from 'react';
import { FaWallet, FaChartLine, FaArrowUp, FaPlus, FaBullseye, FaTrash, FaCheckCircle } from 'react-icons/fa';

const Goals = ({ savingsData = {}, goals = [], onAddSavings, onDeleteGoal, onAddGoal }) => {

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const calculateProgress = (current, target) => {
    if (!target || target === 0) return 0;
    return (Number(current) || 0) / Number(target) * 100;
  };

  const getDaysLeft = (deadline) => {
    if (!deadline) return 0;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleAddSavings = (goal) => {
    if (onAddSavings) {
      const amount = prompt(`Enter amount to add to ${goal.name}:`, "0");
      if (amount && !isNaN(amount) && Number(amount) > 0) {
        onAddSavings(goal.id, Number(amount));
      }
    }
  };

  const handleDelete = (goalId) => {
    if (onDeleteGoal && window.confirm("Are you sure you want to delete this goal?")) {
      onDeleteGoal(goalId);
    }
  };

  const handleCreateGoal = () => {
    if (onAddGoal) {
      // You can replace this with a modal form
      const name = prompt("Enter goal name:", "Vacation Fund");
      const target = prompt("Enter target amount (₹):", "100000");
      const deadline = prompt("Enter deadline (YYYY-MM-DD):", "2025-12-31");
      
      if (name && target && deadline) {
        onAddGoal({
          name,
          target_amount: Number(target),
          deadline,
          current_amount: 0,
          icon: "🏦",
          color: "linear-gradient(135deg, #003087, #00A3E0)"
        });
      }
    }
  };

  // Calculate total saved from goals
  const totalSaved = goals.reduce((sum, g) => sum + (Number(g.current_amount) || 0), 0);
  const totalGoalTarget = goals.reduce((sum, g) => sum + (Number(g.target_amount) || 0), 0);
  const overallProgress = totalGoalTarget > 0 ? (totalSaved / totalGoalTarget) * 100 : 0;

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
          <button 
            onClick={handleCreateGoal}
            style={{
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
                {formatCurrency(savingsData.totalBalance || totalSaved)}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#10b981', fontWeight: 600 }}>
            <span>↗ +{((Math.random() * 10 + 5)).toFixed(1)}%</span>
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
                {formatCurrency(savingsData.monthlySavings || 0)}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#10b981', fontWeight: 600 }}>
            <span>↗ +{((Math.random() * 10 + 5)).toFixed(1)}%</span>
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
                {Math.round(overallProgress)}%
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
                width: `${Math.min(overallProgress, 100)}%`,
                background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                borderRadius: '4px',
                transition: 'width 0.6s ease'
              }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#94a3b8' }}>
              <span>{formatCurrency(totalSaved)} saved</span>
              <span>{formatCurrency(totalGoalTarget)} goal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Goals List Section - dynamically renders from API */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0, 48, 135, 0.12)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h4 style={{
          margin: '0 0 20px 0',
          color: '#001435',
          fontSize: '20px',
          fontWeight: '600'
        }}>
          Your Goals
        </h4>
        {goals.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#001435'
          }}>
            <FaBullseye size={60} style={{ color: 'rgba(0, 20, 53, 0.4)', marginBottom: '20px' }} />
            <h4 style={{ color: '#001435', margin: '0 0 10px 0' }}>No savings goals yet</h4>
            <p style={{ margin: '0 0 20px 0', color: 'rgba(0, 20, 53, 0.7)' }}>Create your first goal to start saving!</p>
            <button
              onClick={handleCreateGoal}
              style={{
                padding: '12px 24px',
                background: 'rgba(0, 20, 53, 0.8)',
                backdropFilter: 'blur(5px)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {goals.map((goal, idx) => {
              const progress = calculateProgress(goal.current_amount, goal.target_amount);
              const daysLeft = getDaysLeft(goal.deadline);
              const isCompleted = Number(goal.current_amount) >= Number(goal.target_amount);
              
              return (
                <div
                  key={goal.id || idx}
                  style={{
                    padding: '24px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: isCompleted ? '2px solid #48c774' : '1px solid rgba(255, 255, 255, 0.2)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                    gap: '15px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '30px',
                        background: goal.color || 'linear-gradient(135deg, #003087, #00A3E0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '28px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                      }}>
                        {goal.icon || "🏦"}
                      </div>
                      <div>
                        <h4 style={{
                          margin: '0 0 8px 0',
                          color: '#001435',
                          fontSize: '18px',
                          fontWeight: '600'
                        }}>{goal.name}</h4>
                        <div style={{
                          display: 'flex',
                          gap: '20px',
                          fontSize: '14px',
                          color: 'rgba(0, 20, 53, 0.7)',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaCalendarAlt /> {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No deadline'}
                          </span>
                          <span style={{
                            color: daysLeft < 0 ? '#f14668' : daysLeft < 7 ? '#ff9f1c' : 'rgba(0, 20, 53, 0.7)'
                          }}>
                            {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Deadline today' : 'Deadline passed'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleAddSavings(goal)}
                        style={{
                          padding: '10px 16px',
                          background: 'rgba(0, 20, 53, 0.8)',
                          backdropFilter: 'blur(5px)',
                          color: 'white',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '8px',
                          cursor: isCompleted ? 'not-allowed' : 'pointer',
                          fontWeight: '500',
                          fontSize: '14px',
                          opacity: isCompleted ? 0.6 : 1
                        }}
                        disabled={isCompleted}
                      >
                        Add Savings
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        style={{
                          padding: '10px 16px',
                          background: 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(5px)',
                          color: '#001435',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          fontSize: '14px'
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      fontSize: '14px',
                      color: '#001435',
                      fontWeight: '500'
                    }}>
                      <span>Progress</span>
                      <span style={{
                        fontWeight: 'bold',
                        color: goal.color || '#f59e0b'
                      }}>
                        ₹{(Number(goal.current_amount) || 0).toLocaleString()} / ₹{(Number(goal.target_amount) || 0).toLocaleString()}
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '16px',
                      background: 'rgba(255, 255, 255, 0.5)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}>
                      <div style={{
                        width: `${Math.min(progress, 100)}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                        borderRadius: '4px',
                        transition: 'width 0.6s ease',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                      }} />
                    </div>
                    <div style={{
                      textAlign: 'center',
                      marginTop: '8px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: goal.color || '#f59e0b'
                    }}>
                      {progress.toFixed(1)}% Complete
                    </div>
                  </div>

                  {/* Milestone Celebration */}
                  {isCompleted && (
                    <div style={{
                      padding: '16px',
                      background: 'linear-gradient(135deg, #48c77420, #48c77410)',
                      borderRadius: '8px',
                      border: '1px solid #48c77440',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginTop: '16px'
                    }}>
                      <FaCheckCircle size={24} color="#48c774" />
                      <div>
                        <div style={{
                          fontWeight: 'bold',
                          color: '#48c774',
                          fontSize: '16px'
                        }}>
                          🎉 Goal achieved! Congratulations!
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: 'rgba(72, 199, 116, 0.8)',
                          marginTop: '4px'
                        }}>
                          You've successfully reached your savings target.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Goals;