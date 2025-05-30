import React from 'react';
import { WalletIcon, TrendingUpIcon, TrendingDownIcon } from '@heroicons/react/24/outline';

const PersonalAccountCard = ({ personalBalance }) => {
  const formatBalance = (balance) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(balance || 0);
  };

  const isPositive = personalBalance >= 0;
  const TrendIcon = isPositive ? TrendingUpIcon : TrendingDownIcon;

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-lg text-white shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <WalletIcon className="h-6 w-6" />
          <h3 className="text-lg font-semibold">Personal Account</h3>
        </div>
        <TrendIcon className={`h-5 w-5 ${isPositive ? 'text-green-300' : 'text-red-300'}`} />
      </div>

      {/* Balance */}
      <div className="mb-4">
        <p className="text-sm opacity-80 mb-1">Available Balance</p>
        <p className="text-3xl font-bold">
          {formatBalance(personalBalance)}
        </p>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between">
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          isPositive 
            ? 'bg-green-500/20 text-green-200' 
            : 'bg-red-500/20 text-red-200'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
            isPositive ? 'bg-green-400' : 'bg-red-400'
          }`}></span>
          {isPositive ? 'Good Standing' : 'Low Balance'}
        </div>

        <div className="text-right">
          <p className="text-xs opacity-70">Personal Funds</p>
        </div>
      </div>

      {/* Decorative Pattern */}
      <div className="absolute bottom-0 right-0 opacity-10 overflow-hidden">
        <svg width="100" height="60" viewBox="0 0 100 60" fill="none">
          <path d="M0 40c20-10 40 10 60 0s40-10 60 0v20H0V40z" fill="currentColor" />
          <path d="M0 30c20-10 40 10 60 0s40-10 60 0v30H0V30z" fill="currentColor" opacity="0.5" />
        </svg>
      </div>
    </div>
  );
};

export default PersonalAccountCard;