import React from 'react';
import { PencilIcon, TrashIcon, CreditCardIcon } from '@heroicons/react/24/outline';

const BankCard = ({ bank, onClick, onEdit, onDelete }) => {
  const formatBalance = (balance) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(balance || 0);
  };

  const getCardColor = (color) => {
    const colorMap = {
      'blue': 'from-blue-500 to-blue-600',
      'green': 'from-green-500 to-green-600',
      'purple': 'from-purple-500 to-purple-600',
      'red': 'from-red-500 to-red-600',
      'orange': 'from-orange-500 to-orange-600',
      'teal': 'from-teal-500 to-teal-600',
      'indigo': 'from-indigo-500 to-indigo-600',
      'pink': 'from-pink-500 to-pink-600'
    };
    return colorMap[color] || 'from-slate-500 to-slate-600';
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(bank);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(bank.id);
  };

  return (
    <div 
      className={`relative bg-gradient-to-br ${getCardColor(bank.color)} rounded-xl p-6 text-white cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg`}
      onClick={() => onClick(bank)}
    >
      {/* Card Actions */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={handleEdit}
          className="p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          title="Edit Card"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 bg-white/20 rounded-full hover:bg-red-500/50 transition-colors"
          title="Delete Card"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Bank Icon */}
      <div className="mb-4">
        <CreditCardIcon className="h-8 w-8 opacity-80" />
      </div>

      {/* Bank Name */}
      <h3 className="text-lg font-semibold mb-1 truncate">
        {bank.bank_name}
      </h3>

      {/* Account Name */}
      <p className="text-sm opacity-80 mb-4 truncate">
        {bank.account}
      </p>

      {/* Balance */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs opacity-70 mb-1">Current Balance</p>
          <p className="text-2xl font-bold">
            {formatBalance(bank.current_balance)}
          </p>
        </div>
        
        {/* Status Indicator */}
        <div className="text-right">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            bank.current_balance >= 0 
              ? 'bg-green-500/20 text-green-100' 
              : 'bg-red-500/20 text-red-100'
          }`}>
            {bank.current_balance >= 0 ? '●' : '●'} 
            {bank.current_balance >= 0 ? 'Active' : 'Overdrawn'}
          </div>
          
          {/* API Status */}
          {bank.endpoint && (
            <p className="text-xs opacity-60 mt-1">API Connected</p>
          )}
        </div>
      </div>

      {/* Card Pattern Decoration */}
      <div className="absolute bottom-0 right-0 opacity-10">
        <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
          <circle cx="90" cy="50" r="40" fill="currentColor" />
          <circle cx="110" cy="30" r="30" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
};

export default BankCard;