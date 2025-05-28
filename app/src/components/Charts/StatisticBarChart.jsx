// src/components/Charts/StatisticBarChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ArrowDownIcon, ArrowUpIcon, ArrowPathIcon as CashbackIcon } from '@heroicons/react/24/solid'; // Using ArrowPathIcon for cashback for variety
import { CHART_COLORS } from '../../utils/constants';

// Helper for formatting currency in summary
const formatSummaryCurrency = (amount) => {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-sm p-3 shadow-lg rounded-md border border-slate-200">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }} className="text-xs">
            {`${entry.name}: $${formatSummaryCurrency(entry.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const StatisticBarChart = ({
  barChartData, // Array: { month: 'Jan', income: 9000, expense: 7000, balance: 2000 }
  summaryData, // Object: { income: 60711.09, expense: 49048.31, cashback: 5915.04 }
  onDateFilterChange, // Callback for date filter changes
  className = "",
}) => {
  // Dummy date filter options
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <div className={`bg-white p-4 md:p-6 rounded-xl shadow-lg ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800 mb-2 sm:mb-0">Statistic</h3>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>From</span>
          <select defaultValue="Jan" className="p-1 border border-slate-300 rounded text-xs focus:ring-indigo-500 focus:border-indigo-500">
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <span>To</span>
          <select defaultValue="Jun" className="p-1 border border-slate-300 rounded text-xs focus:ring-indigo-500 focus:border-indigo-500">
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select defaultValue={currentYear} className="p-1 border border-slate-300 rounded text-xs focus:ring-indigo-500 focus:border-indigo-500">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart Section */}
        <div className="lg:col-span-2 h-64 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} barGap={2} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} dy={5} stroke="#6b7280" />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                fontSize={10} 
                stroke="#6b7280"
                tickFormatter={(value) => value >= 1000 ? `${value/1000}k` : value}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(209, 213, 229, 0.2)' }} />
              {/* Legend can be added if needed, but image doesn't show one */}
              {/* <Legend wrapperStyle={{fontSize: "10px", paddingTop: "10px"}}/> */}
              <Bar dataKey="income" name="Income" radius={[4, 4, 0, 0]}>
                {barChartData.map((entry, index) => (
                    <Cell key={`cell-income-${index}`} fill={CHART_COLORS[0]} />
                ))}
              </Bar>
              <Bar dataKey="expense" name="Expense" radius={[4, 4, 0, 0]}>
                 {barChartData.map((entry, index) => (
                    <Cell key={`cell-expense-${index}`} fill={CHART_COLORS[1]} />
                ))}
              </Bar>
              <Bar dataKey="balance" name="Balance" radius={[4, 4, 0, 0]}>
                {barChartData.map((entry, index) => (
                    <Cell key={`cell-balance-${index}`} fill={CHART_COLORS[2]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Section */}
        <div className="lg:col-span-1 flex flex-col justify-around space-y-3 md:space-y-4">
          {summaryData && (
            <>
              <div className="flex items-center">
                <span className="p-2.5 bg-red-100 rounded-full mr-3">
                  <ArrowDownIcon className="h-4 w-4 text-red-500" />
                </span>
                <div>
                  <p className="text-xs text-slate-500">Income</p>
                  <p className="text-md font-semibold text-slate-800">${formatSummaryCurrency(summaryData.income)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="p-2.5 bg-green-100 rounded-full mr-3">
                  <ArrowUpIcon className="h-4 w-4 text-green-500" />
                </span>
                <div>
                  <p className="text-xs text-slate-500">Expenses</p>
                  <p className="text-md font-semibold text-slate-800">${formatSummaryCurrency(summaryData.expense)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="p-2.5 bg-blue-100 rounded-full mr-3">
                  <CashbackIcon className="h-4 w-4 text-blue-500" />
                </span>
                <div>
                  <p className="text-xs text-slate-500">Cashback</p> {/* Or "Net Balance" / "Savings" */}
                  <p className="text-md font-semibold text-slate-800">${formatSummaryCurrency(summaryData.cashback)}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatisticBarChart;