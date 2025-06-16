// src/components/Layout/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  QuestionMarkCircleIcon, 
  UserCircleIcon, 
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  CloudIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { GoogleLoginButton } from '../../contexts/AuthContext';
import { NAV_ITEMS } from '../../utils/constants';

const Header = () => {
  const { user, signOut, initiateGoogleLogin } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [googleSheetsStatus, setGoogleSheetsStatus] = useState({
    connected: false,
    loading: false,
    error: null
  });
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check Google Sheets status on mount and when user changes
  useEffect(() => {
    if (user) {
      checkGoogleSheetsStatus();
    }
  }, [user]);

  const checkGoogleSheetsStatus = async () => {
    try {
      const result = await window.electronAPI.callPython({
        action: 'check_google_sheets_status'
      });
      
      if (result.success) {
        setGoogleSheetsStatus({
          connected: result.connected,
          loading: false,
          error: result.connected ? null : result.error
        });
      }
    } catch (error) {
      console.error('Error checking Google Sheets status:', error);
      setGoogleSheetsStatus({
        connected: false,
        loading: false,
        error: 'Failed to check connection status'
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setIsDropdownOpen(false);
      setGoogleSheetsStatus({ connected: false, loading: false, error: null });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await initiateGoogleLogin();
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const handleConnectGoogleSheets = async () => {
    setGoogleSheetsStatus(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await window.electronAPI.callPython({
        action: 'connect_google_sheets'
      });
      
      if (result.success) {
        setGoogleSheetsStatus({
          connected: true,
          loading: false,
          error: null
        });
        
        // Show success notification
        await window.electronAPI.showNotification(
          'Google Sheets Connected', 
          'Successfully connected to Google Sheets!'
        );
        
        // Optionally sync transactions immediately
        await handleSyncTransactions();
      } else {
        setGoogleSheetsStatus({
          connected: false,
          loading: false,
          error: result.error
        });
        
        // Show error dialog
        await window.electronAPI.showErrorDialog({
          title: 'Connection Failed',
          content: result.error || 'Failed to connect to Google Sheets'
        });
      }
    } catch (error) {
      console.error('Google Sheets connection error:', error);
      setGoogleSheetsStatus({
        connected: false,
        loading: false,
        error: 'Connection failed'
      });
    }
    
    setIsDropdownOpen(false);
  };

  const handleSyncTransactions = async () => {
    try {
      const result = await window.electronAPI.callPython({
        action: 'sync_transactions_to_sheets'
      });
      
      if (result.success) {
        await window.electronAPI.showNotification(
          'Sync Complete', 
          `Synced ${result.transactions_count || 0} transactions to Google Sheets`
        );
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  const handleDisconnectGoogleSheets = async () => {
    try {
      const result = await window.electronAPI.callPython({
        action: 'disconnect_google_sheets'
      });
      
      if (result.success) {
        setGoogleSheetsStatus({
          connected: false,
          loading: false,
          error: null
        });
        
        await window.electronAPI.showNotification(
          'Disconnected', 
          'Successfully disconnected from Google Sheets'
        );
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
    
    setIsDropdownOpen(false);
  };

  const getGoogleSheetsStatusIcon = () => {
    if (googleSheetsStatus.loading) {
      return <CloudIcon className="h-4 w-4 text-blue-500 animate-pulse" />;
    }
    if (googleSheetsStatus.connected) {
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    }
    if (googleSheetsStatus.error) {
      return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
    }
    return <CloudIcon className="h-4 w-4 text-gray-400" />;
  };

  const getGoogleSheetsStatusText = () => {
    if (googleSheetsStatus.loading) {
      return "Connecting...";
    }
    if (googleSheetsStatus.connected) {
      return "Google Sheets Connected";
    }
    return "Google Sheets Disconnected";
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-brand-blue-dark">FinanceControl</h1>
          
          {/* Google Sheets Status Indicator */}
          {user && (
            <div className="flex items-center space-x-2 text-sm">
              {getGoogleSheetsStatusIcon()}
              <span className={`hidden md:inline ${
                googleSheetsStatus.connected ? 'text-green-600' : 
                googleSheetsStatus.error ? 'text-red-600' : 'text-gray-500'
              }`}>
                {getGoogleSheetsStatusText()}
              </span>
            </div>
          )}
        </div>
        
        <nav className="hidden md:flex space-x-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'bg-brand-blue-light text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center space-x-3">
          <button className="p-2 text-slate-500 hover:text-brand-blue-dark hover:bg-slate-100 rounded-full">
            <QuestionMarkCircleIcon className="h-6 w-6" />
          </button>
          
          {user ? (
            <div className="relative" ref={dropdownRef}>
              {/* User Profile Button */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {user.imageUrl ? (
                  <img 
                    src={user.imageUrl} 
                    alt={user.name} 
                    className="h-8 w-8 rounded-full object-cover" 
                  />
                ) : (
                  <UserCircleIcon className="h-8 w-8 text-slate-500" />
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-slate-700">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <ChevronDownIcon className="h-4 w-4 text-slate-500" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                  {/* User Info Section */}
                  <div className="px-4 py-3 border-b border-slate-200">
                    <div className="flex items-center space-x-3">
                      {user.imageUrl ? (
                        <img 
                          src={user.imageUrl} 
                          alt={user.name} 
                          className="h-10 w-10 rounded-full object-cover" 
                        />
                      ) : (
                        <UserCircleIcon className="h-10 w-10 text-slate-500" />
                      )}
                      <div>
                        <p className="font-medium text-slate-800">{user.name}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Google Sheets Section */}
                  <div className="px-4 py-3 border-b border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getGoogleSheetsStatusIcon()}
                        <span className="text-sm font-medium text-slate-700">
                          Google Sheets
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        googleSheetsStatus.connected 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {googleSheetsStatus.connected ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                    
                    {/* Google Sheets Action Buttons */}
                    <div className="space-y-2">
                      {!googleSheetsStatus.connected ? (
                        <button
                          onClick={handleConnectGoogleSheets}
                          disabled={googleSheetsStatus.loading}
                          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 w-full py-1 disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <span>{googleSheetsStatus.loading ? 'Connecting...' : 'Connect Google Sheets'}</span>
                        </button>
                      ) : (
                        <div className="space-y-1">
                          <button
                            onClick={handleSyncTransactions}
                            className="flex items-center space-x-2 text-sm text-green-600 hover:text-green-800 w-full py-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Sync Transactions</span>
                          </button>
                          <button
                            onClick={handleDisconnectGoogleSheets}
                            className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-800 w-full py-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>Disconnect</span>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Error Message */}
                    {googleSheetsStatus.error && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                        {googleSheetsStatus.error}
                      </div>
                    )}
                  </div>

                  {/* Logout Section */}
                  <div className="px-4 py-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-800 w-full py-2"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Not logged in - Show Google login icon only */
            <GoogleLoginButton 
              variant="icon"
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;