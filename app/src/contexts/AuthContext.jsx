import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Check for existing session on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const response = await window.electronAPI.callPython({
        action: 'check_auth_status'
      });

      if (response.success && response.data.authenticated) {
        setUser(response.data.user);
        setToken(response.data.token);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      const response = await window.electronAPI.callPython({
        action: 'login',
        payload: { email, password }
      });

      if (response.success) {
        setUser(response.data.user);
        setToken(response.data.token);
        return response;
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async (credentialResponse) => {
    try {
      const response = await window.electronAPI.callPython({
        action: 'google_login',
        payload: { credential: credentialResponse.credential }
      });

      if (response.success) {
        setUser(response.data.user);
        setToken(response.data.token);
        return response;
      } else {
        throw new Error(response.error || 'Google login failed');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email, password, name) => {
    try {
      const response = await window.electronAPI.callPython({
        action: 'register',
        payload: { email, password, name }
      });

      if (response.success) {
        setUser(response.data.user);
        setToken(response.data.token);
        return response;
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await window.electronAPI.callPython({
        action: 'logout',
        payload: { token }
      });
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  const refreshToken = async () => {
    try {
      const response = await window.electronAPI.callPython({
        action: 'refresh_token',
        payload: { token }
      });

      if (response.success) {
        setToken(response.data.token);
        return response.data.token;
      } else {
        // Token refresh failed, sign out user
        await signOut();
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    loading,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    refreshToken,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Google Login Button Component
export const GoogleLoginButton = ({ onSuccess, onError }) => {
  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: 'outline',
            size: 'large',
            width: '100%',
          }
        );
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = async (response) => {
    try {
      await onSuccess(response);
    } catch (error) {
      onError(error);
    }
  };

  return <div id="google-signin-button" className="w-full"></div>;
};