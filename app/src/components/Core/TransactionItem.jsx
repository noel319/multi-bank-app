// src/components/Core/TransactionItem.jsx
import React from 'react';
import { ArrowDownCircleIcon, ArrowUpCircleIcon } from '@heroicons/react/24/solid'; // Or outline

const TransactionItem = ({ transaction }) => {
  const { date, description, category, amount, type, icon } = transaction;
  const isIncome = type === 'income';

  return (
    <div className="flex items-center justify-between py-3 px-1 border-b border-slate-200 last:border-b-0">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-full ${isIncome ? 'bg-green-100' : 'bg-red-100'}`}>
          {isIncome ? (
            <ArrowUpCircleIcon className="h-6 w-6 text-status-green" />
          ) : (
            <ArrowDownCircleIcon className="h-6 w-6 text-status-red" />
          )}
        </div>
        <div>
          <p className="font-semibold text-sm text-slate-700">{description}</p>
          <p className="text-xs text-slate-500">{category} • {date}</p>
        </div>
      </div>
      <p className={`font-semibold text-sm ${isIncome ? 'text-status-green' : 'text-status-red'}`}>
        {isIncome ? '+' : '-'} $ {Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
};

export default TransactionItem;