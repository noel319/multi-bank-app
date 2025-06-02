import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const BalanceRingChart = ({ 
  banks, 
  totalBalance,
  className = "",
  size = 250
}) => {
  // Default colors for bank cards
  const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  
  // Transform banks data for the chart
  const chartData = banks.map((bank, index) => ({
    id: bank.id,
    name: bank.bank_name,
    value: Math.abs(bank.current_balance),
    color: bank.color || defaultColors[index % defaultColors.length],
    account: bank.account
  }));

  const formatCurrency = (value) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800">{data.name}</p>
          <p className="text-sm text-gray-600">{data.account}</p>
          <p className="text-sm font-medium" style={{ color: data.color }}>
            {formatCurrency(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="500"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CenterLabel = ({ cx, cy }) => (
    <g>
      <text 
        x={cx} 
        y={cy - 10} 
        textAnchor="middle" 
        dominantBaseline="middle"
        className="text-sm font-medium fill-slate-600"
      >
        Total Balance
      </text>
      <text 
        x={cx} 
        y={cy + 10} 
        textAnchor="middle" 
        dominantBaseline="middle"
        className="text-lg font-bold fill-slate-800"
      >
        {formatCurrency(totalBalance)}
      </text>
    </g>
  );

  return (
    <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
      <h3 className="text-lg font-semibold text-slate-700 mb-4 text-center">
        Balance Distribution
      </h3>
      <ResponsiveContainer width="100%" height={size}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={size * 0.35}
            innerRadius={size * 0.2}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <CenterLabel cx={size/2} cy={size/2} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="mt-4 space-y-2">
        {chartData.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-slate-700">{entry.name}</span>
            </div>
            <span className="text-slate-600 font-medium">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BalanceRingChart;