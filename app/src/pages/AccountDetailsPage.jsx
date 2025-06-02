import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useApp } from '../contexts/AppContext';
import BankCard from '../components/Core/BankCard';
import TransactionItem from '../components/Core/TransactionItem';
import MonthlyBalanceChart from '../components/Charts/MonthlyBalanceChart';
import CostCenterChart from '../components/Charts/CostCenterChart';
import MonthSelector from '../components/UI/MonthSelector';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/Core/Button';

const FilterGroup = ({ onFilterChange, costCenters = [] }) => {
  const handleChange = (filterType, value) => {
    console.log("Filter changed:", filterType, value);
    if (onFilterChange) onFilterChange(filterType, value);
  };

  return (
    <div className="my-4 p-4 bg-white rounded-lg shadow flex flex-wrap gap-4 items-center">
      <select 
        onChange={(e) => handleChange('date', e.target.value)} 
        className="p-2 border border-slate-300 rounded-md text-sm"
      >
        <option value="all">All Dates</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>
      
      <select 
        onChange={(e) => handleChange('type', e.target.value)} 
        className="p-2 border border-slate-300 rounded-md text-sm"
      >
        <option value="all">All Types</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>
      
      <select 
        onChange={(e) => handleChange('costCenter', e.target.value)} 
        className="p-2 border border-slate-300 rounded-md text-sm"
      >
        <option value="all">All Cost Centers</option>
        {costCenters.map(cc => (
          <option key={cc.id} value={cc.id}>{cc.name}</option>
        ))}
      </select>
      
      <Button 
        onClick={() => handleChange('reset', null)} 
        variant="secondary" 
        size="sm"
      >
        Reset Filters
      </Button>
    </div>
  );
};

const BankDetailsPage = () => {
  const { bankId } = useParams();
  const navigate = useNavigate();
  const { homeData, getBankDetailData, getCostCenterList } = useApp();
  
  const [bankDetailData, setBankDetailData] = useState(null);
  const [costCenters, setCostCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ 
    date: 'all', 
    type: 'all', 
    costCenter: 'all' 
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const bank = homeData.banks.find(b => b.id === parseInt(bankId));

  useEffect(() => {
    loadBankDetailData();
    loadCostCenters();
  }, [bankId, selectedMonth]);

  const loadBankDetailData = async () => {
    if (!bankId) return;
    
    setLoading(true);
    try {
      const result = await getBankDetailData(parseInt(bankId), selectedMonth);
      if (result.success) {
        setBankDetailData(result.data);
      } else {
        console.error('Failed to load bank detail data:', result.error);
      }
    } catch (error) {
      console.error('Error loading bank detail data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCostCenters = async () => {
    try {
      const result = await getCostCenterList();
      if (result.success) {
        setCostCenters(result.data);
      }
    } catch (error) {
      console.error('Error loading cost centers:', error);
    }
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'reset') {
      setFilters({ date: 'all', type: 'all', costCenter: 'all' });
    } else {
      setFilters(prev => ({ ...prev, [filterType]: value }));
    }
  };

  const filteredTransactions = React.useMemo(() => {
    if (!bankDetailData?.monthlyTransactions) return [];
    
    return bankDetailData.monthlyTransactions
      .filter(transaction => {
        let passes = true;
        
        // Filter by type
        if (filters.type !== 'all') {
          const isIncome = transaction.price > 0;
          const isExpense = transaction.price < 0;
          if (filters.type === 'income' && !isIncome) passes = false;
          if (filters.type === 'expense' && !isExpense) passes = false;
        }
        
        // Filter by cost center
        if (filters.costCenter !== 'all') {
          if (transaction.cost_center_id !== parseInt(filters.costCenter)) passes = false;
        }
        
        return passes;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [bankDetailData?.monthlyTransactions, filters]);

  if (!bank) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl text-slate-600">Bank card not found.</h2>
        <Button onClick={() => navigate('/')} className="mt-4">
          Go Home
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="icon" onClick={() => navigate(-1)} className="mr-2">
            <ArrowLeftIcon className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            {bank.bank_name} Details
          </h1>
        </div>
        <MonthSelector 
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      </div>

      {/* Top Section: Bank Card & Monthly Balance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Card */}
        <div className="flex justify-center lg:justify-start">
          <div className="w-full max-w-sm">
            <BankCard bank={bank} clickable={false} />
          </div>
        </div>

        {/* Monthly Balance Chart */}
        <MonthlyBalanceChart
          data={bankDetailData?.monthlyBalanceData || []}
          title={`Monthly Flow - ${new Date(selectedMonth + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`}
          height={300}
        />
      </div>

      {/* Annual Cost Center Analysis */}
      <div>
        <h2 className="text-xl font-semibold text-slate-700 mb-4">
          Annual Spending by Cost Center
        </h2>
        <CostCenterChart
          data={bankDetailData?.annualCostCenterData || []}
          title={`${bank.bank_name} - Annual Cost Center Analysis`}
          layout="horizontal"
          height={400}
        />
      </div>

      {/* Monthly Transactions */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-slate-700">
            Monthly Transactions - {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
          </h2>
          <div className="text-sm text-slate-500">
            {filteredTransactions.length} transaction(s)
          </div>
        </div>
        
        <FilterGroup 
          onFilterChange={handleFilterChange} 
          costCenters={costCenters}
        />
        
        <div className="bg-white p-4 rounded-lg shadow">
          {filteredTransactions.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredTransactions.map(transaction => (
                <TransactionItem 
                  key={transaction.id} 
                  transaction={transaction} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-4">
                No transactions match your filters for this month.
              </p>
              <p className="text-sm text-slate-400">
                Try adjusting your filters or select a different month
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      {bankDetailData?.monthlyStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold text-green-600">Total Income</h3>
            <p className="text-2xl font-bold text-slate-800">
              ${bankDetailData.monthlyStats.totalIncome.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold text-red-600">Total Expenses</h3>
            <p className="text-2xl font-bold text-slate-800">
              ${Math.abs(bankDetailData.monthlyStats.totalExpense).toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold text-blue-600">Net Balance</h3>
            <p className={`text-2xl font-bold ${
              bankDetailData.monthlyStats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${bankDetailData.monthlyStats.netBalance.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankDetailsPage;