import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBell, FaCalendarCheck, FaCheckCircle, FaTrash } from 'react-icons/fa';
import { normalizeCategoryIcon } from '../utils/categoryIcon';

const BillReminders = () => {
  const [reminders, setReminders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    bill_name: '',
    amount: '',
    due_date: '',
    category_id: 5, // Bills & Utilities
    recurring: 'monthly'
  });

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const res = await axios.get('/api/reminders');
      setReminders(res.data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/reminders', formData);
      setShowForm(false);
      setFormData({
        bill_name: '',
        amount: '',
        due_date: '',
        category_id: 5,
        recurring: 'monthly'
      });
      fetchReminders();
    } catch (error) {
      console.error('Error creating reminder:', error);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await axios.put(`/api/reminders/${id}/paid`);
      fetchReminders();
    } catch (error) {
      console.error('Error marking as paid:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this bill reminder?')) {
      try {
        await axios.delete(`/api/reminders/${id}`);
        fetchReminders();
      } catch (error) {
        console.error('Error deleting reminder:', error);
      }
    }
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <FaBell style={{ marginRight: '10px', color: '#667eea' }} />
          Bill Reminders
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          + Add Bill
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
          <div className="form-row">
            <div className="form-group">
              <label>Bill Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.bill_name}
                onChange={(e) => setFormData({ ...formData, bill_name: e.target.value })}
                placeholder="e.g., Electricity Bill"
                required
              />
            </div>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input
                type="number"
                className="form-control"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="2500"
                required
              />
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary">Save Reminder</button>
            <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div style={{ padding: '20px' }}>
        {reminders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <FaCalendarCheck size={50} style={{ color: '#ccc', marginBottom: '20px' }} />
            <h4>No bill reminders</h4>
            <p style={{ marginTop: '10px' }}>Add your recurring bills to never miss a payment!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {reminders.map(reminder => {
              const daysUntil = getDaysUntilDue(reminder.due_date);
              const isOverdue = daysUntil < 0;
              const isDueSoon = daysUntil >= 0 && daysUntil <= 3;
              
              return (
                <div
                  key={reminder.id}
                  style={{
                    padding: '15px',
                    background: isOverdue ? '#f1466810' : isDueSoon ? '#ffdd5710' : '#f8f9fa',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${
                      isOverdue ? '#f14668' : 
                      isDueSoon ? '#ffdd57' : 
                      reminder.color || '#667eea'
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: reminder.color || '#667eea20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px'
                    }}>
                      {normalizeCategoryIcon(reminder.icon, reminder.category_name || reminder.bill_name)}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0' }}>{reminder.bill_name}</h4>
                      <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#666' }}>
                        <span>₹{reminder.amount}</span>
                        <span>Due: {new Date(reminder.due_date).toLocaleDateString()}</span>
                        <span style={{
                          color: isOverdue ? '#f14668' : isDueSoon ? '#ff9f1c' : '#48c774',
                          fontWeight: 'bold'
                        }}>
                          {isOverdue ? `Overdue by ${Math.abs(daysUntil)} days` :
                           isDueSoon ? `${daysUntil} days left` :
                           `${daysUntil} days until due`}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleMarkPaid(reminder.id)}
                      style={{
                        padding: '8px 16px',
                        background: '#48c774',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <FaCheckCircle /> Paid
                    </button>
                    <button
                      onClick={() => handleDelete(reminder.id)}
                      style={{
                        padding: '8px 16px',
                        background: '#f14668',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      <FaTrash />
                    </button>
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

export default BillReminders;