import React from 'react';
import { useMockData } from '../contexts/MockDataContext';
import BankCard from '../components/Core/BankCard';
import TransactionItem from '../components/Core/TransactionItem';
import RingChart from '../components/Charts/RingChart';
import StatisticBarChart from '../components/Charts/StatisticBarChart';
import SpendingCategoryList from '../components/Charts/SpendingCategoryList';
import ExpenseTrendLineChart from '../components/Charts/ExpenseTrendLineChart';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82Ca9D']; // Old way
const ringChartData = [
  { name: 'Car Loan', value: 10200, color: COLORS[0] },
  { name: 'Investments', value: 8000, color: COLORS[1] },
  { name: 'Mortgage', value: 12000, color: COLORS[2] },
  { name: 'Rent', value: 6000, color: COLORS[3] },
  { name: 'Utilities', value: 3000, color: COLORS[4] },
  { name: 'Not Paid', value: 2000, color: COLORS[5] },
];
const totalForRing = ringChartData.reduce((sum, item) => sum + item.value, 0);

const statisticBarData = [
  { month: 'Jan', income: 9500, expense: 7000, balance: 2500 },
  { month: 'Feb', income: 12000, expense: 9000, balance: 3000 },
  { month: 'Mar', income: 8800, expense: 8000, balance: 800 },
  { month: 'Apr', income: 15000, expense: 9500, balance: 5500 },
  { month: 'May', income: 18000, expense: 9000, balance: 9000 },
  { month: 'Jun', income: 17000, expense: 8500, balance: 8500 },
];
const summaryData = { income: 60711.09, expense: 49048.31, cashback: 5915.04 };

const spendingCategories = [
  { name: 'Utility services', amount: 3178.10 },
  { name: 'Shopping', amount: 2178.68 },
  { name: 'Healthcare', amount: 878.68 },
  { name: 'Restaurant & cafe', amount: 578.68 },
  { name: 'Shopping', amount: 420.68 }, // Duplicate name example, key will handle
  { name: 'Fuel', amount: 178.68 },
];

const expenseTrendData = [
  { month: 'Oct', current: 18, previous: 22 },
  { month: 'Nov', current: 25, previous: 20 },
  { month: 'Dec', current: 77.6, previous: 45 },
  { month: 'Jan', current: 60, previous: 50 },
  { month: 'Feb', current: 30, previous: 35 },
  { month: 'Mar', current: 40, previous: null }, // Example with one series point missing
];
const referenceDot = { x: 'Dec', y: 77.6, label: '77.6' };

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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-2">
                <RingChart
                    data={ringChartData}
                    centerLabel="Spent"
                    centerValue={41200} // From image
                    className="bg-white rounded-xl shadow-lg"
                />                
            </div>

            
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
                <StatisticBarChart
                  barChartData={statisticBarData}
                  summaryData={summaryData}
                />

                <SpendingCategoryList
                  categoriesData={spendingCategories}
                />
            </div>
          ))}
        </div>
      </div>
      
      {/* Horizontal Bar Chart - Spending/Income by Cost Center */}
      <div>
        <h2 className="text-xl font-semibold text-slate-700 mb-3">Analysis by Cost Center</h2>
        <div className="bg-white p-4 rounded-lg shadow">
            <ExpenseTrendLineChart
                    trendData={expenseTrendData}
                    series1Key="current"
                    series2Key="previous"
                    referenceDotData={referenceDot}
                    series1Color={COLORS[0]}
                    series2Color={COLORS[1]}
            />
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