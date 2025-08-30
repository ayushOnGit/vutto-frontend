import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Login from './components/Login';
import SettlementConfigDashboard from './components/SettlementConfigDashboard';
import ChallanDatabaseDashboard from './components/ChallanDatabaseDashboard';
import RBACManagement from './components/RBACManagement';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Main App component with authentication
function AppContent() {
  const { isAuthenticated, user, login, logout } = useAuth();

  // If not authenticated, show login
  if (!isAuthenticated || !user) {
    return <Login onLogin={login} />;
  }

  // If authenticated, show main app
  return (
    <div className="App">
      <Navigation user={user} onLogout={logout} />
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route 
            path="/" 
            element={<Navigate to={user.role === 'employee' ? '/database' : '/settlement'} replace />} 
          />
          <Route 
            path="/settlement" 
            element={
              <ProtectedRoute requiredPermission={{ resource: 'settlement_config', action: 'read' }}>
                <SettlementConfigDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/database" 
            element={
              <ProtectedRoute requiredPermission={{ resource: 'challan_dashboard', action: 'read' }}>
                <ChallanDatabaseDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/rbac" 
            element={
              <ProtectedRoute requiredPermission={{ resource: 'user_management', action: 'read' }}>
                <RBACManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="*" 
            element={<Navigate to={user.role === 'employee' ? '/database' : '/settlement'} replace />} 
          />
        </Routes>
      </div>
    </div>
  );
}

// Root App component with providers
function App() {
  return (
    <GoogleOAuthProvider clientId="1015139019509-na1airmo1cqvjt82mm8kjr5uc7goaf8f.apps.googleusercontent.com">
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;