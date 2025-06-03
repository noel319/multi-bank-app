import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MonthlyBalanceChart = ({ 
  data, 
  title, 
  showIncome = true, 
  showExpense = true, 
  showBalance = true,
  height = 300,
  className = ""
}) => {
  const formatCurrency = (value) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800">{`Month: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
      {title && (
        <h4 className="text-lg font-semibold text-slate-700 mb-4">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
            stroke="#64748b"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#64748b"
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {showIncome && (
            <Bar 
              dataKey="income" 
              fill="#10b981" 
              name="Income"
              radius={[2, 2, 0, 0]}
            />
          )}
          {showExpense && (
            <Bar 
              dataKey="expense" 
              fill="#ef4444" 
              name="Expense"
              radius={[2, 2, 0, 0]}
            />
          )}
          {showBalance && (
            <Bar 
              dataKey="balance" 
              fill="#3b82f6" 
              name="Balance"
              radius={[2, 2, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyBalanceChart;