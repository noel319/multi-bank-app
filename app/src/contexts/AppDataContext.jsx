import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
// import { getInitialData, addTransactionToSheet } from '../services/googleSheetsService'; // For real integration

const AppDataContext = createContext(null);

export const AppDataProvider = ({ children }) => {
  const { user, gapiInstance } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [spreadsheetId, setSpreadsheetId] = useState(localStorage.getItem('spreadsheetId') || '');
  const [loading, setLoading] = useState(false);

  // This context is currently a placeholder.
  // The UI is driven by MockDataContext.
  // For real data, you'd implement useEffect to call getInitialData
  // and functions like handleAddTransaction to call addTransactionToSheet.

  useEffect(() => {
    if (user && gapiInstance && spreadsheetId && window.gapi?.client?.sheets) { // Check if sheets API is loaded
      // setLoading(true);
      // console.log("AppDataContext: Would fetch real data now for spreadsheet:", spreadsheetId);
      // getInitialData(gapiInstance, spreadsheetId)
      //   .then(data => { /* process and set state */ })
      //   .catch(err => console.error(err))
      //   .finally(() => setLoading(false));
    }
  }, [user, gapiInstance, spreadsheetId]);

  const updateSpreadsheetId = (id) => {
    setSpreadsheetId(id);
    localStorage.setItem('spreadsheetId', id);
  };
  
  const consolidatedBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);


  return (
    <AppDataContext.Provider value={{
      accounts, transactions, costCenters, spreadsheetId, updateSpreadsheetId, loading, consolidatedBalance
      // add real functions here like handleAddTransaction, handleAddCostCenter etc.
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => useContext(AppDataContext);