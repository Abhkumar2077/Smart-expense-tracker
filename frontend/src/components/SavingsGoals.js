// frontend/src/components/SavingsGoals.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaPlus, FaTrash, FaEdit, FaCheckCircle, 
    FaCircle, FaCalendarAlt, FaBullseye, FaChartLine,  // ✅ Changed from FaTarget to FaBullseye
    FaMoneyBillWave, FaPiggyBank, FaRocket
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
            const res = await axios.get('/api/goals');
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
                await axios.put(`/api/goals/${editingGoal.id}`, {
                    current_amount: formData.current_amount || editingGoal.current_amount
                });
            } else {
                await axios.post('/api/goals', formData);
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
                    await axios.delete(`/api/goals/${id}`);
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

                const newAmount = parseFloat(goal.current_amount) + amount;
                if (newAmount >= goal.target_amount) {
                    openDialog({
                        title: 'Goal reached!',
                        message: `🎉 Congratulations! You've reached your goal. Mark it as complete?`,
                        confirmText: 'Yes',
                        cancelText: 'No',
                        onConfirm: async () => {
                            await axios.put(`/api/goals/${goal.id}`, { current_amount: goal.target_amount });
                            fetchGoals();
                        }
                    });
                } else {
                    await axios.put(`/api/goals/${goal.id}`, { current_amount: newAmount });
                    fetchGoals();
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
        <div className="card">
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

            <div className="card-header">
                <h3 className="card-title">
                    <FaBullseye style={{ marginRight: '10px', color: '#667eea' }} /> {/* ✅ Changed here */}
                    Savings Goals
                </h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <FaPlus /> New Goal
                </button>
            </div>

            {/* Stats Overview */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '15px',
                padding: '20px',
                background: '#f8f9fa',
                borderBottom: '1px solid #e0e0e0'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>
                        {stats.total_goals || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Total Goals</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#48c774' }}>
                        {stats.completed_goals || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Completed</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9f1c' }}>
                        ₹{(stats.total_remaining || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Left to Save</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f14668' }}>
                        {Math.round(stats.avg_progress || 0)}%
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Avg Progress</div>
                </div>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div style={{ padding: '20px', borderBottom: '1px solid #e0e0e0' }}>
                    <h4>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</h4>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Goal Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Emergency Fund, Vacation, New Car"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Target Amount (₹)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={formData.target_amount}
                                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                                    placeholder="50000"
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Deadline</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Icon</label>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {icons.map(icon => (
                                        <button
                                            key={icon}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, icon })}
                                            style={{
                                                fontSize: '24px',
                                                padding: '8px',
                                                background: formData.icon === icon ? formData.color : 'white',
                                                border: '2px solid',
                                                borderColor: formData.icon === icon ? formData.color : '#ddd',
                                                borderRadius: '8px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Color</label>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {colors.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color })}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                background: color,
                                                border: formData.color === color ? '4px solid white' : 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                outline: formData.color === color ? `2px solid ${color}` : 'none'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button type="submit" className="btn btn-primary">
                                {editingGoal ? 'Update Goal' : 'Create Goal'}
                            </button>
                            <button type="button" className="btn" onClick={() => setShowForm(false)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Goals List */}
            <div style={{ padding: '20px' }}>
                {goals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                        <FaBullseye size={50} style={{ color: '#ccc', marginBottom: '20px' }} /> {/* ✅ Changed here */}
                        <h4>No savings goals yet</h4>
                        <p style={{ marginTop: '10px' }}>Create your first goal to start saving!</p>
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
                                        padding: '20px',
                                        background: '#f8f9fa',
                                        borderRadius: '10px',
                                        border: isCompleted ? '2px solid #48c774' : 'none'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{
                                                width: '50px',
                                                height: '50px',
                                                borderRadius: '25px',
                                                background: goal.color,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '24px'
                                            }}>
                                                {goal.icon}
                                            </div>
                                            <div>
                                                <h4 style={{ margin: '0 0 5px 0' }}>{goal.name}</h4>
                                                <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#666' }}>
                                                    <span><FaCalendarAlt /> {new Date(goal.deadline).toLocaleDateString()}</span>
                                                    <span>{daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                onClick={() => handleAddSavings(goal)}
                                                className="btn btn-primary"
                                                style={{ padding: '8px 16px' }}
                                                disabled={isCompleted}
                                            >
                                                Add Savings
                                            </button>
                                            <button
                                                onClick={() => handleDelete(goal.id)}
                                                className="btn btn-danger"
                                                style={{ padding: '8px 16px' }}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div style={{ marginTop: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <span>Progress</span>
                                            <span style={{ fontWeight: 'bold', color: goal.color }}>
                                                ₹{goal.current_amount.toLocaleString()} / ₹{goal.target_amount.toLocaleString()}
                                            </span>
                                        </div>
                                        <div style={{
                                            width: '100%',
                                            height: '12px',
                                            background: '#e0e0e0',
                                            borderRadius: '6px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${progress}%`,
                                                height: '100%',
                                                background: `linear-gradient(90deg, ${goal.color}, ${goal.color}dd)`,
                                                borderRadius: '6px',
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                    </div>

                                    {/* Milestone Celebration */}
                                    {isCompleted && (
                                        <div style={{
                                            marginTop: '15px',
                                            padding: '10px',
                                            background: '#48c77420',
                                            borderRadius: '5px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            color: '#48c774'
                                        }}>
                                            <FaCheckCircle />
                                            <span>🎉 Goal achieved! Congratulations!</span>
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

export default SavingsGoals;