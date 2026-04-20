// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UploadProvider } from './context/UploadContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import PrivateRoute from './components/PrivateRoute';
import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Goals from './pages/Goals';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Upload from './pages/Upload';
import Notifications from './pages/Notifications';
import Auth from './pages/Auth'; // ✅ Single import from pages
import AIDashboard from './components/AIDashboard';
import './App.css';

const AuthenticatedLayout = ({ children, toggleSidebar }) => (
  <>
    <TopNav toggleSidebar={toggleSidebar} />
    <div className="main-content">
      {children}
    </div>
  </>
);

const privateRoute = (element, sidebarCollapsed, toggleSidebar) => (
  <PrivateRoute>
    <AuthenticatedLayout toggleSidebar={toggleSidebar}>{element}</AuthenticatedLayout>
  </PrivateRoute>
);

function App() {
  return (
    <AuthProvider>
      <UploadProvider>
        <ThemeProvider>
          <NotificationProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <AppContent />
            </Router>
          </NotificationProvider>
        </ThemeProvider>
      </UploadProvider>
    </AuthProvider>
  );
}

const AppContent = () => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  const isAuthPage = ['/login', '/auth', '/register'].includes(location.pathname);

  return (
    <div className={`App dashboard ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {!isAuthPage && <Sidebar collapsed={sidebarCollapsed} />}
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
        <Route path="/dashboard" element={privateRoute(<Dashboard />, sidebarCollapsed, toggleSidebar)} />
        <Route path="/goals" element={privateRoute(<Goals />, sidebarCollapsed, toggleSidebar)} />
        <Route path="/expenses" element={privateRoute(<Expenses />, sidebarCollapsed, toggleSidebar)} />
        <Route path="/reports" element={privateRoute(<Reports />, sidebarCollapsed, toggleSidebar)} />
        <Route path="/ai" element={privateRoute(<AIDashboard />, sidebarCollapsed, toggleSidebar)} />
        <Route path="/notifications" element={privateRoute(<Notifications />, sidebarCollapsed, toggleSidebar)} />
        <Route path="/settings" element={privateRoute(<Settings />, sidebarCollapsed, toggleSidebar)} />
        <Route path="/upload" element={privateRoute(<Upload />, sidebarCollapsed, toggleSidebar)} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  );
};

export default App;