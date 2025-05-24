// src/components/Spending/SpendingCategoryList.jsx
import React from 'react';
import SpendingCategoryBar from './SpendingCategoryBar';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { CHART_COLORS } from '../../utils/constants'; // Your hex color array

const SpendingCategoryList = ({
  title = "Common spending categories",
  categoriesData, // Array: { name: string, amount: number }
  timePeriodLabel = "current month",
  className = "",
}) => {
  // Determine maxValue for percentage calculation (e.g., max amount in current list or a fixed target)
  const maxValue = categoriesData.length > 0 ? Math.max(...categoriesData.map(c => c.amount)) : 1;

  return (
    <div className={`bg-white p-4 md:p-6 rounded-xl shadow-lg ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-md font-semibold text-slate-800">{title}</h3>
        <button className="flex items-center text-xs text-red-500 hover:text-red-600">
          {timePeriodLabel}
          <ChevronDownIcon className="h-3 w-3 ml-1" />
        </button>
      </div>
      <div>
        {categoriesData.map((category, index) => (
          <SpendingCategoryBar
            key={category.name + index} // Add index for potential duplicate names if data allows
            name={category.name}
            amount={category.amount}
            colorHex={CHART_COLORS[index % CHART_COLORS.length]} // Cycle through defined colors
            maxValue={maxValue * 1.1} // Add a bit of headroom so the largest bar isn't always 100%
          />
        ))}
      </div>
    </div>
  );
};

export default SpendingCategoryList;