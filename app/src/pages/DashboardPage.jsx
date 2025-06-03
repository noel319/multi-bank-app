import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import BalanceRingChart from '../components/Charts/BalanceRingChart';
import MonthlyBalanceChart from '../components/Charts/MonthlyBalanceChart';
import CostCenterChart from '../components/Charts/CostCenterChart';
import MonthSelector from '../components/UI/MonthSelector';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import TotalBalanceCard from '../components/UI/TotalBalanceCard';
import PersonalAccountCard from '../components/UI/PersonalAccountCard';
import TransactionItem from '../components/Core/TransactionItem';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  BanknotesIcon,
  CreditCardIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const DashboardPage = () => {  
  const navigate = useNavigate();
  const { homeData, getDashboardData, loading: appLoading } = useApp();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    loadDashboardData();
  }, [selectedMonth]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const result = await getDashboardData(selectedMonth);
      if (result.success) {
        setDashboardData(result.data);
      } else {
        console.error('Failed to load dashboard data:', result.error);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate monthly statistics
  const getMonthlyStats = () => {
    if (!dashboardData?.monthlyBankData) return null;
    
    let totalIncome = 0;
    let totalExpenses = 0;
    let transactionCount = 0;
    
    dashboardData.monthlyBankData.forEach(bankData => {
      if (bankData.monthlyData) {
        bankData.monthlyData.forEach(month => {
          totalIncome += month.income || 0;
          totalExpenses += Math.abs(month.expenses || 0);
          transactionCount += month.transactionCount || 0;
        });
      }
    });
    
    const netFlow = totalIncome - totalExpenses;
    
    return {
      totalIncome,
      totalExpenses,
      netFlow,
      transactionCount
    };
  };

  const monthlyStats = getMonthlyStats();

  if (appLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl text-slate-600">Failed to load dashboard data.</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Dashboard</h1>
        <MonthSelector 
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      </div>

      {/* Top Section: Balance Ring Chart & Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Ring Chart */}
        <div className="lg:col-span-1">
          <BalanceRingChart 
            banks={homeData.banks}
            totalBalance={homeData.totalBalance}
            size={300}
          />
        </div>

        {/* Right Side: Balance Cards and Quick Stats */}
        <div className="lg:col-span-2 space-y-4">
          {/* Balance Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TotalBalanceCard totalBalance={homeData.totalBalance} />
            <PersonalAccountCard personalBalance={homeData.personalBalance} />
          </div>

          {/* Monthly Statistics Cards */}
          {monthlyStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Income</p>
                    <p className="text-lg font-semibold text-green-600">
                      ${monthlyStats.totalIncome.toLocaleString()}
                    </p>
                  </div>
                  <ArrowTrendingUpIcon className="h-8 w-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Expenses</p>
                    <p className="text-lg font-semibold text-red-600">
                      ${monthlyStats.totalExpenses.toLocaleString()}
                    </p>
                  </div>
                  <ArrowTrendingDownIcon className="h-8 w-8 text-red-500" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Net Flow</p>
                    <p className={`text-lg font-semibold ${monthlyStats.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${monthlyStats.netFlow.toLocaleString()}
                    </p>
                  </div>
                  <BanknotesIcon className={`h-8 w-8 ${monthlyStats.netFlow >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Transactions</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {monthlyStats.transactionCount.toLocaleString()}
                    </p>
                  </div>
                  <ChartBarIcon className="h-8 w-8 text-blue-500" />
                </div>
              </div>
            </div>
          )}

          {/* Recent Transactions Section */}
          <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-slate-700">Recent Transactions</h3>
              <button
                onClick={() => navigate('/transactions')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All →
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {homeData.recentTransactions && homeData.recentTransactions.length > 0 ? (
                homeData.recentTransactions.slice(0, 5).map(transaction => (
                  <TransactionItem key={transaction.id} transaction={transaction} />
                ))
              ) : (
                <div className="text-center py-6">
                  <CreditCardIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No recent transactions</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Import data to see transactions here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Overview Per Bank Card */}
      <div>
        <h2 className="text-xl font-semibold text-slate-700 mb-4">
          Monthly Overview - {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardData.monthlyBankData?.map(bankData => (
            <MonthlyBalanceChart
              key={bankData.bank_id}
              data={bankData.monthlyData}
              title={`${bankData.bank_name} - Monthly Flow`}
              height={250}
            />
          )) || <div className="col-span-full text-center text-slate-500">No monthly data available</div>}
        </div>
      </div>

      {/* Annual Cost Center Analysis Per Bank */}
      <div>
        <h2 className="text-xl font-semibold text-slate-700 mb-4">Annual Analysis by Cost Center (Per Bank)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dashboardData.annualBankCostCenterData && dashboardData.annualBankCostCenterData.length > 0 ? (
            dashboardData.annualBankCostCenterData.map(bankData => (
              <CostCenterChart
                key={bankData.bank_id}
                data={bankData.costCenterData}
                title={`${bankData.bank_name} - Annual Cost Centers`}
                layout="vertical"
                height={400}
              />
            ))
          ) : (
            <div className="col-span-full">
              <div className="bg-white p-12 rounded-lg shadow border border-slate-200 text-center">
                <ChartBarIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No Cost Center Data Available</h3>
                <p className="text-slate-500 mb-4">
                  Annual cost center analysis will appear here once you have transaction data with cost center categories.
                </p>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600">
                    <strong>To see this data:</strong> Import transactions with cost center information or ensure your data includes expense categories.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Total Annual Cost Center Analysis */}
      <div>
        <h2 className="text-xl font-semibold text-slate-700 mb-4">Total Annual Analysis by Cost Center</h2>
        {dashboardData.totalAnnualCostCenterData && dashboardData.totalAnnualCostCenterData.length > 0 ? (
          <CostCenterChart
            data={dashboardData.totalAnnualCostCenterData}
            title="All Banks - Annual Cost Centers"
            layout="horizontal"
            height={500}
          />
        ) : (
          <div className="bg-white p-12 rounded-lg shadow border border-slate-200 text-center">
            <ChartBarIcon className="h-20 w-20 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-600 mb-3">No Total Cost Center Data Available</h3>
            <p className="text-slate-500 mb-6">
              Your combined annual cost center analysis will be displayed here once transaction data is available.
            </p>
            <div className="bg-slate-50 p-6 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-slate-600 mb-3">
                <strong>This chart will show:</strong>
              </p>
              <ul className="text-sm text-slate-500 text-left space-y-1">
                <li>• Total spending by category across all banks</li>
                <li>• Annual expense breakdown</li>
                <li>• Cost center comparisons</li>
                <li>• Spending pattern insights</li>
              </ul>
            </div>
          </div>
        )}
      </div>      
    </div>
  );
};

export default DashboardPage;