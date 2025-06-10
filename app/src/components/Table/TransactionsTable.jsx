import React from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, TrashIcon } from '@heroicons/react/24/outline';

const TransactionsTable = ({ 
  transactions = [], 
  loading, 
  onSort, 
  sortField, 
  sortDirection,
  onDeleteTransaction 
}) => {
  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handleSort = (field) => {
    if (onSort) {
      onSort(field);
    }
  };

  const SortableHeader = ({ field, children, className = "" }) => (
    <th 
      className={`px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-50 transition-colors ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field && (
          <span className="text-slate-400">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-lg border">
        <div className="animate-pulse">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-center space-x-4">
                <div className="h-4 bg-slate-200 rounded w-1/6"></div>
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/6"></div>
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg border">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-slate-400 text-xl">📊</span>
          </div>
          <p className="text-slate-500 text-lg">No transactions found</p>
          <p className="text-slate-400 text-sm mt-2">Try adjusting your filters or date range</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <SortableHeader field="date">Date</SortableHeader>
              <SortableHeader field="state">Type</SortableHeader>
              <SortableHeader field="cost_center_name">Cost Center</SortableHeader>
              <SortableHeader field="bank_name">Bank</SortableHeader>
              <SortableHeader field="account_name">Account</SortableHeader>
              <SortableHeader field="price" className="text-right">Amount</SortableHeader>
              <SortableHeader field="before_balance" className="text-right">Before Balance</SortableHeader>
              <SortableHeader field="after_balance" className="text-right">Balance</SortableHeader>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {transactions.map((transaction, index) => {
              const isIncome = transaction.state === 'Income';
              const rowBg = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
              
              return (
                <tr key={transaction.id} className={`${rowBg} hover:bg-blue-50 transition-colors duration-150`}>
                  {/* Date */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {formatDate(transaction.date)}
                  </td>
                  
                  {/* Type with colored indicator */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${isIncome ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                      <div className="flex items-center">
                        {isIncome ? (
                          <ArrowTrendingUpIcon className="w-4 h-4 text-blue-500 mr-2" />
                        ) : (
                          <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-2" />
                        )}
                        <span className={`text-sm font-medium capitalize ${isIncome ? 'text-blue-700' : 'text-red-700'}`}>
                          {transaction.state}
                        </span>
                      </div>
                    </div>
                  </td>
                  
                  {/* Category */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-slate-900">
                      {transaction.cost_center_name || 'Uncategorized'}
                    </span>
                  </td>
                  
                  {/* Bank with color indicator */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-sm mr-3"
                        style={{ backgroundColor: transaction.bank_color || '#6B7280' }}
                      ></div>
                      <span className="text-sm text-slate-900">{transaction.bank_name}</span>
                    </div>
                  </td>
                  
                  {/* Account */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {transaction.account_name}
                  </td>
                  
                  {/* Amount */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={`text-sm font-semibold ${isIncome ? 'text-blue-600' : 'text-red-600'}`}>
                      {isIncome ? '+' : '-'}{formatCurrency(Math.abs(transaction.price))}
                    </span>
                  </td>
                  
                  {/* Fee */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {transaction.fee > 0 ? (
                      <span className="text-sm text-slate-600">
                        {formatCurrency(transaction.before_balance)}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </td>
                  
                  {/* Balance */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-medium text-slate-900">
                      {formatCurrency(transaction.after_balance)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {onDeleteTransaction && (
                      <button
                        onClick={() => onDeleteTransaction(transaction.id)}
                        className="text-red-600 hover:text-red-900 transition-colors p-1"
                        title="Delete transaction"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsTable;