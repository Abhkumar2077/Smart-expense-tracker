// frontend/src/pages/Settings.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import CategoryManager from '../components/CategoryManager';
import { FaUser, FaShieldAlt } from 'react-icons/fa';
import { MdCategory } from 'react-icons/md';

const Settings = () => {
  const { user, login } = useAuth();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Update profile data when user changes
  useEffect(() => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || ''
    });
  }, [user]);

  const tabs = [
    { id: 'profile', name: 'Profile', icon: <FaUser /> },
    { id: 'categories', name: 'Categories', icon: <MdCategory /> },
    { id: 'privacy', name: 'Privacy', icon: <FaShieldAlt /> },
  ];

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await userAPI.updateProfile(profileData);
      login({ ...user, ...res.data.user });
      showNotification('Profile updated successfully!', 'success');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('New passwords do not match', 'error');
      return;
    }

    setLoading(true);

    try {
      await userAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      showNotification('Password updated successfully!', 'success');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content settings-container">
        <h2 style={{ marginBottom: '30px', fontSize: '32px', fontWeight: '700' }}>Settings</h2>

        {/* Mini Navigation Bar */}
        <div className="settings-nav-bar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.icon}
              <span className="tab-text">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="settings-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Profile Information</h3>
              </div>
              <div style={{ padding: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '40px', marginBottom: '40px', flexWrap: 'wrap' }}>
                  <div style={{
                    width: '140px',
                    height: '140px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #003087, #00A3E0)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '50px',
                    color: 'white',
                    boxShadow: '0 8px 16px rgba(0, 48, 135, 0.3)'
                  }}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '28px', marginBottom: '8px', fontWeight: '600' }}>{user?.name}</h3>
                    <p style={{ color: '#666', fontSize: '18px' }}>{user?.email}</p>
                    <p style={{ color: '#666', fontSize: '16px' }}>Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>

                <form onSubmit={handleProfileSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        placeholder="Enter your name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div style={{ marginTop: '0' }}>
              <CategoryManager onCategoryChange={() => {
                window.dispatchEvent(new Event('categories-updated'));
              }} />
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Privacy & Security</h3>
              </div>
              <div style={{ padding: '30px' }}>
                <div style={{ marginBottom: '40px' }}>
                  <h4 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '600' }}>Change Password</h4>
                  <form onSubmit={handlePasswordSubmit} style={{ maxWidth: '400px' }}>
                    <div className="form-group">
                      <label>Current Password</label>
                      <input 
                        type="password" 
                        className="form-control"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>New Password</label>
                      <input 
                        type="password" 
                        className="form-control"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        required
                        minLength="6"
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input 
                        type="password" 
                        className="form-control"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        required
                        minLength="6"
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
                
                <div style={{ borderTop: '2px solid #eee', paddingTop: '40px' }}>
                  <h4 style={{ marginBottom: '20px', color: '#f14668', fontSize: '20px', fontWeight: '600' }}>Danger Zone</h4>
                  <button className="btn btn-danger" style={{ fontSize: '16px', padding: '12px 24px' }}>
                    Delete Account
                  </button>
                  <p style={{ color: '#666', fontSize: '16px', marginTop: '12px' }}>
                    This action cannot be undone. All your data will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };


export default Settings;
