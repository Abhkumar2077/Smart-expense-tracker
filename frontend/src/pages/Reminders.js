// frontend/src/pages/Reminders.js
import React, { useState, useEffect } from 'react';
import { FaBell, FaPlus, FaCalendarAlt, FaTrash, FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
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

  const [stats, setStats] = useState({
    totalUpcoming: 0,
    totalOverdue: 0,
    totalPaid: 0,
    totalAmount: 0,
    upcomingCount: 0,
    overdueCount: 0,
    paidCount: 0
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

  const calculateStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = reminders.filter(r => {
      const dueDate = new Date(r.due_date);
      return dueDate >= today && r.status !== 'paid';
    });

    const overdue = reminders.filter(r => {
      const dueDate = new Date(r.due_date);
      return dueDate < today && r.status !== 'paid';
    });

    const paid = reminders.filter(r => r.status === 'paid');

    const totalAmount = reminders.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

    setStats({
      totalUpcoming: upcoming.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
      totalOverdue: overdue.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
      totalPaid: paid.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
      totalAmount,
      upcomingCount: upcoming.length,
      overdueCount: overdue.length,
      paidCount: paid.length
    });
  };

  useEffect(() => {
    calculateStats();
  }, [reminders]);

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
       <div style={{
         display: 'flex',
         justifyContent: 'center',
         alignItems: 'center',
         height: '80vh',
         flexDirection: 'column',
         gap: '20px'
       }}>
         <div>
           <div className="loading-spinner" style={{
             border: '4px solid #f3f3f3',
             borderTop: '4px solid #667eea',
             borderRadius: '50%',
             width: '50px',
             height: '50px',
             animation: 'spin 1s linear infinite'
           }}></div>
           <p style={{ color: '#666' }}>Loading reminders...</p>
         </div>
       </div>
     );
   }

   // Add CSS animation for loading spinner
   const styleSheet = document.createElement("style");
   styleSheet.textContent = `
     @keyframes spin {
       0% { transform: rotate(0deg); }
       100% { transform: rotate(360deg); }
     }
   `;
   document.head.appendChild(styleSheet);

   return (
     <div style={{
       background: 'linear-gradient(135deg, #E6F3FF 0%, #B3D9FF 50%, #80BFFF 100%)',
       padding: '32px'
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
         padding: '24px 32px',
         borderRadius: '16px',
         boxShadow: '0 12px 40px rgba(0, 3, 135, 0.3)',
         position: 'relative',
         overflow: 'hidden'
       }}>
         <div style={{ position: 'relative', zIndex: 1 }}>
           <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
             <FaBell style={{ color: '#ADD8E6' }} />
             Bill Reminders
             {reminders.length > 0 && (
               <span style={{
                 fontSize: '14px',
                 background: 'rgba(173, 216, 230, 0.8)',
                 color: '#001435',
                 padding: '4px 12px',
                 borderRadius: '20px',
                 marginLeft: '10px',
                 backdropFilter: 'blur(5px)',
                 border: '1px solid rgba(255, 255, 255, 0.3)'
               }}>
                 {reminders.length} reminders
               </span>
             )}
           </h2>
         </div>

         <div style={{ display: 'flex', gap: '10px', position: 'relative', zIndex: 1 }}>
           <button
             onClick={() => {
               setShowForm(true);
               setEditingReminder(null);
               resetForm();
             }}
             style={{
               background: 'rgba(173, 216, 230, 0.8)',
               backdropFilter: 'blur(5px)',
               color: '#001435',
               display: 'flex',
               alignItems: 'center',
               gap: '8px',
               padding: '10px 16px',
               border: '1px solid rgba(255, 255, 255, 0.3)',
               borderRadius: '8px',
               cursor: 'pointer',
               fontWeight: '500'
             }}
           >
             <FaPlus /> Add Reminder
           </button>
         </div>
       </div>

       {/* Summary Cards */}
       <div style={{
         display: 'grid',
         gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
         gap: '24px',
         marginBottom: '48px'
       }}>
         {/* Total Upcoming Card */}
         <div style={{
           background: '#f8fbff',
           borderRadius: '16px',
           padding: '24px',
           boxShadow: '0 4px 16px rgba(0, 48, 135, 0.1)',
           border: '2px solid rgba(0, 48, 135, 0.15)',
           transition: 'transform 0.2s ease'
         }}>
           <div style={{
             display: 'flex',
             alignItems: 'center',
             gap: '12px',
             marginBottom: '16px'
           }}>
             <div style={{
               width: '44px',
               height: '44px',
               borderRadius: '12px',
               background: '#003087',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center'
             }}>
               <FaClock style={{ color: 'white', fontSize: '18px' }} />
             </div>
             <div>
               <h4 style={{
                 color: '#003087',
                 fontSize: '15px',
                 fontWeight: '600',
                 margin: '0 0 4px 0'
               }}>
                 Upcoming
               </h4>
               <p style={{
                 color: 'rgba(0, 48, 135, 0.6)',
                 fontSize: '12px',
                 margin: '0',
                 fontWeight: '500'
               }}>
                 {stats.upcomingCount} reminders
               </p>
             </div>
           </div>

           <div style={{
             fontSize: '28px',
             fontWeight: '700',
             color: '#003087',
             marginBottom: '12px'
           }}>
             ₹{stats.totalUpcoming.toFixed(2)}
           </div>

           <div style={{
             width: '100%',
             height: '6px',
             background: 'rgba(0, 48, 135, 0.1)',
             borderRadius: '3px',
             overflow: 'hidden'
           }}>
             <div style={{
               width: `${stats.totalAmount > 0 ? Math.min((stats.totalUpcoming / stats.totalAmount) * 100, 100) : 0}%`,
               height: '100%',
               background: '#003087',
               borderRadius: '3px',
               transition: 'width 0.3s ease'
             }}></div>
           </div>
         </div>

         {/* Total Overdue Card */}
         <div style={{
           background: '#f8fbff',
           borderRadius: '16px',
           padding: '24px',
           boxShadow: '0 4px 16px rgba(241, 70, 104, 0.1)',
           border: '2px solid rgba(241, 70, 104, 0.15)',
           transition: 'transform 0.2s ease'
         }}>
           <div style={{
             display: 'flex',
             alignItems: 'center',
             gap: '12px',
             marginBottom: '16px'
           }}>
             <div style={{
               width: '44px',
               height: '44px',
               borderRadius: '12px',
               background: '#f14668',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center'
             }}>
               <FaExclamationTriangle style={{ color: 'white', fontSize: '18px' }} />
             </div>
             <div>
               <h4 style={{
                 color: '#f14668',
                 fontSize: '15px',
                 fontWeight: '600',
                 margin: '0 0 4px 0'
               }}>
                 Overdue
               </h4>
               <p style={{
                 color: 'rgba(241, 70, 104, 0.6)',
                 fontSize: '12px',
                 margin: '0',
                 fontWeight: '500'
               }}>
                 {stats.overdueCount} reminders
               </p>
             </div>
           </div>

           <div style={{
             fontSize: '28px',
             fontWeight: '700',
             color: '#f14668',
             marginBottom: '12px'
           }}>
             ₹{stats.totalOverdue.toFixed(2)}
           </div>

           <div style={{
             width: '100%',
             height: '6px',
             background: 'rgba(241, 70, 104, 0.1)',
             borderRadius: '3px',
             overflow: 'hidden'
           }}>
             <div style={{
               width: `${stats.totalAmount > 0 ? Math.min((stats.totalOverdue / stats.totalAmount) * 100, 100) : 0}%`,
               height: '100%',
               background: '#f14668',
               borderRadius: '3px',
               transition: 'width 0.3s ease'
             }}></div>
           </div>
         </div>

         {/* Total Paid Card */}
         <div style={{
           background: '#ffffff',
           borderRadius: '16px',
           padding: '24px',
           boxShadow: '0 4px 16px rgba(72, 199, 116, 0.1)',
           border: '2px solid rgba(72, 199, 116, 0.15)',
           transition: 'transform 0.2s ease'
         }}>
           <div style={{
             display: 'flex',
             alignItems: 'center',
             gap: '12px',
             marginBottom: '16px'
           }}>
             <div style={{
               width: '44px',
               height: '44px',
               borderRadius: '12px',
               background: '#48c774',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center'
             }}>
               <FaCheckCircle style={{ color: 'white', fontSize: '18px' }} />
             </div>
             <div>
               <h4 style={{
                 color: '#48c774',
                 fontSize: '15px',
                 fontWeight: '600',
                 margin: '0 0 4px 0'
               }}>
                 Paid
               </h4>
               <p style={{
                 color: 'rgba(72, 199, 116, 0.6)',
                 fontSize: '12px',
                 margin: '0',
                 fontWeight: '500'
               }}>
                 {stats.paidCount} reminders
               </p>
             </div>
           </div>

           <div style={{
             fontSize: '28px',
             fontWeight: '700',
             color: '#48c774',
             marginBottom: '12px'
           }}>
             ₹{stats.totalPaid.toFixed(2)}
           </div>

           <div style={{
             width: '100%',
             height: '6px',
             background: 'rgba(72, 199, 116, 0.1)',
             borderRadius: '3px',
             overflow: 'hidden'
           }}>
             <div style={{
               width: `${stats.totalAmount > 0 ? Math.min((stats.totalPaid / stats.totalAmount) * 100, 100) : 0}%`,
               height: '100%',
               background: '#48c774',
               borderRadius: '3px',
               transition: 'width 0.3s ease'
             }}></div>
           </div>
         </div>
       </div>

      {/* Add/Edit Reminder Section */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.96)',
        borderRadius: '20px',
        padding: '28px',
        marginBottom: '40px',
        boxShadow: '0 10px 32px rgba(0, 20, 53, 0.1)',
        border: '1px solid rgba(0, 48, 135, 0.12)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '18px'
        }}>
          <div>
            <h3 style={{ margin: 0, color: '#001435' }}>
              {editingReminder ? 'Edit Reminder' : 'Add New Reminder'}
            </h3>
            <p style={{ margin: '6px 0 0', color: '#4f6d8a' }}>
              {editingReminder ? 'Modify your bill reminder details' : 'Create a new bill reminder to stay on track'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '18px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#001435',
              marginBottom: '8px'
            }}>
              Bill Name *
            </label>
            <input
              type="text"
              value={formData.bill_name}
              onChange={(e) => setFormData({...formData, bill_name: e.target.value})}
              required
              style={{
                padding: '11px 12px',
                borderRadius: '10px',
                border: '1px solid #bed3e7',
                width: '100%'
              }}
              placeholder="e.g., Electricity Bill, Internet, Rent"
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#001435',
              marginBottom: '8px'
            }}>
              Amount *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              required
              style={{
                padding: '11px 12px',
                borderRadius: '10px',
                border: '1px solid #bed3e7',
                width: '100%'
              }}
              placeholder="0.00"
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#001435',
              marginBottom: '8px'
            }}>
              Due Date *
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              required
              style={{
                padding: '11px 12px',
                borderRadius: '10px',
                border: '1px solid #bed3e7',
                width: '100%'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#001435',
              marginBottom: '8px'
            }}>
              Category
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({...formData, category_id: e.target.value})}
              style={{
                padding: '11px 12px',
                borderRadius: '10px',
                border: '1px solid #bed3e7',
                width: '100%'
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
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#001435',
              marginBottom: '8px'
            }}>
              Recurring
            </label>
            <select
              value={formData.recurring}
              onChange={(e) => setFormData({...formData, recurring: e.target.value})}
              style={{
                padding: '11px 12px',
                borderRadius: '10px',
                border: '1px solid #bed3e7',
                width: '100%'
              }}
            >
              <option value="one-time">One-time</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingReminder(null);
                resetForm();
              }}
              style={{
                padding: '11px 24px',
                borderRadius: '10px',
                border: '2px solid rgba(0, 163, 224, 0.3)',
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#001435',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '11px 24px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #003087 0%, #00A3E0 100%)',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FaBell />
              {editingReminder ? 'Update Reminder' : 'Create Reminder'}
            </button>
          </div>
        </form>
      </div>

      {/* Reminders List */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h3 style={{
          color: '#001435',
          fontWeight: '700',
          fontSize: '20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '6px',
            height: '20px',
            background: 'linear-gradient(135deg, #003087, #00A3E0)',
            borderRadius: '3px'
          }}></div>
          All Reminders
          <span style={{
            fontSize: '14px',
            background: 'rgba(0, 48, 135, 0.1)',
            color: '#003087',
            padding: '4px 12px',
            borderRadius: '20px',
            marginLeft: '10px'
          }}>
            {reminders.length} reminders
          </span>
        </h3>

        {reminders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <FaBell size={60} style={{ color: 'rgba(0, 48, 135, 0.3)', marginBottom: '20px' }} />
            <h4 style={{ color: '#001435', marginBottom: '10px' }}>No reminders yet</h4>
            <p style={{ color: 'rgba(0, 20, 53, 0.6)' }}>
              Create your first bill reminder to stay on top of your payments
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reminders.map(reminder => {
                const category = categories.find(c => c.id === reminder.category_id);
                const categoryIcon = reminder.icon || (category?.icon || '🔔');

                return (
                  <div
                    key={reminder.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      background: 'white',
                      borderRadius: '12px',
                      border: '1px solid rgba(0, 48, 135, 0.1)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 48, 135, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'rgba(0, 163, 224, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px'
                      }}>
                        {categoryIcon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#001435', marginBottom: '4px' }}>
                          {reminder.bill_name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(0, 20, 53, 0.6)' }}>
                          {category?.name || 'Uncategorized'} • Due: {formatDate(reminder.due_date)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#00A3E0'
                      }}>
                        {formatCurrency(reminder.amount)}
                      </div>

                      {reminder.status !== 'paid' ? (
                        <>
                          <button
                            onClick={() => handleMarkPaid(reminder.id)}
                            style={{
                              padding: '8px',
                              borderRadius: '8px',
                              border: 'none',
                              background: 'rgba(72, 199, 116, 0.1)',
                              color: '#48c774',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(72, 199, 116, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(72, 199, 116, 0.1)';
                            }}
                            title="Mark as paid"
                          >
                            <FaCheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => handleEdit(reminder)}
                            style={{
                              padding: '8px',
                              borderRadius: '8px',
                              border: 'none',
                              background: 'transparent',
                              color: '#667eea',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                            title="Edit reminder"
                          >
                            <FaBell size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(reminder.id)}
                            style={{
                              padding: '8px',
                              borderRadius: '8px',
                              border: 'none',
                              background: 'transparent',
                              color: '#f14668',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(241, 70, 104, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                            title="Delete reminder"
                          >
                            <FaTrash size={14} />
                          </button>
                        </>
                      ) : (
                        <span style={{
                          fontSize: '12px',
                          background: 'rgba(72, 199, 116, 0.1)',
                          color: '#48c774',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontWeight: '600'
                        }}>
                          Paid
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Reminders;