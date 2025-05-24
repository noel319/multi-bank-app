// src/pages/TransactionsPage.jsx
import React, { useState, useMemo } from 'react';
import { useMockData } from '../contexts/MockDataContext';
import TransactionItem from '../components/Core/TransactionItem';
import FilterGroup from '../components/Core/FilterGroup'; // Re-use FilterGroup

const TransactionsPage = () => {
  const { transactions: allTransactions, costCenters } = useMockData();
  const [filters, setFilters] = useState({ date: 'all', type: 'all', costCenter: 'all' });

  // Memoize filtered transactions for performance
  const filteredTransactions = useMemo(() => {
    return allTransactions
      .filter(t => {
        let passesDate = true;
        // Implement date filtering logic (e.g., daily, weekly, monthly)
        // For now, 'all' passes everything
        // if (filters.date !== 'all') { /* ... date logic ... */ }

        let passesType = true;
        if (filters.type !== 'all' && t.type !== filters.type) {
          passesType = false;
        }
        
        let passesCostCenter = true;
        // This requires transactions to have a costCenterId or for category to map to costCenter name
        // Assuming t.category can be used for a simple filter by name for now
        if (filters.costCenter !== 'all' && t.category !== filters.costCenter) { 
            // In a real app, you'd filter by costCenter.id if transactions store costCenterId
            // For demo, let's find if any cost center name matches the filter value and transaction category
            const selectedCc = costCenters.find(cc => cc.id === filters.costCenter);
            if (selectedCc && t.category !== selectedCc.name) {
                passesCostCenter = false;
            } else if (!selectedCc && filters.costCenter !== 'all') { // if filter is set but no matching CC found
                 passesCostCenter = false;
            }
        }


        return passesDate && passesType && passesCostCenter;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Show newest first
  }, [allTransactions, filters, costCenters]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800">All Transactions</h1>
      
      <FilterGroup onFilterChange={handleFilterChange} /> {/* Pass costCenters to FilterGroup if it needs to populate options */}

      <div className="bg-white p-1 md:p-4 rounded-lg shadow">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map(tx => <TransactionItem key={tx.id} transaction={tx} />)
        ) : (
          <p className="text-slate-500 text-center py-10">No transactions match your current filters.</p>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;