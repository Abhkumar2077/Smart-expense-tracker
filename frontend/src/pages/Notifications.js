import React from 'react';
import AIDashboard from '../components/AIDashboard';

const NotificationsPage = () => {
  return (
    <div>
        <h2 style={{ marginBottom: '20px' }}>Notifications</h2>

        <div className="card insight-section" style={{ marginBottom: '20px', padding: '0' }}>
          <AIDashboard />
        </div>
    </div>
  );
};

export default NotificationsPage;
