import React from 'react';
import Sidebar from '../components/Sidebar';
import Notifications from '../components/Notifications';
import AIDashboard from '../components/AIDashboard';

const NotificationsPage = () => {
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <h2 style={{ marginBottom: '20px' }}>Notifications</h2>

        {/* AI pattern/alert insights, now included on the Notifications page */}
        <div className="card insight-section" style={{ marginBottom: '20px', padding: '0' }}>
          <AIDashboard />
        </div>

        {/* In-app notification list */}
        <Notifications />
      </div>
    </div>
  );
};

export default NotificationsPage;
