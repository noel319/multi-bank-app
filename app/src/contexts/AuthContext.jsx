import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);

  // Check if user is already logged in on app start
  useEffect(() => {
    checkAuthStatus();
    loadGoogleScript();
  }, []);

  const loadGoogleScript = useCallback(() => {
    // Check if script is already loaded
    if (window.google || googleScriptLoaded) {
      setGoogleScriptLoaded(true);
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setGoogleScriptLoaded(true);
        resolve();
      };
      
      script.onerror = () => {
        console.error('Failed to load Google Identity Services script');
        reject(new Error('Failed to load Google script'));
      };
      
      document.head.appendChild(script);
    });
  }, [googleScriptLoaded]);

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
      // Sign out from Google if user was logged in with Google
      if (window.google && user?.google_token) {
        window.google.accounts.id.disableAutoSelect();
      }
      
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
      if (!credentialResponse?.credential) {
        throw new Error('No credential received from Google');
      }

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

  const initiateGoogleLogin = useCallback(async () => {
    try {
      if (!googleScriptLoaded) {
        await loadGoogleScript();
      }

      if (!window.google) {
        throw new Error('Google Identity Services not available');
      }

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error('Google Client ID not configured');
      }

      // Initialize Google Sign-In
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleAuth,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      // Prompt the user to sign in
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Google Sign-In prompt was not displayed or was skipped');
        }
      });

    } catch (error) {
      console.error('Google login initiation error:', error);
      // Show error to user
      if (window.electronAPI?.showErrorDialog) {
        await window.electronAPI.showErrorDialog({
          title: 'Google Sign-In Error',
          content: error.message || 'Failed to initialize Google Sign-In'
        });
      }
      throw error;
    }
  }, [googleScriptLoaded, handleGoogleAuth, loadGoogleScript]);

  const connectGoogleSheets = async () => {
    try {
      // This would trigger additional Google Sheets scope authorization
      // You might need to implement a separate endpoint for this
      const response = await window.electronAPI.callPython({
        action: 'connect_google_sheets'
      });

      if (response.success) {
        // Update user with new google_token
        setUser(prev => ({ ...prev, google_token: response.google_token }));
        return response;
      } else {
        throw new Error(response.error || 'Failed to connect Google Sheets');
      }
    } catch (error) {
      console.error('Google Sheets connection error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    googleScriptLoaded,
    signIn,
    signUp,
    signOut,
    handleGoogleAuth,
    initiateGoogleLogin,
    connectGoogleSheets,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Enhanced Google Login Button Component
export const GoogleLoginButton = ({ 
  variant = 'button', // 'button' or 'icon'
  size = 'medium', // 'small', 'medium', 'large'
  theme = 'outline', // 'outline', 'filled_blue', 'filled_black'
  text = 'Sign in with Google',
  onSuccess,
  onError,
  className = ''
}) => {
  const { initiateGoogleLogin, handleGoogleAuth, googleScriptLoaded } = useAuth();
  const [buttonId] = useState(`google-signin-button-${Math.random().toString(36).substr(2, 9)}`);

  const handleClick = async () => {
    try {
      if (onSuccess || onError) {
        // Custom callback handling
        await initiateGoogleLogin();
      } else {
        // Use context's default handling
        await initiateGoogleLogin();
      }
    } catch (error) {
      if (onError) {
        onError(error);
      }
    }
  };

  useEffect(() => {
    if (googleScriptLoaded && window.google && variant === 'button') {
      try {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
          console.error('Google Client ID not configured');
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: onSuccess || handleGoogleAuth,
          auto_select: false
        });

        // Clear any existing button content
        const buttonElement = document.getElementById(buttonId);
        if (buttonElement) {
          buttonElement.innerHTML = '';
          
          window.google.accounts.id.renderButton(buttonElement, {
            theme: theme,
            size: size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium',
            width: '100%',
            text: 'signin_with',
            shape: 'rectangular'
          });
        }
      } catch (error) {
        console.error('Error rendering Google button:', error);
      }
    }
  }, [googleScriptLoaded, buttonId, theme, size, onSuccess, handleGoogleAuth, variant]);

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        className={`p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors ${className}`}
        title="Sign in with Google"
        disabled={!googleScriptLoaded}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      </button>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {!googleScriptLoaded ? (
        <div className="flex items-center justify-center p-3 bg-gray-100 rounded border">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading...</span>
        </div>
      ) : (
        <div id={buttonId} className="w-full" />
      )}
    </div>
  );
};

// Custom Google Login Button (for more control)
export const CustomGoogleLoginButton = ({ 
  children, 
  className = '',
  disabled = false,
  ...props 
}) => {
  const { initiateGoogleLogin, googleScriptLoaded } = useAuth();

  const handleClick = async () => {
    if (disabled || !googleScriptLoaded) return;
    
    try {
      await initiateGoogleLogin();
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || !googleScriptLoaded}
      className={`${className} ${disabled || !googleScriptLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {children}
    </button>
  );
};