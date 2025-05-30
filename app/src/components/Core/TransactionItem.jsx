import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

const TransactionItem = ({ transaction }) => {
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

  const isIncome = transaction.state === 'income';
  const IconComponent = isIncome ? ArrowUpIcon : ArrowDownIcon;

  return (
    <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
      {/* Left Side - Icon, Bank Info, Category */}
      <div className="flex items-center gap-3">
        {/* Transaction Type Icon */}
        <div className={`p-2 rounded-full ${
          isIncome 
            ? 'bg-green-100 text-green-600' 
            : 'bg-red-100 text-red-600'
        }`}>
          <IconComponent className="h-4 w-4" />
        </div>

        {/* Transaction Details */}
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-800 text-sm">
              {transaction.bank_name}
            </p>
            {/* Bank Color Indicator */}
            <div 
              className={`w-2 h-2 rounded-full`}
              style={{ backgroundColor: transaction.bank_color || '#6b7280' }}
              title={`${transaction.bank_name} indicator`}
            />
          </div>
          
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{transaction.account_name}</span>
            {transaction.cost_center_name && (
              <>
                <span>•</span>
                <span>{transaction.cost_center_name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Amount, Date */}
      <div className="text-right">
        <p className={`font-semibold text-sm ${
          isIncome ? 'text-green-600' : 'text-red-600'
        }`}>
          {isIncome ? '+' : '-'}{formatCurrency(transaction.price)}
        </p>
        
        <div className="text-xs text-slate-500">
          <p>{formatDate(transaction.date)}</p>
          {transaction.fee > 0 && (
            <p className="text-orange-600">Fee: {formatCurrency(transaction.fee)}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionItem;