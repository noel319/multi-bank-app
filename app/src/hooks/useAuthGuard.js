import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const useAuthGuard = (redirectTo = '/login') => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate(redirectTo);
    }
  }, [user, loading, navigate, redirectTo]);

  return { user, loading };
};

// components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children, redirectTo = '/login' }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-blue-dark"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

// utils/httpInterceptor.js
import { tokenService } from '../services/tokenService';
import { authAPI } from '../services/authAPI';

class HttpInterceptor {
  constructor() {
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Override fetch to add automatic token refresh
    const originalFetch = window.fetch;
    
    window.fetch = async (url, options = {}) => {
      const token = tokenService.getToken();
      
      // Add token to headers if available
      if (token && !tokenService.isTokenExpired(token)) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      
      // Check if token needs refresh
      if (token && tokenService.shouldRefreshToken(token)) {
        try {
          const response = await authAPI.refreshToken();
          tokenService.setToken(response.token);
          options.headers.Authorization = `Bearer ${response.token}`;
        } catch (error) {
          console.error('Token refresh failed:', error);
          tokenService.removeToken();
          window.location.href = '/login';
        }
      }

      const response = await originalFetch(url, options);

      // Handle unauthorized responses
      if (response.status === 401) {
        tokenService.removeToken();
        window.location.href = '/login';
      }

      return response;
    };
  }
}

export const httpInterceptor = new HttpInterceptor();