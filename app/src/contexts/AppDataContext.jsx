import { createContext, useContext, useState } from 'react';

const BankDataContext = createContext();

export function BankDataProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [costCenters, setCostCenters] = useState([]);

  const addAccount = (account) => {
    setAccounts([...accounts, account]);
  };

  const updateAccount = (updatedAccount) => {
    setAccounts(accounts.map(acc => 
      acc.id === updatedAccount.id ? updatedAccount : acc
    ));
  };

  const deleteAccount = (accountId) => {
    setAccounts(accounts.filter(acc => acc.id !== accountId));
  };

  // Similar functions for transactions and cost centers...

  return (
    <BankDataContext.Provider value={{
      accounts,
      transactions,
      costCenters,
      addAccount,
      updateAccount,
      deleteAccount,
      // other methods...
    }}>
      {children}
    </BankDataContext.Provider>
  );
}

export function useBankData() {
  return useContext(BankDataContext);
}