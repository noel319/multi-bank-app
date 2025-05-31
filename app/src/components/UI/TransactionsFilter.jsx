import React from 'react';
import { MagnifyingGlassIcon, CalendarIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

const FilterSelect = ({ label, value, onChange, options, icon: Icon, placeholder }) => (
  <div className="flex flex-col">
    <label className="text-xs font-medium text-slate-700 mb-1">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-8 py-2 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  </div>
);

const DateRangeFilter = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => (
  <div className="flex flex-col space-y-2">
    <label className="text-xs font-medium text-slate-700">Custom Date Range</label>
    <div className="flex space-x-2">
      <div className="relative flex-1">
        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Start date"
        />
      </div>
      <div className="flex items-center">
        <span className="text-slate-400 text-sm">to</span>
      </div>
      <div className="relative flex-1">
        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="End date"
        />
      </div>
    </div>
  </div>
);

const TransactionsFilters = ({
  filters,
  onFilterChange,
  onClearFilters,
  banks = [],
  costCenters = [],
  className = ""
}) => {
  const handleInputChange = (field, value) => {
    onFilterChange(field, value);
  };

  const quickDateFilters = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ];

  const stateOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'income', label: 'Income' },
    { value: 'outgoing', label: 'Expense' }
  ];

  const bankOptions = [
    { value: 'all', label: 'All Banks' },
    ...banks.map(bank => ({ 
      value: bank.bank_name, 
      label: bank.bank_name 
    }))
  ];

  const costCenterOptions = [
    { value: 'all', label: 'All Categories' },
    ...costCenters.map(cc => ({ 
      value: cc.cost_center_name, 
      label: cc.cost_center_name 
    }))
  ];

  const hasActiveFilters = () => {
    return filters.search || 
           filters.dateRange !== 'all' || 
           filters.startDate || 
           filters.endDate ||
           filters.bank !== 'all' || 
           filters.state !== 'all' || 
           filters.costCenter !== 'all' ||
           filters.minAmount ||
           filters.maxAmount;
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
          {hasActiveFilters() && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Active
            </span>
          )}
        </div>
        
        {hasActiveFilters() && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-md text-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <XMarkIcon className="w-4 h-4 mr-1" />
            Clear All
          </button>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Search */}
        <div>
          <label className="text-xs font-medium text-slate-700 mb-1 block">Search</label>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.search || ''}
              onChange={(e) => handleInputChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Quick Date Filters */}
        <div>
          <label className="text-xs font-medium text-slate-700 mb-2 block">Quick Filters</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {quickDateFilters.map(option => (
              <button
                key={option.value}
                onClick={() => handleInputChange('dateRange', option.value)}
                className={`px-3 py-2 text-xs font-medium rounded-md border transition-colors ${
                  filters.dateRange === option.value
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range */}
        <DateRangeFilter
          startDate={filters.startDate || ''}
          endDate={filters.endDate || ''}
          onStartDateChange={(value) => handleInputChange('startDate', value)}
          onEndDateChange={(value) => handleInputChange('endDate', value)}
        />

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FilterSelect
            label="Transaction Type"
            value={filters.state || 'all'}
            onChange={(value) => handleInputChange('state', value)}
            options={stateOptions}
          />

          <FilterSelect
            label="Bank"
            value={filters.bank || 'all'}
            onChange={(value) => handleInputChange('bank', value)}
            options={bankOptions}
          />

          <FilterSelect
            label="Category"
            value={filters.costCenter || 'all'}
            onChange={(value) => handleInputChange('costCenter', value)}
            options={costCenterOptions}
          />
        </div>

        {/* Amount Range */}
        <div>
          <label className="text-xs font-medium text-slate-700 mb-2 block">Amount Range</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                type="number"
                placeholder="Min amount"
                value={filters.minAmount || ''}
                onChange={(e) => handleInputChange('minAmount', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Max amount"
                value={filters.maxAmount || ''}
                onChange={(e) => handleInputChange('maxAmount', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsFilters;