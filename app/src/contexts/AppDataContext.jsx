import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext'; // AuthContext still handles frontend Google Sign-In display

const AppDataContext = createContext(null);

export const AppDataProvider = ({ children }) => {
  const { user: authUser } = useAuth(); // authUser from frontend Google Sign-In (for UI, not direct API calls yet)
  
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [settings, setSettings] = useState({}); // e.g., { current_year_gsheet_id: '...' }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [consolidatedBalance, setConsolidatedBalance] = useState(0);

  const callApi = useCallback(async (action, payload) => {
    setLoading(true);
    setError(null);
    try {
      if (!window.electronAPI) {
        throw new Error("Electron API not available. App might not be running in Electron.");
      }
      const response = await window.electronAPI.callPython(action, payload);
      setLoading(false);
      if (response && response.success) {
        return response.data;
      } else {
        const errorMessage = response?.error || 'Unknown error from backend.';
        console.error(`API Error (${action}):`, errorMessage, response?.details);
        setError(errorMessage);
        window.electronAPI?.showErrorDialog('Application Error', `Operation failed: ${action}\nError: ${errorMessage}`);
        return null;
      }
    } catch (err) {
      console.error(`Frontend API Call Error (${action}):`, err);
      setLoading(false);
      setError(err.message || 'Frontend error during API call.');
      window.electronAPI?.showErrorDialog('Application Error', `A critical error occurred.\n${err.message}`);
      return null;
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    const fetchedAccounts = await callApi('get_all_accounts');
    const fetchedCostCenters = await callApi('get_all_cost_centers');
    // const fetchedTransactions = await callApi('get_all_transactions', { limit: 50 }); // Example
    const gsheetId = await callApi('get_setting', { key: 'current_year_gsheet_id' });

    if (fetchedAccounts) setAccounts(fetchedAccounts);
    if (fetchedCostCenters) setCostCenters(fetchedCostCenters);
    // if (fetchedTransactions) setTransactions(fetchedTransactions);
    if (gsheetId) setSettings(prev => ({ ...prev, current_year_gsheet_id: gsheetId.value }));
  }, [callApi]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    const total = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    setConsolidatedBalance(total);
  }, [accounts]);

  // --- CRUD Operations ---
  const handleAddAccount = async (accountData) => {
    const newAccount = await callApi('add_account', accountData);
    if (newAccount) {
      setAccounts(prev => [...prev, newAccount]);
      return newAccount;
    }
    return null;
  };

  const handleDeleteAccount = async (accountId) => {
    if(await callApi('delete_account', { id: accountId })) {
        setAccounts(prev => prev.filter(acc => acc.id !== accountId));
        return true;
    }
    return false;
  };
  // ... other update/delete for accounts

  const handleAddTransaction = async (transactionData) => {
    const result = await callApi('add_transaction', transactionData); // Python returns new transaction and updated balance
    if (result && result.id) {
      // Fetch ALL transactions again or just append and update specific account
      // For simplicity, re-fetch for the affected account or all recent if on a general page
      // Or, update locally:
      setTransactions(prev => [result, ...prev.slice(0,49)]); // Keep recent transactions
      setAccounts(prevAccounts => 
        prevAccounts.map(acc => 
          acc.id === result.account_id 
          ? { ...acc, balance: result.updated_account_balance } 
          : acc
        )
      );
      return result;
    }
    return null;
  };
  
  const fetchTransactionsForAccount = async (accountId) => {
    const data = await callApi('get_transactions_for_account', { account_id: accountId, limit: 100});
    if (data) setTransactions(data); // Or merge if paginating
    return data;
  };


  const handleAddCostCenter = async (ccData) => {
    const newCc = await callApi('add_cost_center', ccData);
    if (newCc) {
      setCostCenters(prev => [...prev, newCc].sort((a,b) => a.name.localeCompare(b.name)));
    }
  };
  // ... other update/delete for cost centers

  const updateSetting = async (key, value) => {
    if (await callApi('update_setting', { key, value })) {
        setSettings(prev => ({ ...prev, [key]: value}));
        return true;
    }
    return false;
  };

  // Placeholder for initiating Google Sheets new year file creation
  const createNewYearSpreadsheet = async (year, googleAuthTokensJsonString) => {
    const result = await callApi('create_new_year_gsheet', { year, tokens_json_string: googleAuthTokensJsonString });
    if (result && result.spreadsheetId) {
      updateSetting('current_year_gsheet_id', result.spreadsheetId);
      window.electronAPI?.showMessageDialog({
        type: 'info',
        title: 'Spreadsheet Created',
        message: `New Google Sheet for ${year} created successfully.\nID: ${result.spreadsheetId}`
      });
      return result;
    }
    return null;
  };

  // Placeholder for bank sync
  const syncBankAccount = async (accountId, bankApiAccessToken) => {
    // THIS IS HIGHLY SIMPLIFIED - real token management is critical
    const result = await callApi('sync_bank_account', { account_id: accountId, access_token: bankApiAccessToken });
    if (result && result.success) {
      window.electronAPI?.showMessageDialog({ type: 'info', title: 'Bank Sync', message: `Account ${accountId} sync placeholder: ${result.message}`});
      // Re-fetch account data and transactions
      const updatedAccount = await callApi('get_account_by_id', {id: accountId});
      if(updatedAccount) setAccounts(prev => prev.map(a => a.id === accountId ? updatedAccount : a));
      fetchTransactionsForAccount(accountId);
    }
  };


  // Listen for potential updates pushed from main process
  useEffect(() => {
    const handleUpdate = (data) => {
        console.log('Received update from main:', data);
        // e.g., if data.type === 'bank_sync_complete'
        // fetchInitialData(); // Or more targeted fetch
    };
    window.electronAPI?.onBankDataUpdated(handleUpdate);
    return () => window.electronAPI?.removeBankDataUpdatedListener(handleUpdate);
  }, [fetchInitialData]);


  return (
    <AppDataContext.Provider
      value={{
        accounts, transactions, costCenters, settings, loading, error, consolidatedBalance,
        fetchInitialData, fetchTransactionsForAccount,
        handleAddAccount, handleDeleteAccount, /* updateAccount */
        handleAddTransaction,
        handleAddCostCenter, /* updateCostCenter, deleteCostCenter */
        updateSetting,
        createNewYearSpreadsheet,
        syncBankAccount, // Add to context
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => useContext(AppDataContext);