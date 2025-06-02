import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const MonthSelector = ({ selectedMonth, onMonthChange, className = "" }) => {
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const parseMonth = (monthStr) => {
    const [year, month] = monthStr.split('-').map(Number);
    return new Date(year, month - 1);
  };

  const formatMonth = (monthStr) => {
    const date = parseMonth(monthStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const getNextMonth = (monthStr) => {
    const date = parseMonth(monthStr);
    date.setMonth(date.getMonth() + 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const getPrevMonth = (monthStr) => {
    const date = parseMonth(monthStr);
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const currentMonth = getCurrentMonth();
  const isCurrentMonth = selectedMonth === currentMonth;

  return (
    <div className={`flex items-center justify-between bg-white p-3 rounded-lg shadow ${className}`}>
      <button
        onClick={() => onMonthChange(getPrevMonth(selectedMonth))}
        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-800">
          {formatMonth(selectedMonth)}
        </h3>
        {isCurrentMonth && (
          <span className="text-xs text-blue-600 font-medium">Current Month</span>
        )}
      </div>
      
      <button
        onClick={() => onMonthChange(getNextMonth(selectedMonth))}
        disabled={isCurrentMonth}
        className={`p-2 rounded-lg transition-colors ${
          isCurrentMonth 
            ? 'text-slate-300 cursor-not-allowed' 
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
        }`}
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default MonthSelector;