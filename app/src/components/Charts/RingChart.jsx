// src/components/Charts/RingChart.jsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const formatRingCurrency = (amount, currencySymbol = "$") => {
  if (typeof amount !== 'number') return `${currencySymbol}0`;
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const RingChart = ({
  data, // Array: { name: string, value: number, color: string (hex/rgb for Recharts fill) }
  centerLabel = "Total",
  centerValue,
  currencySymbol = "$",
  ringThickness = 20, // Use this to calculate innerRadius percentage or fixed value
  sizeClassName = "w-60 h-60 md:w-64 md:h-64", // Tailwind size for the container
  legendEnabled = true,
  className = "",
}) => {
  const totalChartValue = data.reduce((sum, entry) => sum + entry.value, 0);
  const displayCenterValue = centerValue !== undefined ? centerValue : totalChartValue;

  // Calculate inner and outer radius for Recharts based on a percentage or fixed approach
  // This makes the ringThickness prop more conceptual for Recharts usage
  const outerRadiusPercentage = 100; // e.g., 100% of the smaller dimension of the container
  const innerRadiusPercentage = outerRadiusPercentage - (ringThickness * 2.5); // Adjust multiplier for desired thickness visually

  return (
    <div className={`flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 p-2 ${className}`}>
      <div className={`relative ${sizeClassName} flex-shrink-0`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={`${innerRadiusPercentage}%`}
              outerRadius={`${outerRadiusPercentage}%`}
              fill="#8884d8" // Default fill, overridden by Cell
              paddingAngle={data.length > 1 ? 1 : 0}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {/* <Tooltip formatter={(value) => [`${currencySymbol}${value.toLocaleString()}`, entry.name]}/> */}
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          {centerLabel && <span className="text-xs text-slate-500">{centerLabel}</span>}
          <span className="text-xl md:text-2xl font-bold text-slate-800">
            {currencySymbol}
            {formatRingCurrency(displayCenterValue)}
          </span>
        </div>
      </div>

      {legendEnabled && data.length > 0 && (
        <div className="flex flex-col space-y-1.5 md:space-y-2 max-w-[150px] md:max-w-xs">
          {data.map((item) => (
            <div key={item.name} className="flex items-center">
              <span
                className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full mr-2 flex-shrink-0"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              ></span>
              <span className="text-xs md:text-sm text-slate-600 truncate" title={item.name}>{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RingChart;