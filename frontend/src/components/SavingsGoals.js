import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTarget, FaPlus, FaTrash, FaPiggyBank } from 'react-icons/fa';

const SavingsGoals = () => {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    deadline: ''
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await axios.get('/api/goals');
      setGoals(res.data);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/goals', formData);
      setShowForm(false);
      setFormData({ name: '', target_amount: '', deadline: '' });
      fetchGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const handleAddSavings = async (goalId, currentAmount, targetAmount) => {
    const amount = prompt('How much do you want to add?', '1000');
    if (!amount) return;
    
    const newAmount = parseFloat(currentAmount) + parseFloat(amount);
    if (newAmount > targetAmount) {
      alert(`🎉 Congratulations! You've reached your goal!`);
    }
    
    try {
      await axios.put(`/api/goals/${goalId}`, { current_amount: newAmount });
      fetchGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <FaTarget style={{ marginRight: '10px', color: '#667eea' }} />
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

      {showForm && (
        <form onSubmit={handleSubmit} style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
          <div className="form-row">
            <div className="form-group">
              <label>Goal Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., New Laptop, Vacation"
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
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary">Create Goal</button>
            <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div style={{ padding: '20px' }}>
        {goals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <FaPiggyBank size={50} style={{ color: '#ccc', marginBottom: '20px' }} />
            <h4>No savings goals yet</h4>
            <p style={{ marginTop: '10px' }}>Create your first goal to start saving!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {goals.map(goal => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              const daysLeft = Math.ceil(
                (new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)
              );
              
              return (
                <div key={goal.id} style={{
                  padding: '20px',
                  background: '#f8f9fa',
                  borderRadius: '10px',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0' }}>{goal.name}</h4>
                      <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                        Target: ₹{goal.target_amount.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddSavings(goal.id, goal.current_amount, goal.target_amount)}
                      style={{
                        padding: '8px 16px',
                        background: '#48c774',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      Add Savings
                    </button>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span>Progress</span>
                      <span style={{ fontWeight: 'bold', color: '#667eea' }}>
                        ₹{goal.current_amount.toLocaleString()} / ₹{goal.target_amount.toLocaleString()}
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '10px',
                      background: '#e0e0e0',
                      borderRadius: '5px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min(progress, 100)}%`,
                        height: '100%',
                        background: progress >= 100 ? '#48c774' : 'linear-gradient(135deg, #667eea, #764ba2)',
                        borderRadius: '5px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#666', fontSize: '14px' }}>
                      {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
                    </span>
                    <span style={{
                      padding: '4px 12px',
                      background: progress >= 100 ? '#48c77420' : '#667eea20',
                      color: progress >= 100 ? '#48c774' : '#667eea',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {progress >= 100 ? '🎉 Goal Achieved!' : `${progress.toFixed(1)}% Complete`}
                    </span>
                  </div>
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