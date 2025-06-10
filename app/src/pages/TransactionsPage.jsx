import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import TransactionsTable from '../components/Table/TransactionsTable';
import TransactionsFilters from '../components/UI/TransactionsFilter';
import Pagination from '../components/UI/Pagination';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/Core/Button';

const TransactionsPage = () => {
  const { user } = useAuth();
  
  // State management
  const [transactions, setTransactions] = useState([]);
  const [banks, setBanks] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10
  });

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    dateRange: 'all',
    startDate: '',
    endDate: '',
    bank: 'all',
    state: 'all',
    costCenter: 'all',
    minAmount: '',
    maxAmount: ''
  });

  // Sort state
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  // Statistics state
  const [statistics, setStatistics] = useState({
    totalTransactions: 0,
    incomeCount: 0,
    expenseCount: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netAmount: 0
  });

  // Load initial data
  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  // Load transactions when filters or pagination changes
  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [filters, pagination.currentPage, pagination.itemsPerPage, sortField, sortDirection, user]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load banks and cost centers in parallel
      const [banksResponse, costCentersResponse] = await Promise.all([
        window.electronAPI.callPython({ action: 'get_banks_list' }),
        window.electronAPI.callPython({ action: 'get_cost_centers_list' })
      ]);

      if (banksResponse.success) {
        setBanks(banksResponse.banks || []);
      } else {
        console.error('Failed to load banks:', banksResponse.error);
      }

      if (costCentersResponse.success) {
        setCostCenters(costCentersResponse.cost_centers || []);
      } else {
        console.error('Failed to load cost centers:', costCentersResponse.error);
      }

    } catch (error) {
      console.error('Error loading initial data:', error);
      await window.electronAPI.showErrorDialog({
        title: 'Error',
        content: 'Failed to load filter options'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      const params = {
        ...filters,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        sort_field: sortField,
        sort_direction: sortDirection
      };

      const [transactionsResponse, statisticsResponse] = await Promise.all([
        window.electronAPI.callPython({
          action: 'get_transactions_filtered',
          payload: params
        }),
        window.electronAPI.callPython({
          action: 'get_transaction_statistics',
          payload: { ...filters }
        })
      ]);

      if (transactionsResponse.success) {
        setTransactions(transactionsResponse.transactions || []);
        setPagination(prev => ({
          ...prev,
          totalPages: transactionsResponse.pagination?.totalPages || 0,
          totalItems: transactionsResponse.pagination?.totalItems || 0
        }));
      } else {
        console.error('Failed to load transactions:', transactionsResponse.error);
        setTransactions([]);
        await window.electronAPI.showErrorDialog({
          title: 'Error',
          content: transactionsResponse.error || 'Failed to load transactions'
        });
      }

      if (statisticsResponse.success) {
        setStatistics(statisticsResponse.statistics || {});
      }

    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
      await window.electronAPI.showErrorDialog({
        title: 'Error',
        content: 'Failed to connect to backend'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({
      ...prev,
      currentPage: 1 // Reset to first page when filters change
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      dateRange: 'all',
      startDate: '',
      endDate: '',
      bank: 'all',
      state: 'all',
      costCenter: 'all',
      minAmount: '',
      maxAmount: ''
    });
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
  };

  const handleItemsPerPageChange = (itemsPerPage) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage,
      currentPage: 1
    }));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      
      const params = {
        filters: {
          ...filters,
          sort_field: sortField,
          sort_direction: sortDirection
        },
        format: 'csv'
      };

      const response = await window.electronAPI.callPython({
        action: 'export_transactions',
        payload: params
      });

      if (response.success) {
        await window.electronAPI.showMessageDialog({
          type: 'info',
          title: 'Export Successful',
          message: `Exported ${response.records_exported} transactions successfully!`,
          detail: `File saved to: ${response.file_path}`
        });
      } else {
        await window.electronAPI.showErrorDialog({
          title: 'Export Error',
          content: response.error || 'Failed to export transactions'
        });
      }
    } catch (error) {
      console.error('Error exporting transactions:', error);
      await window.electronAPI.showErrorDialog({
        title: 'Error',
        content: 'Failed to export transactions'
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    const confirmed = await window.electronAPI.showMessageDialog({
      type: 'question',
      buttons: ['Cancel', 'Delete'],
      defaultId: 0,
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this transaction?',
      detail: 'This action cannot be undone and will affect your account balance.'
    });

    if (confirmed.response === 1) {
      try {
        const response = await window.electronAPI.callPython({
          action: 'delete_transaction',
          payload: { transaction_id: transactionId }
        });

        if (response.success) {
          await loadTransactions(); // Refresh data
          await window.electronAPI.showMessageDialog({
            type: 'info',
            title: 'Success',
            message: 'Transaction deleted successfully!'
          });
        } else {
          await window.electronAPI.showErrorDialog({
            title: 'Error',
            content: response.error || 'Failed to delete transaction'
          });
        }
      } catch (error) {
        console.error('Error deleting transaction:', error);
        await window.electronAPI.showErrorDialog({
          title: 'Error',
          content: 'Failed to delete transaction'
        });
      }
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Transactions</h1>
          <p className="text-slate-500 mt-1">View and manage your financial transactions</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="secondary"
            size="sm"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            onClick={handleExport}
            disabled={exporting || transactions.length === 0}
            variant="secondary"
            size="sm"
          >
            <ArrowDownTrayIcon className={`h-4 w-4 mr-2 ${exporting ? 'animate-pulse' : ''}`} />
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <TransactionsFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        banks={banks}
        costCenters={costCenters}
      />

      {/* Summary Stats */}
      {!loading && transactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-lg">#</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Total Transactions</p>
                <p className="text-2xl font-semibold text-slate-900">{transactions.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Income Transactions</p>
                <p className="text-2xl font-semibold text-blue-600">
                  {statistics.incomeCount || transactions.filter(t => t.state === 'Income').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Expense Transactions</p>
                <p className="text-2xl font-semibold text-red-600">
                  {statistics.expenseCount || transactions.filter(t => t.state === 'Expense').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <TransactionsTable
        transactions={transactions}
        loading={loading}
        onSort={handleSort}
        sortField={sortField}
        sortDirection={sortDirection}
        onDeleteTransaction={handleDeleteTransaction}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {/* Empty State */}
      {!loading && transactions.length === 0 && (
        <div className="bg-white rounded-lg shadow border p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-slate-400 text-2xl">💳</span>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No transactions found</h3>
          <p className="text-slate-500 mb-6">
            {Object.values(filters).some(v => v && v !== 'all') 
              ? 'Try adjusting your filters or search criteria'
              : 'Import transactions from Excel files or sync with Google Sheets to get started'
            }
          </p>
          {Object.values(filters).some(v => v && v !== 'all') && (
            <Button onClick={handleClearFilters} variant="primary">
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;