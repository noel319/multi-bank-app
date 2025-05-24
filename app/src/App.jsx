import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MockDataProvider } from './contexts/MockDataContext';
import MainLayout from './components/Layout/MainLayout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import AccountDetailsPage from './pages/AccountDetailsPage';
import TransactionsPage from './pages/TransactionsPage';
import CostCentersPage from './pages/CostCentersPage';
import DashboardPage from './pages/DashboardPage';

function ProtectedRoute({ children }) {
  const { user, isGapiLoaded } = useAuth(); // isGapiLoaded from original AuthContext

  // Wait for GAPI to load before checking user, if using real Google Sign-In
  // For the current mock setup, isGapiLoaded is always true in the simplified AuthContext
  if (!isGapiLoaded && !user) { // Check if GAPI is not loaded AND user is not present from a previous session
      // This check is more for the real Google Sign-In. For mock, user is the primary check.
      // return <div>Loading authentication...</div>; // Or a spinner
  }

  return user ? children : <Navigate to="/login" replace />;
}

function AppContent() {
  const { user } = useAuth(); // To determine initial redirect for '*' route

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout><HomePage /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/accounts/:accountId" element={
        <ProtectedRoute>
          <MainLayout><AccountDetailsPage /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/transactions" element={
        <ProtectedRoute>
          <MainLayout><TransactionsPage /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/cost-centers" element={
        <ProtectedRoute>
          <MainLayout><CostCentersPage /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <MainLayout><DashboardPage /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <MockDataProvider> {/* This provides mock data for UI development */}
          {/* AppDataProvider would wrap AppContent if using real data flow */}
          <AppContent />
        </MockDataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;