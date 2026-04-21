// frontend/src/pages/Settings.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CategoryManager from '../components/CategoryManager';
import AppearanceSettings from '../components/AppearanceSettings';
import { FaUser, FaShieldAlt, FaPalette, FaTags } from 'react-icons/fa';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', name: 'Profile', icon: <FaUser /> },
    { id: 'categories', name: 'Categories', icon: <FaTags /> },
    { id: 'appearance', name: 'Appearance', icon: <FaPalette /> },
    { id: 'privacy', name: 'Privacy', icon: <FaShieldAlt /> },
  ];

  return (
    <div className="main-content">
        <h2 style={{ marginBottom: '30px' }}>Settings</h2>

        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          {/* Sidebar Tabs */}
          <div style={{ width: '250px', minWidth: '200px' }}>
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    width: '100%',
                    padding: '15px 20px',
                    textAlign: 'left',
                    background: activeTab === tab.id ? 'linear-gradient(135deg, #003087, #00A3E0)' : 'white',
                    color: activeTab === tab.id ? 'white' : '#2c3e50',
                    border: 'none',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.3s'
                  }}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Profile Information</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '30px', flexWrap: 'wrap' }}>
                    <div style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #003087, #00A3E0)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '40px',
                      color: 'white'
                    }}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '24px', marginBottom: '5px' }}>{user?.name}</h3>
                      <p style={{ color: '#666' }}>{user?.email}</p>
                      <p style={{ color: '#666', fontSize: '14px' }}>Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>

                  <form>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input
                          type="text"
                          className="form-control"
                          defaultValue={user?.name}
                          placeholder="Enter your name"
                        />
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          className="form-control"
                          defaultValue={user?.email}
                          placeholder="Enter your email"
                          disabled
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary">
                      Update Profile
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

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <AppearanceSettings />
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Privacy & Security</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ marginBottom: '30px' }}>
                    <h4 style={{ marginBottom: '15px' }}>Change Password</h4>
                    <form style={{ maxWidth: '400px' }}>
                      <div className="form-group">
                        <label>Current Password</label>
                        <input type="password" className="form-control" />
                      </div>
                      <div className="form-group">
                        <label>New Password</label>
                        <input type="password" className="form-control" />
                      </div>
                      <div className="form-group">
                        <label>Confirm New Password</label>
                        <input type="password" className="form-control" />
                      </div>
                      <button type="submit" className="btn btn-primary">
                        Update Password
                      </button>
                    </form>
                  </div>
                  
                  <div style={{ borderTop: '1px solid #eee', paddingTop: '30px' }}>
                    <h4 style={{ marginBottom: '15px', color: '#f14668' }}>Danger Zone</h4>
                    <button className="btn btn-danger">
                      Delete Account
                    </button>
                    <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
                      This action cannot be undone. All your data will be permanently deleted.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };


export default Settings;
