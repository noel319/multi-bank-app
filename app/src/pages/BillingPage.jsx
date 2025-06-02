import React, { useState, useEffect } from 'react';
import { PlusIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useApp } from '../contexts/AppContext';
import Button from '../components/Core/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import TransactionItem from '../components/Core/TransactionItem';
import BillingTable from '../components/Table/BillingTable';
import AddBillModal from '../components/Modals/AddBillModal';
import ExportModal from '../components/Modals/ExportModal';

const BillingPage = () => {
  const { refreshData } = useApp();
  
  const [billingData, setBillingData] = useState({
    billing_records: [],
    recent_transactions: [],
    bank_options: [],
    cost_center_options: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [isAddBillModalOpen, setIsAddBillModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await window.electronAPI.callPython({
        action: 'get_billing_data'
      });

      if (response.success) {
        setBillingData(response.data);
      } else {
        setError(response.error || 'Failed to load billing data');
        console.error('Failed to load billing data:', response.error);
      }
    } catch (error) {
      const errorMessage = 'Failed to connect to backend';
      setError(errorMessage);
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBill = async (billData) => {
    try {
      setSubmitting(true);
      
      const response = await window.electronAPI.callPython({
        action: 'add_bill',
        payload: billData
      });

      if (response.success) {
        setIsAddBillModalOpen(false);
        await loadBillingData(); // Refresh billing data
        await refreshData(); // Refresh home data for updated balances
        
        await window.electronAPI.showMessageDialog({
          type: 'info',
          title: 'Success',
          message: 'Bill added successfully! Transaction created and CSV file updated.'
        });
      } else {
        await window.electronAPI.showErrorDialog({
          title: 'Error',
          content: response.error || 'Failed to add bill'
        });
      }
    } catch (error) {
      console.error('Error adding bill:', error);
      await window.electronAPI.showErrorDialog({
        title: 'Error',
        content: 'Failed to add bill'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBill = async (bill) => {
    const confirmed = await window.electronAPI.showMessageDialog({
      type: 'question',
      buttons: ['Cancel', 'Delete'],
      defaultId: 0,
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this bill?',
      detail: 'This action will also remove the associated transaction and cannot be undone.'
    });

    if (confirmed.response === 1) {
      try {
        const response = await window.electronAPI.callPython({
          action: 'delete_bill',
          payload: { bill_id: bill.id }
        });

        if (response.success) {
          await loadBillingData(); // Refresh billing data
          await refreshData(); // Refresh home data for updated balances
          
          await window.electronAPI.showMessageDialog({
            type: 'info',
            title: 'Success',
            message: 'Bill deleted successfully!'
          });
        } else {
          await window.electronAPI.showErrorDialog({
            title: 'Error',
            content: response.error || 'Failed to delete bill'
          });
        }
      } catch (error) {
        console.error('Error deleting bill:', error);
        await window.electronAPI.showErrorDialog({
          title: 'Error',
          content: 'Failed to delete bill'
        });
      }
    }
  };

  const handleExport = async (exportData) => {
    try {
      setExporting(true);
      
      const response = await window.electronAPI.callPython({
        action: 'export_billing_data',
        payload: exportData
      });

      if (response.success) {
        setIsExportModalOpen(false);
        await window.electronAPI.showMessageDialog({
          type: 'info',
          title: 'Export Successful',
          message: `Data exported successfully!\n\nFile: ${response.filename}\nRecords: ${response.record_count}\nLocation: ${response.filepath}`
        });
      } else {
        await window.electronAPI.showErrorDialog({
          title: 'Export Error',
          content: response.error || 'Failed to export data'
        });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      await window.electronAPI.showErrorDialog({
        title: 'Error',
        content: 'Failed to export data'
      });
    } finally {
      setExporting(false);
    }
  };

  const handleViewBill = (bill) => {
    // Show bill details in a message dialog
    window.electronAPI.showMessageDialog({
      type: 'info',
      title: 'Bill Details',
      message: `Bill Information`,
      detail: `Date: ${bill.date}\nDescription: ${bill.state}\nBank: ${bill.bank_name}, ${bill.account_name}\nAmount: $${bill.price.toFixed(2)}\nFee: $${(bill.fee || 0).toFixed(2)}\nCost Center: ${bill.cost_center_name}\nBalance After: $${bill.after_balance.toFixed(2)}`
    });
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Billing Management</h1>
          <p className="text-slate-500 mt-1">Manage bills and track expenses</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setIsExportModalOpen(true)}
            variant="secondary"
            size="sm"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => setIsAddBillModalOpen(true)}
            variant="primary"
            size="sm"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Bill
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <div className="mt-3">
                <Button
                  onClick={loadBillingData}
                  variant="secondary"
                  size="sm"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing Table */}
      <BillingTable
        billingRecords={billingData.billing_records}
        onDelete={handleDeleteBill}
        onView={handleViewBill}
      />

      {/* Recent Transactions */}
      <div>
        <h2 className="text-xl font-semibold text-slate-700 mb-4">Recent Transactions</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          {billingData.recent_transactions.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {billingData.recent_transactions.map(transaction => (
                <TransactionItem 
                  key={transaction.id} 
                  transaction={transaction} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-4">No recent transactions.</p>
              <p className="text-sm text-slate-400">
                Add bills or import transactions to see them here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Bill Modal */}
      <AddBillModal
        isOpen={isAddBillModalOpen}
        onClose={() => setIsAddBillModalOpen(false)}
        onSubmit={handleAddBill}
        bankOptions={billingData.bank_options}
        costCenterOptions={billingData.cost_center_options}
        isSubmitting={submitting}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        bankOptions={billingData.bank_options}
        isExporting={exporting}
      />
    </div>
  );
};

export default BillingPage;