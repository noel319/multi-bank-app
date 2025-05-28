import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const TotalBalanceCard = ({ totalBalance }) => {
  // Create data for the ring chart
  const data = [
    { name: 'Balance', value: Math.max(totalBalance, 0) },
    { name: 'Empty', value: Math.max(10000 - totalBalance, 0) } // Assuming max display of 10000 for visual
  ];

  const COLORS = ['#3B82F6', '#E5E7EB']; // Blue for balance, light gray for empty

  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Total Balance</h3>
          <p className="text-sm text-slate-500">All accounts combined</p>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={60}
                startAngle={90}
                endAngle={450}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-slate-800">
              {formatCurrency(totalBalance)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total</p>
          </div>
        </div>
      </div>

      {/* Growth indicator */}
      <div className="mt-4 flex items-center justify-center">
        <div className="flex items-center text-sm">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-slate-600">
            {totalBalance > 0 ? 'Portfolio Value' : 'Add accounts to see balance'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TotalBalanceCard;