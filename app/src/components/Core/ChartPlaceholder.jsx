import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline'; // Or any other relevant icon

const ChartPlaceholder = ({ title, height = "h-64", message = "Chart will be displayed here" }) => {
  return (
    <div 
      className={`bg-slate-100 border border-slate-300 border-dashed rounded-lg flex flex-col items-center justify-center p-4 ${height} text-slate-500 text-center`}
    >
      <ChartBarIcon className="h-12 w-12 text-slate-400 mb-3" aria-hidden="true" />
      {title && <h4 className="text-sm font-medium text-slate-600 mb-1">{title}</h4>}
      <p className="text-xs">{message}</p>
    </div>
  );
};

export default ChartPlaceholder;