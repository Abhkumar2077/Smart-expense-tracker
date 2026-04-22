// frontend/src/components/SavingsGoals.js
import React, { useState, useEffect } from 'react';
import { goalsAPI } from '../services/api';
import { 
    FaPlus, FaTrash, FaCheckCircle, 
    FaCalendarAlt, FaBullseye
} from 'react-icons/fa';

const SavingsGoals = () => {
    const [goals, setGoals] = useState([]);
    const [stats, setStats] = useState({
        total_goals: 0,
        completed_goals: 0,
        total_remaining: 0,
        avg_progress: 0
    });
    const [showForm, setShowForm] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        target_amount: '',
        deadline: '',
        icon: '🎯',
        color: '#48c774'
    });
    const [dialog, setDialog] = useState(null);

    const icons = ['🎯', '💰', '🏠', '🚗', '✈️', '📚', '💻', '🏋️', '🎓', '🏥'];
    const colors = ['#48c774', '#f14668', '#667eea', '#ff9f1c', '#a06ab4', '#00d1b2'];

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            setLoading(true);
            const res = await goalsAPI.getAll();
            setGoals(res.data.goals || []);
            setStats(res.data.stats || {});
        } catch (error) {
            console.error('Error fetching goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const closeDialog = () => setDialog(null);

    const openDialog = ({
        title,
        message,
        confirmText = 'OK',
        cancelText = 'Cancel',
        onConfirm,
        showCancel = true,
        inputProps
    }) => {
        setDialog({
            title,
            message,
            confirmText,
            cancelText,
            onConfirm,
            showCancel,
            inputProps: inputProps ? { ...inputProps, value: inputProps.defaultValue || '' } : null
        });
    };

    const handleDialogConfirm = async () => {
        if (!dialog || !dialog.onConfirm) {
            closeDialog();
            return;
        }

        const value = dialog.inputProps ? dialog.inputProps.value : undefined;

        try {
            await dialog.onConfirm(value);
        } catch (error) {
            console.error('Dialog confirm error:', error);
        }

        closeDialog();
    };

    const handleDialogInputChange = (value) => {
        setDialog((prev) =>
            prev ? { ...prev, inputProps: { ...prev.inputProps, value } } : prev
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingGoal) {
                await goalsAPI.update(editingGoal.id, {
                    current_amount: formData.current_amount || editingGoal.current_amount
                });
            } else {
                await goalsAPI.create(formData);
            }
            setShowForm(false);
            setEditingGoal(null);
            setFormData({
                name: '',
                target_amount: '',
                deadline: '',
                icon: '🎯',
                color: '#48c774'
            });
            fetchGoals();
        } catch (error) {
            console.error('Error saving goal:', error);
            openDialog({
                title: 'Error',
                message: 'Failed to save goal. Please try again.',
                confirmText: 'Close',
                showCancel: false
            });
        }
    };

    const handleDelete = async (id) => {
        openDialog({
            title: 'Delete savings goal?',
            message: 'Are you sure you want to delete this goal? This cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: async () => {
                try {
                    await goalsAPI.delete(id);
                    fetchGoals();
                } catch (error) {
                    console.error('Error deleting goal:', error);
                }
            }
        });
    };

    const handleAddSavings = (goal) => {
        openDialog({
            title: `Add savings to "${goal.name}"`,
            message: 'Enter the amount you want to add:',
            confirmText: 'Add',
            cancelText: 'Cancel',
            inputProps: {
                placeholder: '1000',
                defaultValue: ''
            },
            onConfirm: async (value) => {
                const amount = parseFloat(value);
                if (isNaN(amount) || amount <= 0) {
                    openDialog({
                        title: 'Invalid amount',
                        message: 'Please enter a valid number greater than 0.',
                        confirmText: 'OK',
                        showCancel: false
                    });
                    return;
                }

                const current = parseFloat(goal.current_amount) || 0;
                const target = parseFloat(goal.target_amount) || 0;
                const newAmount = current + amount;
                const cappedAmount = target > 0 ? Math.min(newAmount, target) : newAmount;

                await goalsAPI.update(goal.id, { current_amount: cappedAmount });
                fetchGoals();

                if (newAmount >= target && target > 0) {
                    openDialog({
                        title: 'Goal reached!',
                        message: '🎉 Great job! You have reached your savings goal.',
                        confirmText: 'OK',
                        showCancel: false
                    });
                }
            }
        });
    };

    const calculateProgress = (current, target) => {
        return Math.min((current / target) * 100, 100);
    };

    const getDaysLeft = (deadline) => {
        const today = new Date();
        const due = new Date(deadline);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (loading) {
        return <div className="loading">Loading goals...</div>;
    }

    return (
        <div style={{
            background: 'linear-gradient(135deg, #001435 0%, #003087 50%, #00A3E0 100%)',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 12px 40px rgba(0, 3, 135, 0.3)',
            position: 'relative',
            overflow: 'hidden'
        }}>

            <div className="savings-goals-container" style={{
                position: 'relative',
                zIndex: 1
            }}>
            {dialog && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    zIndex: 2000
                }}>
                    <div style={{
                        maxWidth: '460px',
                        width: '100%',
                        background: 'var(--bg-primary)',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
                        border: '1px solid rgba(0,0,0,0.08)'
                    }}>
                        <h3 style={{ margin: 0, marginBottom: '10px' }}>{dialog.title}</h3>
                        <p style={{ margin: 0, marginBottom: '18px', color: 'var(--text-muted)' }}>
                            {dialog.message}
                        </p>
                        {dialog.inputProps && (
                            <input
                                type={dialog.inputProps.type || 'text'}
                                value={dialog.inputProps.value}
                                placeholder={dialog.inputProps.placeholder}
                                onChange={(e) => handleDialogInputChange(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(0,0,0,0.12)',
                                    marginBottom: '18px',
                                    fontSize: '14px'
                                }}
                            />
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            {dialog.showCancel && (
                                <button
                                    onClick={closeDialog}
                                    style={{
                                        padding: '10px 16px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(0,0,0,0.15)',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    {dialog.cancelText}
                                </button>
                            )}
                            <button
                                onClick={handleDialogConfirm}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: 'var(--primary-color)',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                {dialog.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px'
            }}>
                <div>
                    <h3 style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: 'white',
                        margin: '0 0 8px 0',
                        fontSize: '24px',
                        fontWeight: '600'
                    }}>
                        <FaBullseye style={{ color: '#ADD8E6' }} />
                        Savings Goals
                    </h3>
                    <p style={{
                        margin: 0,
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '16px'
                    }}>
                        Track your progress and stay motivated towards your financial goals.
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        background: 'rgba(173, 216, 230, 0.8)',
                        backdropFilter: 'blur(5px)',
                        color: '#001435',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '14px'
                    }}
                >
                    <FaPlus /> New Goal
                </button>
            </div>

            {/* Stats Overview */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '14px', color: '#666', fontWeight: '500', marginBottom: '8px' }}>Total Goals</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#003087' }}>
                        {stats.total_goals || 0}
                    </div>
                </div>

                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '14px', color: '#666', fontWeight: '500', marginBottom: '8px' }}>Completed</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#48c774' }}>
                        {stats.completed_goals || 0}
                    </div>
                </div>

                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '14px', color: '#666', fontWeight: '500', marginBottom: '8px' }}>Left to Save</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00A3E0' }}>
                        ₹{(stats.total_remaining || 0).toLocaleString()}
                    </div>
                </div>

                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '14px', color: '#666', fontWeight: '500', marginBottom: '8px' }}>Avg Progress</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f14668' }}>
                        {Math.round(stats.avg_progress || 0)}%
                    </div>
                </div>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '32px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <h4 style={{
                        margin: '0 0 20px 0',
                        color: '#001435',
                        fontSize: '20px',
                        fontWeight: '600'
                    }}>
                        {editingGoal ? 'Edit Goal' : 'Create New Goal'}
                    </h4>
                    <form onSubmit={handleSubmit}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '20px',
                            marginBottom: '20px'
                        }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    color: '#001435',
                                    fontWeight: '500'
                                }}>Goal Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Emergency Fund, Vacation, New Car"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 255, 255, 0.8)',
                                        backdropFilter: 'blur(5px)',
                                        color: '#001435',
                                        fontWeight: '500',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    color: '#001435',
                                    fontWeight: '500'
                                }}>Target Amount (₹)</label>
                                <input
                                    type="number"
                                    value={formData.target_amount}
                                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                                    placeholder="50000"
                                    min="1"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 255, 255, 0.8)',
                                        backdropFilter: 'blur(5px)',
                                        color: '#001435',
                                        fontWeight: '500',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    color: '#001435',
                                    fontWeight: '500'
                                }}>Deadline</label>
                                <input
                                    type="date"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 255, 255, 0.8)',
                                        backdropFilter: 'blur(5px)',
                                        color: '#001435',
                                        fontWeight: '500',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '20px',
                            marginBottom: '20px'
                        }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '12px',
                                    color: '#001435',
                                    fontWeight: '500'
                                }}>Icon</label>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))',
                                    gap: '10px'
                                }}>
                                    {icons.map(icon => (
                                        <button
                                            key={icon}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, icon })}
                                            style={{
                                                fontSize: '24px',
                                                padding: '12px',
                                                background: formData.icon === icon ? formData.color : 'rgba(255, 255, 255, 0.8)',
                                                backdropFilter: 'blur(5px)',
                                                border: `2px solid ${formData.icon === icon ? formData.color : 'rgba(255, 255, 255, 0.3)'}`,
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '12px',
                                    color: '#001435',
                                    fontWeight: '500'
                                }}>Color</label>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))',
                                    gap: '10px'
                                }}>
                                    {colors.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color })}
                                            style={{
                                                width: '50px',
                                                height: '50px',
                                                background: color,
                                                border: formData.color === color ? '4px solid white' : 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                outline: formData.color === color ? `2px solid ${color}` : 'none',
                                                boxShadow: formData.color === color ? '0 0 0 2px rgba(0,0,0,0.2)' : 'none'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                type="submit"
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
                                {editingGoal ? 'Update Goal' : 'Create Goal'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                style={{
                                    padding: '12px 24px',
                                    background: 'transparent',
                                    color: '#001435',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    fontSize: '14px'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Goals List */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
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
                            onClick={() => setShowForm(true)}
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
                        {goals.map(goal => {
                            const progress = calculateProgress(goal.current_amount, goal.target_amount);
                            const daysLeft = getDaysLeft(goal.deadline);
                            const isCompleted = goal.current_amount >= goal.target_amount;
                            
                            return (
                                <div
                                    key={goal.id}
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
                                                background: goal.color,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '28px',
                                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                                            }}>
                                                {goal.icon}
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
                                                        <FaCalendarAlt /> {new Date(goal.deadline).toLocaleDateString()}
                                                    </span>
                                                    <span style={{
                                                        color: daysLeft < 0 ? '#f14668' : daysLeft < 7 ? '#ff9f1c' : 'rgba(0, 20, 53, 0.7)'
                                                    }}>
                                                        {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
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
                                                color: goal.color
                                            }}>
                                                ₹{goal.current_amount.toLocaleString()} / ₹{goal.target_amount.toLocaleString()}
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
                                                background: `linear-gradient(90deg, ${goal.color}, ${goal.color}dd)`,
                                                borderRadius: '8px',
                                                transition: 'width 0.5s ease',
                                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                                            }} />
                                        </div>
                                        <div style={{
                                            textAlign: 'center',
                                            marginTop: '8px',
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            color: goal.color
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
        </div>
    );
};

export default SavingsGoals;
