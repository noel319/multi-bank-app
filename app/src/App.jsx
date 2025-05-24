import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BankDataProvider } from './contexts/BankDataContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AccountDetails } from './pages/AccountDetails';
import { Transactions } from './pages/Transactions';
import { CostCenters } from './pages/CostCenters';
import { MainLayout } from './components/layout/MainLayout';
import './index.css'
import './App.css'
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export function App() {
  return (
    <AuthProvider>
      <BankDataProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <PrivateRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </PrivateRoute>
            } />
            <Route path="/accounts/:id" element={
              <PrivateRoute>
                <MainLayout>
                  <AccountDetails />
                </MainLayout>
              </PrivateRoute>
            } />
            <Route path="/transactions" element={
              <PrivateRoute>
                <MainLayout>
                  <Transactions />
                </MainLayout>
              </PrivateRoute>
            } />
            <Route path="/cost-centers" element={
              <PrivateRoute>
                <MainLayout>
                  <CostCenters />
                </MainLayout>
              </PrivateRoute>
            } />
          </Routes>
        </Router>
      </BankDataProvider>
    </AuthProvider>
  );
}