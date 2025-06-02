import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import {AppProvider } from './contexts/AppContext';
import MainLayout from './components/Layout/MainLayout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import AccountDetailsPage from './pages/AccountDetailsPage';
import TransactionsPage from './pages/TransactionsPage';
import CostCentersPage from './pages/CostCentersPage';
import DashboardPage from './pages/DashboardPage';
import RegisterPage from './pages/RegisterPage';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function AppContent() {
  const { user } = useAuth(); // To determine initial redirect for '*' route

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout><HomePage /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/bank-details/:accountId" element={
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
    <AuthProvider>
      <AppProvider> {/* This provides mock data for UI development */}
        {/* AppDataProvider would wrap AppContent if using real data flow */}
        <Router>
          <AppContent/>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;