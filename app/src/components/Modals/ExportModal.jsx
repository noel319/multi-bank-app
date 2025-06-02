import React, { useState } from 'react';
import Modal from '../Core/Modal';
import Button from '../Core/Button';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const ExportModal = ({ 
  isOpen, 
  onClose, 
  onExport, 
  bankOptions = [],
  isExporting = false 
}) => {
  const [exportFormat, setExportFormat] = useState('csv');
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    bank_id: ''
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExport = () => {
    const exportData = {
      format: exportFormat,
      filters: Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      )
    };
    onExport(exportData);
  };

  const handleClose = () => {
    if (!isExporting) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Export Billing Data">
      <div className="space-y-6">
        {/* Export Format Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Export Format
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="format"
                value="csv"
                checked={exportFormat === 'csv'}
                onChange={(e) => setExportFormat(e.target.value)}
                className="mr-2"
                disabled={isExporting}
              />
              <span className="text-sm">CSV (Comma Separated Values)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="format"
                value="excel"
                checked={exportFormat === 'excel'}
                onChange={(e) => setExportFormat(e.target.value)}
                className="mr-2"
                disabled={isExporting}
              />
              <span className="text-sm">Excel (.xlsx)</span>
            </label>
          </div>
        </div>

        {/* Filters */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3">
            Filters (Optional)
          </h4>
          
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                From Date
              </label>
              <input
                type="date"
                name="date_from"
                value={filters.date_from}
                onChange={handleFilterChange}
                className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isExporting}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                To Date
              </label>
              <input
                type="date"
                name="date_to"
                value={filters.date_to}
                onChange={handleFilterChange}
                className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isExporting}
              />
            </div>
          </div>

          {/* Bank Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Bank Account
            </label>
            <select
              name="bank_id"
              value={filters.bank_id}
              onChange={handleFilterChange}
              className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isExporting}
            >
              <option value="">All Banks</option>
              {bankOptions.map(bank => (
                <option key={bank.id} value={bank.id}>
                  {bank.display_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Preview Info */}
        <div className="bg-blue-50 p-3 rounded-md">
          <div className="flex items-start">
            <DocumentArrowDownIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Export Information:</p>
              <ul className="mt-1 space-y-1 text-xs">
                <li>• Format: {exportFormat.toUpperCase()}</li>
                <li>• Includes: Date, Description, Bank, Amount, Fee, Cost Center</li>
                <li>• File will be saved to auto-save folder</li>
                {filters.date_from && <li>• From: {filters.date_from}</li>}
                {filters.date_to && <li>• To: {filters.date_to}</li>}
                {filters.bank_id && <li>• Bank: {bankOptions.find(b => b.id === parseInt(filters.bank_id))?.display_name}</li>}
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </div>
            ) : (
              <div className="flex items-center">
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Export Data
              </div>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;