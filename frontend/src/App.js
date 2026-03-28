// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UploadProvider } from './context/UploadContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import PrivateRoute from './components/PrivateRoute';
import TopNav from './components/TopNav';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Goals from './pages/Goals';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Upload from './pages/Upload';
import Notifications from './pages/Notifications';
import Auth from './pages/Auth'; // ✅ Single import from pages
import './App.css';

const AuthenticatedLayout = ({ children }) => (
  <>
    <TopNav />
    {children}
  </>
);

const privateRoute = (element) => (
  <PrivateRoute>
    <AuthenticatedLayout>{element}</AuthenticatedLayout>
  </PrivateRoute>
);

function App() {
  return (
    <AuthProvider>
      <UploadProvider>
        <ThemeProvider>
          <NotificationProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <div className="App">
              <Routes>
                <Route path="/login" element={<Auth />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/register" element={<Auth />} />
                <Route path="/dashboard" element={privateRoute(<Dashboard />)} />
                <Route path="/goals" element={privateRoute(<Goals />)} />
                <Route path="/expenses" element={privateRoute(<Expenses />)} />
                <Route path="/reports" element={privateRoute(<Reports />)} />
                <Route path="/notifications" element={privateRoute(<Notifications />)} />
                <Route path="/settings" element={privateRoute(<Settings />)} />
                <Route path="/upload" element={privateRoute(<Upload />)} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
                      </Routes>
                    </div>
                  </Router>
            </NotificationProvider>
        </ThemeProvider>
      </UploadProvider>
    </AuthProvider>
  );
}

export default App;