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

  // Check if user is already logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await window.electronAPI.callPython({
        action: 'check_auth_status'
      });

      if (response.success && response.user) {
        setUser(response.user);
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
        action: 'login_user',
        payload: { email, password }
      });

      if (response.success) {
        setUser(response.user);
        return response;
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (name, email, password) => {
    try {
      const response = await window.electronAPI.callPython({
        action: 'register_user',
        payload: { name, email, password }
      });

      if (response.success) {
        setUser(response.user);
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
        action: 'logout_user'
      });
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear user state even if backend call fails
      setUser(null);
    }
  };

  const handleGoogleAuth = async (credentialResponse) => {
    try {
      const response = await window.electronAPI.callPython({
        action: 'google_auth',
        payload: { credential: credentialResponse.credential }
      });

      if (response.success) {
        setUser(response.user);
        return response;
      } else {
        throw new Error(response.error || 'Google authentication failed');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    handleGoogleAuth,
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
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID, // Add this to your .env file
          callback: onSuccess
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: 'outline',
            size: 'large',
            width: '100%'
          }
        );
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  }, [onSuccess]);

  return <div id="google-signin-button" className="w-full"></div>;
};