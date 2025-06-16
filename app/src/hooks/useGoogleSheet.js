// src/hooks/useGoogleSheets.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useGoogleSheets = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState({
    connected: false,
    loading: false,
    error: null,
    lastSync: null
  });

  // Check connection status
  const checkStatus = useCallback(async () => {
    if (!user) {
      setStatus({ connected: false, loading: false, error: null, lastSync: null });
      return;
    }

    try {
      const result = await window.electronAPI.callPython({
        action: 'check_google_sheets_status'
      });
      
      if (result.success) {
        setStatus(prev => ({
          ...prev,
          connected: result.connected,
          loading: false,
          error: result.connected ? null : result.error
        }));
      }
    } catch (error) {
      console.error('Error checking Google Sheets status:', error);
      setStatus(prev => ({
        ...prev,
        connected: false,
        loading: false,
        error: 'Failed to check connection status'
      }));
    }
  }, [user]);

  // Connect to Google Sheets
  const connect = useCallback(async () => {
    setStatus(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await window.electronAPI.callPython({
        action: 'connect_google_sheets'
      });
      
      if (result.success) {
        setStatus(prev => ({
          ...prev,
          connected: true,
          loading: false,
          error: null
        }));
        
        // Show success notification
        await window.electronAPI.showNotification(
          'Google Sheets Connected', 
          'Successfully connected to Google Sheets!'
        );
        
        return { success: true, data: result };
      } else {
        setStatus(prev => ({
          ...prev,
          connected: false,
          loading: false,
          error: result.error
        }));
        
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Google Sheets connection error:', error);
      setStatus(prev => ({
        ...prev,
        connected: false,
        loading: false,
        error: 'Connection failed'
      }));
      
      return { success: false, error: 'Connection failed' };
    }
  }, []);

  // Disconnect from Google Sheets
  const disconnect = useCallback(async () => {
    try {
      const result = await window.electronAPI.callPython({
        action: 'disconnect_google_sheets'
      });
      
      if (result.success) {
        setStatus({
          connected: false,
          loading: false,
          error: null,
          lastSync: null
        });
        
        await window.electronAPI.showNotification(
          'Disconnected', 
          'Successfully disconnected from Google Sheets'
        );
        
        return { success: true };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      console.error('Disconnect error:', error);
      return { success: false, error: 'Disconnect failed' };
    }
  }, []);

  // Sync transactions to Google Sheets
  const syncTransactions = useCallback(async () => {
    if (!status.connected) {
      return { success: false, error: 'Not connected to Google Sheets' };
    }

    setStatus(prev => ({ ...prev, loading: true }));
    
    try {
      const result = await window.electronAPI.callPython({
        action: 'sync_transactions_to_sheets'
      });
      
      setStatus(prev => ({ 
        ...prev, 
        loading: false,
        lastSync: result.success ? new Date().toISOString() : prev.lastSync
      }));
      
      if (result.success) {
        await window.electronAPI.showNotification(
          'Sync Complete', 
          `Synced ${result.transactions_count || 0} transactions to Google Sheets`
        );
      }
      
      return result;
    } catch (error) {
      console.error('Sync error:', error);
      setStatus(prev => ({ ...prev, loading: false }));
      return { success: false, error: 'Sync failed' };
    }
  }, [status.connected]);

  // Auto-sync on transaction changes (optional)
  const autoSync = useCallback(async () => {
    if (status.connected && !status.loading) {
      return await syncTransactions();
    }
  }, [status.connected, status.loading, syncTransactions]);

  // Check status on mount and when user changes
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Listen for data sync events from main process
  useEffect(() => {
    const handleDataSync = (event, data) => {
      if (data.success && data.message?.includes('Google Sheets')) {
        setStatus(prev => ({ 
          ...prev, 
          lastSync: new Date().toISOString() 
        }));
      }
    };

    window.electronAPI.onDataSync(handleDataSync);

    return () => {
      window.electronAPI.removeAllListeners('data-sync');
    };
  }, []);

  return {
    status,
    connect,
    disconnect,
    syncTransactions,
    autoSync,
    checkStatus,
    isConnected: status.connected,
    isLoading: status.loading,
    error: status.error,
    lastSync: status.lastSync
  };
};