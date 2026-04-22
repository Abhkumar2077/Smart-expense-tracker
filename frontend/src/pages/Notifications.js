import React, { useEffect, useMemo, useState } from 'react';
import { FaBell, FaClock, FaCheckCircle, FaExclamationTriangle, FaInbox } from 'react-icons/fa';
import SuggestionsInbox from '../components/SuggestionsInbox';
import WeeklyDigest from '../components/WeeklyDigest';
import { remindersAPI } from '../services/api';

const NotificationsPage = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const res = await remindersAPI.getAll();
        setReminders(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Failed to fetch reminders for notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReminders();
  }, []);

  const reminderSummary = useMemo(() => {
    const today = new Date();
    const pending = reminders.filter((r) => r.status !== 'paid');
    const overdue = pending.filter((r) => new Date(r.due_date) < today);
    const dueSoon = pending.filter((r) => {
      const dueDate = new Date(r.due_date);
      const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 3;
    });

    return {
      pending: pending.length,
      overdue: overdue.length,
      dueSoon: dueSoon.length,
      dueSoonItems: dueSoon.slice(0, 5)
    };
  }, [reminders]);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #FFF8E6 0%, #FFE8CC 50%, #FFD8A8 100%)',
      minHeight: 'calc(100vh - 60px)',
      padding: '32px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #7A1F1F 0%, #C2410C 55%, #EA580C 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '24px',
        color: '#fff',
        boxShadow: '0 12px 32px rgba(122, 31, 31, 0.25)'
      }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaBell /> Notification Center
        </h2>
        <p style={{ margin: '8px 0 0', opacity: 0.9 }}>
          Keep track of urgent reminders and pending suggestion actions.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>Pending Bills</div>
          <div style={{ fontSize: '30px', fontWeight: 700, color: '#1f2937' }}>
            {loading ? '...' : reminderSummary.pending}
          </div>
        </div>
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>Due Soon (3 days)</div>
          <div style={{ fontSize: '30px', fontWeight: 700, color: '#c2410c' }}>
            {loading ? '...' : reminderSummary.dueSoon}
          </div>
        </div>
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>Overdue</div>
          <div style={{ fontSize: '30px', fontWeight: 700, color: '#b91c1c' }}>
            {loading ? '...' : reminderSummary.overdue}
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaClock /> Upcoming Reminder Alerts
          </h3>
          {loading && <p>Loading reminder alerts...</p>}
          {!loading && reminderSummary.dueSoonItems.length === 0 && (
            <p style={{ color: '#666' }}>No due-soon reminders right now.</p>
          )}
          {!loading && reminderSummary.dueSoonItems.map((item) => (
            <div key={item.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              marginBottom: '10px'
            }}>
              <div>
                <div style={{ fontWeight: 600 }}>{item.bill_name}</div>
                <div style={{ color: '#666', fontSize: '13px' }}>
                  Due: {new Date(item.due_date).toLocaleDateString()}
                </div>
              </div>
              <div style={{ color: '#9a3412', fontWeight: 700 }}>
                ₹{parseFloat(item.amount || 0).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gap: '20px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaInbox /> Suggestions Inbox
            </h3>
            <SuggestionsInbox />
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaCheckCircle /> Weekly Digest
            </h3>
            <WeeklyDigest />
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '16px',
        fontSize: '13px',
        color: '#7c2d12',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <FaExclamationTriangle />
        Notifications is now separate from AI Analytics. Use /ai for deep AI analysis.
      </div>
    </div>
  );
};

export default NotificationsPage;
