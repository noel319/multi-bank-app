import React, { useState } from 'react';
import { TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import Button from '../Core/Button';

const BillingTable = ({ billingRecords, onDelete, onView }) => {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedRecords = [...billingRecords].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle different data types
    if (sortField === 'date') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const formatCurrency = (amount) => {
    return `$${Math.abs(amount).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const SortableHeader = ({ field, children }) => (
    <th 
      className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <div className="flex flex-col">
          <span className={`text-xs ${sortField === field && sortDirection === 'asc' ? 'text-blue-600' : 'text-slate-300'}`}>▲</span>
          <span className={`text-xs ${sortField === field && sortDirection === 'desc' ? 'text-blue-600' : 'text-slate-300'}`}>▼</span>
        </div>
      </div>
    </th>
  );

  if (billingRecords.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 border-b border-slate-200">
          <h3 className="text-lg font-medium text-slate-900">Billing Records</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-slate-500">No billing records found.</p>
          <p className="text-sm text-slate-400 mt-2">Add your first bill to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 border-b border-slate-200">
        <h3 className="text-lg font-medium text-slate-900">
          Billing Records ({billingRecords.length})
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <SortableHeader field="date">Date</SortableHeader>
              <SortableHeader field="state">State</SortableHeader>
              <SortableHeader field="bank_name">Bank Account</SortableHeader>
              <SortableHeader field="price">Amount</SortableHeader>              
              <SortableHeader field="cost_center_name">Cost Center</SortableHeader>
              <SortableHeader field="after_balance">Balance After</SortableHeader>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {sortedRecords.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50">
                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900">
                  {formatDate(record.date)}
                </td>
                <td className="px-4 py-4 text-sm text-slate-900">
                  <div className="max-w-xs truncate" title={record.state}>
                    {record.state}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900">
                  <div>
                    <div className="font-medium">{record.bank_name}</div>
                    <div className="text-slate-500 text-xs">{record.account_name}</div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                  <span className={record.state === 'Income' ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(record.price)}
                  </span>                  
                </td>                
                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {record.cost_center_name}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  <span className={record.after_balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(record.after_balance)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    {onView && (
                      <Button
                        variant="icon"
                        size="sm"
                        onClick={() => onView(record)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="icon"
                        size="sm"
                        onClick={() => onDelete(record)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Bill"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Summary Footer */}
      <div className="bg-slate-50 px-4 py-3 border-t border-slate-200">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600">
            Total Records: {billingRecords.length}
          </span>
          <div className="flex space-x-4">
            <span className="text-slate-600">
              Total Amount: 
              <span className="font-medium text-red-600 ml-1">
                {formatCurrency(billingRecords.reduce((sum, record) => sum + record.price, 0))}
              </span>
            </span>
            <span className="text-slate-600">
              Total Fees: 
              <span className="font-medium text-slate-800 ml-1">
                {formatCurrency(billingRecords.reduce((sum, record) => sum + (record.fee || 0), 0))}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingTable;