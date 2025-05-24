// src/components/Spending/SpendingCategoryBar.jsx
import React from 'react';

const SpendingCategoryBar = ({ name, amount, colorHex, maxValue, currencySymbol = "$" }) => {
  const percentage = maxValue > 0 ? (amount / maxValue) * 100 : 0;
  const formattedAmount = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="mb-2.5 last:mb-0">
      <div className="flex justify-between items-center text-xs mb-1">
        <span className="text-slate-700 font-medium">{name}</span>
        <span className="text-slate-600 font-semibold">{currencySymbol}{formattedAmount}</span>
      </div>
      <div className="h-3 md:h-3.5 w-full bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: colorHex }}
          aria-valuenow={amount}
          aria-valuemin="0"
          aria-valuemax={maxValue}
        ></div>
      </div>
    </div>
  );
};

export default SpendingCategoryBar;