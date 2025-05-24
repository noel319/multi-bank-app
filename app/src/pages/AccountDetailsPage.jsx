// src/pages/AccountDetailsPage.jsx
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMockData } from '../contexts/MockDataContext';
import BankCard from '../components/Core/BankCard';
import TransactionItem from '../components/Core/TransactionItem';
import ChartPlaceholder from '../components/Core/ChartPlaceholder'; // Create this component
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import Button from '../components/Core/Button';

// Create a simple placeholder for charts
// src/components/Core/ChartPlaceholder.jsx
const ChartPlaceholder = ({ title, height = "h-64" }) => (
  <div className={`bg-slate-200 rounded-lg flex items-center justify-center ${height} text-slate-500`}>
    {title || "Chart Area"}
  </div>
);

// src/components/Core/FilterGroup.jsx
const FilterGroup = ({ onFilterChange }) => {
    // Dummy handler for now
    const handleChange = (filterType, value) => {
      console.log("Filter changed:", filterType, value);
      if(onFilterChange) onFilterChange(filterType, value);
    };
  
    return (
      <div className="my-4 p-4 bg-white rounded-lg shadow flex flex-wrap gap-4 items-center">
        <select onChange={(e) => handleChange('date', e.target.value)} className="p-2 border border-slate-300 rounded-md text-sm">
          <option value="all">All Dates</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <select onChange={(e) => handleChange('type', e.target.value)} className="p-2 border border-slate-300 rounded-md text-sm">
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select onChange={(e) => handleChange('costCenter', e.target.value)} className="p-2 border border-slate-300 rounded-md text-sm">
          <option value="all">All Cost Centers</option>
          {/* Populate with actual cost centers */}
          <option value="cc1">Food</option>
          <option value="cc2">Transport</option>
        </select>
        <Button onClick={() => handleChange('reset', null)} variant="secondary" size="sm">Reset Filters</Button>
      </div>
    );
  };


const AccountDetailsPage = () => {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const { accounts, transactions: allTransactions } = useMockData();
  const [filters, setFilters] = useState({ date: 'all', type: 'all', costCenter: 'all' });

  const account = accounts.find(acc => acc.id === accountId);

  // Simulate transactions for this specific account (in real app, this link would exist)
  const accountTransactions = useMemo(() => {
    return allTransactions
      .filter(t => {
        // Basic filtering logic (extend as needed)
        let passes = true;
        if (filters.type !== 'all' && t.type !== filters.type) passes = false;
        // Add date and cost center filtering here
        // For now, just return all transactions for demo
        return passes;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Show newest first
  }, [allTransactions, filters, accountId]);


  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  if (!account) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl text-slate-600">Account not found.</h2>
        <Button onClick={() => navigate('/')} className="mt-4">Go Home</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-2">
        <Button variant="icon" onClick={() => navigate(-1)} className="mr-2">
          <ArrowLeftIcon className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Account Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <BankCard account={account} clickable={false} />
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Balance History</h3>
          <ChartPlaceholder title={`Transaction History for ${account.bankName}`} />
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold text-slate-700 mt-6 mb-2">Transactions</h2>
        <FilterGroup onFilterChange={handleFilterChange} />
        <div className="bg-white p-1 md:p-4 rounded-lg shadow">
          {accountTransactions.length > 0 ? (
            accountTransactions.map(tx => <TransactionItem key={tx.id} transaction={tx} />)
          ) : (
            <p className="text-slate-500 py-4 text-center">No transactions match your filters for this account.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountDetailsPage;