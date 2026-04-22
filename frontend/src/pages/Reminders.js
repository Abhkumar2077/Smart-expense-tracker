// frontend/src/pages/Reminders.js
import React, { useState, useEffect } from 'react';
import { FaBell, FaPlus, FaCalendarAlt, FaTrash, FaCheckCircle, FaClock } from 'react-icons/fa';
import { remindersAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { categoryAPI } from '../services/api';
import { normalizeCategoryIcon } from '../utils/categoryIcon';

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    bill_name: '',
    amount: '',
    due_date: '',
    category_id: '',
    recurring: 'one-time'
  });

  useEffect(() => {
    fetchReminders();
    fetchCategories();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const response = await remindersAPI.getAll();
      setReminders(response.data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      showNotification('Failed to load reminders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingReminder) {
        // For now, we'll delete and recreate since we don't have an update endpoint
        await remindersAPI.delete(editingReminder.id);
        await remindersAPI.create(formData);
        showNotification('Reminder updated successfully', 'success');
      } else {
        await remindersAPI.create(formData);
        showNotification('Reminder created successfully', 'success');
      }

      setShowForm(false);
      setEditingReminder(null);
      resetForm();
      fetchReminders();
    } catch (error) {
      console.error('Error saving reminder:', error);
      showNotification('Failed to save reminder', 'error');
    }
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setFormData({
      bill_name: reminder.bill_name,
      amount: reminder.amount,
      due_date: reminder.due_date,
      category_id: reminder.category_id,
      recurring: reminder.recurring || 'one-time'
    });
    setShowForm(true);
  };

  const handleMarkPaid = async (id) => {
    try {
      await remindersAPI.markAsPaid(id);
      showNotification('Bill marked as paid', 'success');
      fetchReminders();
    } catch (error) {
      console.error('Error marking as paid:', error);
      showNotification('Failed to mark as paid', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;

    try {
      await remindersAPI.delete(id);
      showNotification('Reminder deleted successfully', 'success');
      fetchReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      showNotification('Failed to delete reminder', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      bill_name: '',
      amount: '',
      due_date: '',
      category_id: '',
      recurring: 'one-time'
    });
  };

  const getStatusColor = (reminder) => {
    const today = new Date();
    const dueDate = new Date(reminder.due_date);

    if (reminder.status === 'paid') return '#48c774';
    if (dueDate < today) return '#f14668';
    if (dueDate <= new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)) return '#ff9500';
    return '#666';
  };

  const getStatusText = (reminder) => {
    const today = new Date();
    const dueDate = new Date(reminder.due_date);

    if (reminder.status === 'paid') return 'Paid';
    if (dueDate < today) return 'Overdue';
    if (dueDate <= new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)) return 'Due Soon';
    return 'Upcoming';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <h2 style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          margin: 0,
          color: '#001435'
        }}>
          <FaBell style={{ color: '#667eea' }} />
          Bill Reminders
          {reminders.length > 0 && (
            <span style={{
              fontSize: '14px',
              background: 'rgba(102, 126, 234, 0.1)',
              color: '#667eea',
              padding: '4px 12px',
              borderRadius: '20px',
              fontWeight: '500'
            }}>
              {reminders.length} reminders
            </span>
          )}
        </h2>

        <button
          onClick={() => {
            setShowForm(true);
            setEditingReminder(null);
            resetForm();
          }}
          style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '500'
          }}
        >
          <FaPlus /> Add Reminder
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3 style={{ marginBottom: '20px', color: '#001435' }}>
            {editingReminder ? 'Edit Reminder' : 'Add New Reminder'}
          </h3>

          <form onSubmit={handleSubmit} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#001435' }}>
                Bill Name *
              </label>
              <input
                type="text"
                value={formData.bill_name}
                onChange={(e) => setFormData({...formData, bill_name: e.target.value})}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid rgba(0, 163, 224, 0.2)',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                placeholder="e.g., Electricity Bill, Internet, Rent"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#001435' }}>
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid rgba(0, 163, 224, 0.2)',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#001435' }}>
                Due Date *
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid rgba(0, 163, 224, 0.2)',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#001435' }}>
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid rgba(0, 163, 224, 0.2)',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {normalizeCategoryIcon(category.icon, category.name)} {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#001435' }}>
                Recurring
              </label>
              <select
                value={formData.recurring}
                onChange={(e) => setFormData({...formData, recurring: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid rgba(0, 163, 224, 0.2)',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value="one-time">One-time</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingReminder(null);
                  resetForm();
                }}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  color: '#001435',
                  border: '2px solid rgba(0, 163, 224, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                {editingReminder ? 'Update Reminder' : 'Create Reminder'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reminders List */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '20px'
      }}>
        {reminders.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '80px 40px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            border: '2px dashed rgba(0, 163, 224, 0.3)'
          }}>
            <FaBell size={60} style={{ color: 'rgba(102, 126, 234, 0.3)', marginBottom: '20px' }} />
            <h3 style={{ color: '#001435', marginBottom: '10px' }}>No reminders yet</h3>
            <p style={{ color: 'rgba(0, 20, 53, 0.6)', marginBottom: '20px' }}>
              Create your first bill reminder to stay on top of your payments
            </p>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingReminder(null);
                resetForm();
              }}
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              <FaPlus style={{ marginRight: '8px' }} />
              Add Your First Reminder
            </button>
          </div>
        ) : (
          reminders.map(reminder => (
            <div key={reminder.id} style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Status indicator */}
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: getStatusColor(reminder)
              }}></div>

              {/* Header */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: 'rgba(0, 20, 53, 0.6)',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {getStatusText(reminder)}
                  </span>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: reminder.recurring !== 'one-time'
                      ? 'rgba(102, 126, 234, 0.1)'
                      : 'rgba(0, 163, 224, 0.1)',
                    color: reminder.recurring !== 'one-time' ? '#667eea' : '#00A3E0',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    <FaClock size={10} />
                    {reminder.recurring || 'one-time'}
                  </div>
                </div>
              </div>

              {/* Bill Name */}
              <div style={{ marginBottom: '12px' }}>
                <h4 style={{
                  color: '#001435',
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: '0',
                  lineHeight: '1.3'
                }}>
                  {reminder.bill_name}
                </h4>
              </div>

              {/* Category */}
              {reminder.category_name && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#001435',
                    border: '1px solid rgba(0, 20, 53, 0.1)'
                  }}>
                    <span style={{ fontSize: '14px' }}>{normalizeCategoryIcon(reminder.icon, reminder.category_name)}</span>
                    {reminder.category_name}
                  </div>
                </div>
              )}

              {/* Amount and Date */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#001435'
                }}>
                  {formatCurrency(reminder.amount)}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'rgba(0, 20, 53, 0.7)',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  <FaCalendarAlt />
                  {formatDate(reminder.due_date)}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {reminder.status !== 'paid' && (
                  <button
                    onClick={() => handleMarkPaid(reminder.id)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #48c774, #38a169)',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <FaCheckCircle size={14} />
                    Mark Paid
                  </button>
                )}

                <button
                  onClick={() => handleEdit(reminder)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#667eea',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  title="Edit reminder"
                >
                  <FaBell size={14} />
                </button>

                <button
                  onClick={() => handleDelete(reminder.id)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#f14668',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  title="Delete reminder"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reminders;