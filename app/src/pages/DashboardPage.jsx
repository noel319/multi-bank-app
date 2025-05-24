import React from 'react';
import { useMockData } from '../contexts/MockDataContext';
import BankCard from '../components/Core/BankCard';
import TransactionItem from '../components/Core/TransactionItem';
import ChartPlaceholder from '../components/Core/ChartPlaceholder';
import { CHART_COLORS } from '../../utils/constants'; 

// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82Ca9D']; // Old way
const COLORS = CHART_COLORS; 

const DashboardPage = () => {
  const { accounts, totalBalance, transactions } = useMockData();

  const pieChartData = accounts.map((acc, index) => ({
    name: acc.bankName,
    value: acc.balance,
    fill: COLORS[index % COLORS.length]
  }));
  
  return (
    <div className="space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Dashboard</h1>

      {/* Top Section: Total Balance Ring Chart & Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow h-full flex flex-col justify-center items-center">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Total Balance Distribution</h3>
          <ChartPlaceholder title="Ring Chart: Total Balance" height="h-48 md:h-56"/>
           <p className="mt-2 text-2xl font-bold text-brand-blue-dark">
            $ {totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-slate-500">Consolidated Balance</p>
        </div>
        <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-700 mb-3">Your Accounts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accounts.slice(0, 4).map(acc => ( // .map() usage
                    <BankCard key={acc.id} account={acc} clickable={true} />
                ))}
            </div>
        </div>
      </div>

      {/* Middle Section: Vertical Bar Charts (Monthly per card) */}
      <div>
        <h2 className="text-xl font-semibold text-slate-700 mb-3">Monthly Overview (Per Account)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.slice(0,3).map(account => ( // .map() usage
            <div key={account.id} className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-md font-medium text-slate-600 mb-2">{account.bankName} - Monthly Flow</h3>
              <ChartPlaceholder title={`Bar Chart: ${account.bankName}`} height="h-56"/>
            </div>
          ))}
        </div>
      </div>
      
      {/* Horizontal Bar Chart - Spending/Income by Cost Center */}
      <div>
        <h2 className="text-xl font-semibold text-slate-700 mb-3">Analysis by Cost Center</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          <ChartPlaceholder title="Horizontal Bar Chart: Cost Centers" height="h-72"/>
        </div>
      </div>

      {/* Bottom Section: Recent Transactions Table */}
      <div>
        <h2 className="text-xl font-semibold text-slate-700 mb-3">Recent Transactions</h2>
        <div className="bg-white p-1 md:p-4 rounded-lg shadow">
          {transactions.slice(0, 5).map(tx => ( // .map() usage
            <TransactionItem key={tx.id} transaction={tx} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;