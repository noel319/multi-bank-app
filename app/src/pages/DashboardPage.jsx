import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import BalanceRingChart from '../components/Charts/BalanceRingChart';
import MonthlyBalanceChart from '../components/Charts/MonthlyBalanceChart';
import CostCenterChart from '../components/Charts/CostCenterChart';
import MonthSelector from '../components/UI/MonthSelector';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const DashboardPage = () => {  
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

      {/* Top Section: Balance Ring Chart & Bank Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Ring Chart */}
        <div className="lg:col-span-1">
          <BalanceRingChart 
            banks={homeData.banks}
            totalBalance={homeData.totalBalance}
            size={300}
          />
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
          {dashboardData.annualBankCostCenterData?.map(bankData => (
            <CostCenterChart
              key={bankData.bank_id}
              data={bankData.costCenterData}
              title={`${bankData.bank_name} - Annual Cost Centers`}
              layout="vertical"
              height={400}
            />
          )) || <div className="col-span-full text-center text-slate-500">No annual cost center data available</div>}
        </div>
      </div>

      {/* Total Annual Cost Center Analysis */}
      <div>
        <h2 className="text-xl font-semibold text-slate-700 mb-4">Total Annual Analysis by Cost Center</h2>
        <CostCenterChart
          data={dashboardData.totalAnnualCostCenterData || []}
          title="All Banks - Annual Cost Centers"
          layout="horizontal"
          height={500}
        />
      </div>      
    </div>
  );
};

export default DashboardPage;