import React from 'react';
import { WalletIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/formatters';

const PersonalAccountCard = ({ personalBalance }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-3 bg-green-100 rounded-full mr-3">
            <WalletIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Personal Account</h3>
            <p className="text-sm text-slate-500">Your savings</p>
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-3xl font-bold text-slate-800 mb-2">
          {formatCurrency(personalBalance)}
        </p>
        <div className="flex items-center justify-end text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <span className="text-slate-600">Available</span>
        </div>
      </div>

      {/* Progress bar for visual appeal */}
      <div className="mt-4">
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
            style={{ width: personalBalance > 0 ? '100%' : '0%' }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default PersonalAccountCard;