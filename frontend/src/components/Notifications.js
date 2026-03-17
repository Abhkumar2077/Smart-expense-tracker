// frontend/src/components/Notifications.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { 
  FaBell, FaCheckCircle, FaExclamationTriangle, 
  FaMoneyBillWave, FaTrophy, FaLightbulb,
  FaEnvelope, FaMobile, FaClock, FaCog,
  FaTrash, FaCheck, FaTimes
} from 'react-icons/fa';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [saving, setSaving] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to Socket.io (use env var or default to localhost:5000)
    const socketUrl = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;
    const newSocket = io(socketUrl, { transports: ['websocket'] });
    setSocket(newSocket);

    // Authenticate with user ID
    const userId = JSON.parse(localStorage.getItem('user'))?.id;
    if (userId) {
      newSocket.emit('authenticate', String(userId));
    }

    // Listen for real-time notifications
    newSocket.on('notification', (data) => {
      console.log('🔔 Real-time notification:', data);
      
      if (data.type === 'new') {
        // Add new notification to list
        setNotifications(prev => [data.notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if permitted
        if (Notification.permission === 'granted') {
          new Notification(data.notification.title, {
            body: data.notification.message,
            icon: '/logo192.png'
          });
        }
      } else if (data.type === 'pending') {
        // Update with pending notifications
        setNotifications(data.notifications);
        setUnreadCount(data.count);
      }
    });

    // Request notification permission
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
    
    // Poll for new notifications every 60 seconds as backup
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/notifications');
      setNotifications(res.data);
      await fetchUnreadCount();
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get('/api/notifications/unread-count');
      setUnreadCount(res.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchPreferences = async () => {
    try {
      const res = await axios.get('/api/notifications/preferences');
      setPreferences(res.data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, status: 'read', read_at: new Date().toISOString() } : n
      ));
      await fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({
        ...n,
        status: 'read',
        read_at: n.status === 'read' ? n.read_at : new Date().toISOString()
      })));
      setUnreadCount(0);
      
      // Send real-time update
      if (socket) {
        socket.emit('notifications-read', { all: true });
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await axios.put('/api/notifications/preferences', preferences);
      alert('✅ Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('❌ Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'budget_alert': return <FaExclamationTriangle style={{ color: '#f14668' }} />;
      case 'large_transaction': return <FaMoneyBillWave style={{ color: '#ff9f1c' }} />;
      case 'achievement': return <FaTrophy style={{ color: '#ffd700' }} />;
      case 'tip': return <FaLightbulb style={{ color: '#48c774' }} />;
      default: return <FaBell />;
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading && !notifications.length) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <div className="loading-spinner"></div>
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h3 className="card-title">
            <FaBell /> Notifications
            {unreadCount > 0 && (
              <span style={{
                background: '#f14668',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                marginLeft: '10px',
                animation: 'pulse 2s infinite'
              }}>
                {unreadCount} new
              </span>
            )}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn"
            style={{ padding: '8px 16px' }}
          >
            <FaCog /> Settings
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="btn btn-primary"
              style={{ padding: '8px 16px' }}
            >
              <FaCheck /> Mark all read
            </button>
          )}
        </div>
      </div>

      {showSettings ? (
        <div style={{ padding: '20px' }}>
          <h4 style={{ marginBottom: '20px' }}>Notification Preferences</h4>
          
          {preferences && (
            <form onSubmit={(e) => { e.preventDefault(); savePreferences(); }}>
              {/* Email Notifications */}
              <div style={{ marginBottom: '25px' }}>
                <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                  <FaEnvelope /> Email Notifications
                </h5>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {[
                    { key: 'email_weekly_report', label: 'Weekly Reports' },
                    { key: 'email_monthly_report', label: 'Monthly Reports' },
                    { key: 'email_budget_alerts', label: 'Budget Alerts' },
                    { key: 'email_large_transaction', label: 'Large Transaction Alerts' },
                    { key: 'email_marketing', label: 'Tips & Promotions' }
                  ].map(item => (
                    <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={preferences[item.key]}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          [item.key]: e.target.checked
                        })}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* In-App Notifications */}
              <div style={{ marginBottom: '25px' }}>
                <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                  <FaBell /> In-App Notifications
                </h5>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {[
                    { key: 'in_app_budget_alerts', label: 'Budget Alerts' },
                    { key: 'in_app_achievements', label: 'Achievements' },
                    { key: 'in_app_tips', label: 'Daily Tips' },
                    { key: 'in_app_reminders', label: 'Reminders' }
                  ].map(item => (
                    <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={preferences[item.key]}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          [item.key]: e.target.checked
                        })}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Push Notifications */}
              <div style={{ marginBottom: '25px' }}>
                <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                  <FaMobile /> Push Notifications
                </h5>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={preferences.push_enabled}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        push_enabled: e.target.checked
                      })}
                    />
                    Enable Push Notifications
                  </label>
                </div>
                {preferences.push_enabled && (
                  <div style={{ marginLeft: '24px', display: 'grid', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={preferences.push_budget_alerts}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          push_budget_alerts: e.target.checked
                        })}
                      />
                      Budget Alerts
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={preferences.push_large_transaction}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          push_large_transaction: e.target.checked
                        })}
                      />
                      Large Transaction Alerts
                    </label>
                  </div>
                )}
              </div>

              {/* Schedule Settings */}
              <div style={{ marginBottom: '25px' }}>
                <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                  <FaClock /> Report Schedule
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Report Day</label>
                    <select
                      value={preferences.report_day}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        report_day: e.target.value
                      })}
                      className="form-control"
                    >
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                        <option key={day} value={day}>
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Report Time</label>
                    <input
                      type="time"
                      value={preferences.report_time}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        report_time: e.target.value
                      })}
                      className="form-control"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <FaBell size={40} style={{ opacity: 0.3, marginBottom: '15px' }} />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                style={{
                  padding: '15px 20px',
                  borderBottom: '1px solid var(--border-light)',
                  background: notification.status === 'read' ? 'transparent' : 'var(--primary-color)05',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '15px',
                  transition: 'background 0.3s',
                  cursor: 'pointer',
                  animation: notification.status !== 'read' ? 'fadeIn 0.5s' : 'none'
                }}
                onClick={() => notification.status !== 'read' && markAsRead(notification.id)}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <h4 style={{ 
                      margin: 0, 
                      fontSize: '16px',
                      fontWeight: notification.status === 'read' ? 'normal' : 'bold'
                    }}>
                      {notification.title}
                    </h4>
                    <span style={{ fontSize: '12px', color: '#999' }}>
                      {getTimeAgo(notification.created_at)}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                    {notification.message}
                  </p>
                  {notification.data && notification.data.amount && (
                    <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#667eea' }}>
                      Amount: ₹{notification.data.amount}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#999',
                    cursor: 'pointer',
                    padding: '5px'
                  }}
                >
                  <FaTrash />
                </button>
              </div>
            ))
          )}
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Notifications;