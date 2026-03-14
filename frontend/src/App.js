// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UploadProvider } from './context/UploadContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Upload from './pages/Upload';
import Auth from './pages/Auth'; // ✅ Single import from pages
import './App.css';

function App() {
  return (
    <AuthProvider>
      <UploadProvider>
        <ThemeProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="App">
              <Routes>
                <Route path="/login" element={<Auth />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/register" element={<Auth />} />
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
                <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                <Route path="/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
              </Routes>
            </div>
          </Router>
        </ThemeProvider>
      </UploadProvider>
    </AuthProvider>
  );
}

export default App;