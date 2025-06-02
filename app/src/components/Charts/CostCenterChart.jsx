import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CostCenterChart = ({ 
  data, 
  title, 
  layout = 'horizontal', // 'horizontal' or 'vertical'
  height = 400,
  className = ""
}) => {
  const formatCurrency = (value) => {
    return `$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800">{`Cost Center: ${label}`}</p>
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

  if (layout === 'horizontal') {
    return (
      <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
        {title && (
          <h3 className="text-lg font-semibold text-slate-700 mb-4">{title}</h3>
        )}
        <ResponsiveContainer width="100%" height={height}>
          <BarChart 
            layout="horizontal"
            data={data} 
            margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number"
              tick={{ fontSize: 12 }}
              stroke="#64748b"
              tickFormatter={formatCurrency}
            />
            <YAxis 
              type="category"
              dataKey="name" 
              tick={{ fontSize: 12 }}
              stroke="#64748b"
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="income" 
              fill="#10b981" 
              name="Income"
              radius={[0, 2, 2, 0]}
            />
            <Bar 
              dataKey="expense" 
              fill="#ef4444" 
              name="Expense"
              radius={[0, 2, 2, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-slate-700 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, angle: -45, textAnchor: 'end' }}
            stroke="#64748b"
            height={80}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#64748b"
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="income" 
            fill="#10b981" 
            name="Income"
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="expense" 
            fill="#ef4444" 
            name="Expense"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CostCenterChart;