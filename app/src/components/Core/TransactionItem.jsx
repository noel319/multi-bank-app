import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { formatCurrency, formatDate } from '../../utils/formatters';

const TransactionItem = ({ transaction }) => {
  const isIncome = transaction.type === 'income' || transaction.suppliers_payment < 0;
  const amount = Math.abs(transaction.suppliers_payment || transaction.customer_deposit || 0);

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
      <div className="flex items-center space-x-3">
        {/* Transaction Icon */}
        <div className={`p-2 rounded-full ${
          isIncome ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {isIncome ? (
            <ArrowDownIcon className="h-4 w-4 text-green-600" />
          ) : (
            <ArrowUpIcon className="h-4 w-4 text-red-600" />
          )}
        </div>

        {/* Transaction Details */}
        <div>
          <p className="font-medium text-slate-800">
            {transaction.description || (isIncome ? 'Deposit' : 'Payment')}
          </p>
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <span>{transaction.bank_name}</span>
            <span>•</span>
            <span>{formatDate(transaction.date)}</span>
          </div>
        </div>
      </div>

      {/* Amount */}
      <div className="text-right">
        <p className={`font-semibold ${
          isIncome ? 'text-green-600' : 'text-red-600'
        }`}>
          {isIncome ? '+' : '-'}{formatCurrency(amount)}
        </p>
        <p className="text-xs text-slate-500">
          Balance: {formatCurrency(transaction.balance)}
        </p>
      </div>
    </div>
  );
};

export default TransactionItem;