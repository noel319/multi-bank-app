// src/contexts/MockDataContext.jsx
import React, { createContext, useContext, useState } from 'react';
import userAvatar from '../assets/images/user-avatar.png'; // Add a placeholder avatar
import visaLogo from '../assets/images/visa-logo.png'; // Add a placeholder visa logo

const initialAccounts = [
  { id: 'acc1', bankName: 'Innovation Bank', last4: '2510', balance: 9473.00, expiry: '12/24', cardType: 'VISA', colorGradient: 'gradient-purple', logo: visaLogo },
  { id: 'acc2', bankName: 'Future Credit', last4: '8872', balance: 1894.74, expiry: '8/35', cardType: 'VISA', colorGradient: 'gradient-teal', logo: visaLogo },
  { id: 'acc3', bankName: 'Digital Trust', last4: '5639', balance: 1511.30, expiry: '02/26', cardType: 'VISA', colorGradient: 'gradient-indigo', logo: visaLogo },
  { id: 'acc4', bankName: 'Savings Account', last4: '7777', balance: 5000.00, expiry: 'N/A', cardType: 'Savings', colorGradient: 'gradient-blue', logo: null },
];

const initialTransactions = [
  { id: 'txn1', date: '14 Jun. 2024', description: 'Payment - amount: USD0.79; Canada...', category: 'Public transport', amount: -0.79, type: 'expense', icon: '💸' },
  { id: 'txn2', date: '14 Jun. 2024', description: 'Same Andersen', category: 'Deposit', amount: 140.00, type: 'income', icon: '💰' },
  { id: 'txn3', date: '12 Jun. 2024', description: 'AirBnB', category: 'Travel - others', amount: -90.79, type: 'expense', icon: '✈️' },
  { id: 'txn4', date: '10 Jun. 2024', description: 'Salary', category: 'Income', amount: 2500.00, type: 'income', icon: '💼' },
  { id: 'txn5', date: '09 Jun. 2024', description: 'Groceries Store', category: 'Food', amount: -55.20, type: 'expense', icon: '🛒' },
];

const initialCostCenters = [
    { id: 'cc1', name: 'Public transport', type: 'expense' },
    { id: 'cc2', name: 'Deposit', type: 'income' },
    { id: 'cc3', name: 'Travel - others', type: 'expense' },
    { id: 'cc4', name: 'Salary', type: 'income' },
    { id: 'cc5', name: 'Food', type: 'expense' },
    { id: 'cc6', name: 'Utilities', type: 'expense' },
];


const MockDataContext = createContext();

export const MockDataProvider = ({ children }) => {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [costCenters, setCostCenters] = useState(initialCostCenters);

  const addAccount = (account) => {
    setAccounts(prev => [...prev, { ...account, id: `acc${Date.now()}`, logo: visaLogo }]); // Simple ID
  };

  const updateAccount = (updatedAccount) => {
    setAccounts(prev => prev.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
  };

  const deleteAccount = (accountId) => {
    setAccounts(prev => prev.filter(acc => acc.id !== accountId));
  };

  const addCostCenter = (cc) => {
    setCostCenters(prev => [...prev, { ...cc, id: `cc${Date.now()}`}]);
  };
  const editCostCenter = (updatedCc) => {
    setCostCenters(prev => prev.map(cc => cc.id === updatedCc.id ? updatedCc : cc));
  };
  const deleteCostCenter = (ccId) => {
    alert("Warning: Deleting a cost center might affect existing transactions.");
    setCostCenters(prev => prev.filter(cc => cc.id !== ccId));
  };


  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const userProfile = {
    name: 'User Name',
    avatar: userAvatar,
  };

  return (
    <MockDataContext.Provider value={{
      accounts, addAccount, updateAccount, deleteAccount,
      transactions,
      costCenters, addCostCenter, editCostCenter, deleteCostCenter,
      totalBalance, userProfile
    }}>
      {children}
    </MockDataContext.Provider>
  );
};

export const useMockData = () => useContext(MockDataContext);