// src/components/Core/BankCard.jsx
import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/formatters';

const BankCard = ({ bank, onClick, onEdit, onDelete }) => {
  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit(bank);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(bank.id);
  };

  const cardColorClasses = {
    blue: 'bg-gradient-to-br from-blue-500 to-blue-700',
    purple: 'bg-gradient-to-br from-purple-500 to-purple-700',
    green: 'bg-gradient-to-br from-green-500 to-green-700',
    red: 'bg-gradient-to-br from-red-500 to-red-700',
    orange: 'bg-gradient-to-br from-orange-500 to-orange-700',
    indigo: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
    pink: 'bg-gradient-to-br from-pink-500 to-pink-700',
    teal: 'bg-gradient-to-br from-teal-500 to-teal-700'
  };

  const colorClass = cardColorClasses[bank.color] || cardColorClasses.blue;

  return (
    <div 
      className={`${colorClass} text-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200 relative group`}
      onClick={onClick}
    >
      {/* Action Buttons */}
      <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={handleEditClick}
          className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors duration-200"
          title="Edit Card"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          onClick={handleDeleteClick}
          className="p-1.5 bg-white/20 hover:bg-red-500/80 rounded-full transition-colors duration-200"
          title="Delete Card"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Bank Name */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{bank.bank_name}</h3>
        <p className="text-white/80 text-sm">{bank.account_name}</p>
      </div>

      {/* Card Number */}
      <div className="mb-6">
        <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Card Number</p>
        <p className="font-mono text-sm">
          {bank.card_number ? 
            `•••• •••• •••• ${bank.card_number.slice(-4)}` : 
            '•••• •••• •••• ••••'
          }
        </p>
      </div>

      {/* Balance */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Balance</p>
          <p className="text-2xl font-bold">{formatCurrency(bank.balance)}</p>
        </div>
        <div className="text-right">
          <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Status</p>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            bank.is_active ? 'bg-green-500/30 text-green-100' : 'bg-red-500/30 text-red-100'
          }`}>
            {bank.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Card Chip Design */}
      <div className="absolute bottom-4 right-4 w-8 h-6 bg-white/20 rounded-sm"></div>
    </div>
  );
};

export default BankCard;