import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  
  const [homeData, setHomeData] = useState({
    banks: [],
    totalBalance: 0,
    personalBalance: 0,
    recentTransactions: [],
    userProfile: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load home data function
  const loadHomeData = useCallback(async () => {
    if (!user) {
      setHomeData({
        banks: [],
        totalBalance: 0,
        personalBalance: 0,
        recentTransactions: [],
        userProfile: null
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await window.electronAPI.callPython({
        action: 'get_home_data'
      });

      if (response.success) {
        setHomeData(response.data);
      } else {
        const errorMessage = response.error || 'Failed to load home data';
        setError(errorMessage);
        console.error('Failed to load home data:', errorMessage);
        
        await window.electronAPI.showErrorDialog({
          title: 'Error',
          content: errorMessage
        });
      }
    } catch (error) {
      const errorMessage = 'Failed to connect to backend';
      setError(errorMessage);
      console.error('Error loading home data:', error);
      
      await window.electronAPI.showErrorDialog({
        title: 'Error',
        content: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load data when user changes
  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  // Bank operations
  const addBank = async (bankData) => {
    try {
      const response = await window.electronAPI.callPython({
        action: 'add_bank',
        payload: bankData
      });

      if (response.success) {
        await loadHomeData(); // Refresh data
        await window.electronAPI.showMessageDialog({
          type: 'info',
          title: 'Success',
          message: 'Bank card added successfully!'
        });
        return { success: true };
      } else {
        const errorMessage = response.error || 'Failed to add bank card';
        await window.electronAPI.showErrorDialog({
          title: 'Error',
          content: errorMessage
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = 'Failed to add bank card';
      console.error('Error adding bank:', error);
      await window.electronAPI.showErrorDialog({
        title: 'Error',
        content: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  const updateBank = async (bankData, bankId) => {
    try {
      const response = await window.electronAPI.callPython({
        action: 'update_bank',
        payload: { ...bankData, bank_id: bankId }
      });

      if (response.success) {
        await loadHomeData(); // Refresh data
        await window.electronAPI.showMessageDialog({
          type: 'info',
          title: 'Success',
          message: 'Bank card updated successfully!'
        });
        return { success: true };
      } else {
        const errorMessage = response.error || 'Failed to update bank card';
        await window.electronAPI.showErrorDialog({
          title: 'Error',
          content: errorMessage
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = 'Failed to update bank card';
      console.error('Error updating bank:', error);
      await window.electronAPI.showErrorDialog({
        title: 'Error',
        content: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  const deleteBank = async (bankId) => {
    const confirmed = await window.electronAPI.showMessageDialog({
      type: 'question',
      buttons: ['Cancel', 'Delete'],
      defaultId: 0,
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this bank card?',
      detail: 'This action cannot be undone and will also delete all associated transactions.'
    });

    if (confirmed.response !== 1) {
      return { success: false, cancelled: true };
    }

    try {
      const response = await window.electronAPI.callPython({
        action: 'delete_bank',
        payload: { bank_id: bankId }
      });

      if (response.success) {
        await loadHomeData(); // Refresh data
        await window.electronAPI.showMessageDialog({
          type: 'info',
          title: 'Success',
          message: 'Bank card deleted successfully!'
        });
        return { success: true };
      } else {
        const errorMessage = response.error || 'Failed to delete bank card';
        await window.electronAPI.showErrorDialog({
          title: 'Error',
          content: errorMessage
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = 'Failed to delete bank card';
      console.error('Error deleting bank:', error);
      await window.electronAPI.showErrorDialog({
        title: 'Error',
        content: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  // Google Sheets sync
  const syncGoogleSheets = async () => {
    try {
      if (!user?.google_token) {
        await window.electronAPI.showMessageDialog({
          type: 'info',
          title: 'Google Sheets Not Connected',
          message: 'Please log in with Google to sync with Google Sheets.'
        });
        return { success: false, error: 'Google Sheets not connected' };
      }

      const response = await window.electronAPI.callPython({
        action: 'sync_google_sheets'
      });

      if (response.success) {
        await loadHomeData(); // Refresh data
        await window.electronAPI.showMessageDialog({
          type: 'info',
          title: 'Success',
          message: 'Google Sheets synchronized successfully!'
        });
        return { success: true };
      } else {
        const errorMessage = response.error || 'Failed to sync with Google Sheets';
        await window.electronAPI.showErrorDialog({
          title: 'Sync Error',
          content: errorMessage
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = 'Failed to sync with Google Sheets';
      console.error('Error syncing Google Sheets:', error);
      await window.electronAPI.showErrorDialog({
        title: 'Error',
        content: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  // Dashboard data functions
  const getDashboardData = async (selectedMonth = null) => {
    try {
      const currentDate = new Date();
      const month = selectedMonth || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      const response = await window.electronAPI.callPython({
        action: 'get_dashboard_data',
        payload: { month }
      });

      if (response.success) {
        return { success: true, data: response.data };
      } else {
        console.error('Failed to load dashboard data:', response.error);
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      return { success: false, error: 'Failed to load dashboard data' };
    }
  };

  const getBankDetailData = async (bankId, selectedMonth = null) => {
    try {
      const currentDate = new Date();
      const month = selectedMonth || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      const response = await window.electronAPI.callPython({
        action: 'get_bank_detail_data',
        payload: { bank_id: bankId, month }
      });

      if (response.success) {
        return { success: true, data: response.data };
      } else {
        console.error('Failed to load bank detail data:', response.error);
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Error loading bank detail data:', error);
      return { success: false, error: 'Failed to load bank detail data' };
    }
  };

  const getCostCenterList = async () => {
    try {
      const response = await window.electronAPI.callPython({
        action: 'get_cost_centers_list'
      });

      if (response.success) {
        return { success: true, data: response.data };
      } else {
        console.error('Failed to load cost centers:', response.error);
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Error loading cost centers:', error);
      return { success: false, error: 'Failed to load cost centers' };
    }
  };
  // Billing functions
  const getBillingData = async () => {
    try {
      const response = await window.electronAPI.callPython({
        action: 'get_billing_data'
      });

      if (response.success) {
        return { success: true, data: response.data };
      } else {
        console.error('Failed to load billing data:', response.error);
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Error loading billing data:', error);
      return { success: false, error: 'Failed to load billing data' };
    }
  };

  const addBill = async (billData) => {
    try {
      const response = await window.electronAPI.callPython({
        action: 'add_bill',
        payload: billData
      });

      if (response.success) {
        await loadHomeData(); // Refresh home data for updated balances
        await window.electronAPI.showMessageDialog({
          type: 'info',
          title: 'Success',
          message: 'Bill added successfully! Transaction created and CSV file updated.'
        });
        return { success: true };
      } else {
        const errorMessage = response.error || 'Failed to add bill';
        await window.electronAPI.showErrorDialog({
          title: 'Error',
          content: errorMessage
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = 'Failed to add bill';
      console.error('Error adding bill:', error);
      await window.electronAPI.showErrorDialog({
        title: 'Error',
        content: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  const deleteBill = async (billId) => {
    const confirmed = await window.electronAPI.showMessageDialog({
      type: 'question',
      buttons: ['Cancel', 'Delete'],
      defaultId: 0,
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this bill?',
      detail: 'This action will also remove the associated transaction and cannot be undone.'
    });

    if (confirmed.response !== 1) {
      return { success: false, cancelled: true };
    }

    try {
      const response = await window.electronAPI.callPython({
        action: 'delete_bill',
        payload: { bill_id: billId }
      });

      if (response.success) {
        await loadHomeData(); // Refresh home data for updated balances
        await window.electronAPI.showMessageDialog({
          type: 'info',
          title: 'Success',
          message: 'Bill deleted successfully!'
        });
        return { success: true };
      } else {
        const errorMessage = response.error || 'Failed to delete bill';
        await window.electronAPI.showErrorDialog({
          title: 'Error',
          content: errorMessage
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = 'Failed to delete bill';
      console.error('Error deleting bill:', error);
      await window.electronAPI.showErrorDialog({
        title: 'Error',
        content: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  const exportBillingData = async (exportData) => {
    try {
      const response = await window.electronAPI.callPython({
        action: 'export_billing_data',
        payload: exportData
      });

      if (response.success) {
        await window.electronAPI.showMessageDialog({
          type: 'info',
          title: 'Export Successful',
          message: `Data exported successfully!\n\nFile: ${response.filename}\nRecords: ${response.record_count}\nLocation: ${response.filepath}`
        });
        return { success: true, data: response };
      } else {
        const errorMessage = response.error || 'Failed to export data';
        await window.electronAPI.showErrorDialog({
          title: 'Export Error',
          content: errorMessage
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = 'Failed to export data';
      console.error('Error exporting data:', error);
      await window.electronAPI.showErrorDialog({
        title: 'Error',
        content: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  // Utility functions
  const getBankById = useCallback((bankId) => {
    return homeData.banks.find(bank => bank.id === bankId);
  }, [homeData.banks]);

  const refreshData = useCallback(() => {
    return loadHomeData();
  }, [loadHomeData]);

  // Clear data (useful for logout)
  const clearData = useCallback(() => {
    setHomeData({
      banks: [],
      totalBalance: 0,
      personalBalance: 0,
      recentTransactions: [],
      userProfile: null
    });
    setError(null);
  }, []);

  const value = {
    // State
    homeData,
    loading,
    error,
    
    // Actions
    loadHomeData,
    refreshData,
    clearData,
    
    // Dashboard functions
    getDashboardData,
    getBankDetailData,
    getCostCenterList,
    
    // Bank operations
    addBank,
    updateBank,
    deleteBank,
    getBankById,
    
    // Google Sheets
    syncGoogleSheets,
    
    // Computed values
    hasGoogleToken: !!user?.google_token,
    hasBanks: homeData.banks.length > 0,
    hasTransactions: homeData.recentTransactions.length > 0,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};