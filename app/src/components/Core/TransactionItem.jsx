import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

const TransactionItem = ({ transactions }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(Math.abs(amount) || 0);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="text-center py-8">
          <p className="text-slate-500 mb-4">No recent transactions.</p>
          <p className="text-sm text-slate-400">
            Add bills or import transactions to see them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Bank & Account
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Cost Center
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Balance Before
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Balance After
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Date
              </th>              
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {transactions.map((transaction, index) => {
              const isIncome = transaction.state === 'Income';
              const IconComponent = isIncome ? ArrowUpIcon : ArrowDownIcon;
              
              return (
                <tr key={transaction.id || index} className="hover:bg-slate-50 transition-colors">
                  {/* Transaction Type */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full ${
                        isIncome 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <span className={`ml-2 text-sm font-medium ${
                        isIncome ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.state}
                      </span>
                    </div>
                  </td>

                  {/* Bank & Account */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: transaction.bank_color || '#6b7280' }}
                        title={`${transaction.bank_name} indicator`}
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {transaction.bank_name}
                        </div>
                        <div className="text-sm text-slate-500">
                          {transaction.account_name}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Cost Center */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-900">
                      {transaction.cost_center_name || 'Uncategorized'}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${
                      isIncome ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isIncome ? '+' : '-'}{formatCurrency(transaction.price)}
                    </span>
                  </td>

                  {/* Fee */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-orange-600 font-medium">
                        {formatCurrency(transaction.before_balance)}
                    </span>                    
                  </td>

                  {/* Balance After */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-900 font-medium">
                      {formatCurrency(transaction.after_balance)}
                    </span>
                  </td>

                  {/* Transaction Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-900">
                      {formatDate(transaction.date)}
                    </span>
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

export default TransactionItem;