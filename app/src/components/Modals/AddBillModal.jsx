import React, { useState, useEffect } from 'react';
import Modal from '../Core/Modal';
import Button from '../Core/Button';

const AddBillModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  bankOptions = [], 
  costCenterOptions = [],
  isSubmitting = false 
}) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Today's date
    bank_id: '',
    price: '',
    fee: '0',
    state: '',
    cost_center_id: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        date: new Date().toISOString().split('T')[0],
        bank_id: '',
        price: '',
        fee: '0',
        state: '',
        cost_center_id: ''
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.bank_id) {
      newErrors.bank_id = 'Bank selection is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Amount must be greater than 0';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'Description is required';
    }

    if (formData.fee && parseFloat(formData.fee) < 0) {
      newErrors.fee = 'Fee cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Convert string values to appropriate types
    const submitData = {
      ...formData,
      price: parseFloat(formData.price),
      fee: parseFloat(formData.fee || 0),
      bank_id: parseInt(formData.bank_id),
      cost_center_id: formData.cost_center_id ? parseInt(formData.cost_center_id) : null
    };

    onSubmit(submitData);
  };

  const handleCancel = () => {
    onClose();
  };

  const selectedBank = bankOptions.find(bank => bank.id === parseInt(formData.bank_id));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Bill">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Date *
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.date ? 'border-red-500' : 'border-slate-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.date && (
            <p className="text-red-500 text-xs mt-1">{errors.date}</p>
          )}
        </div>

        {/* Bank Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Bank Account *
          </label>
          <select
            name="bank_id"
            value={formData.bank_id}
            onChange={handleInputChange}
            className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.bank_id ? 'border-red-500' : 'border-slate-300'
            }`}
            disabled={isSubmitting}
          >
            <option value="">Select Bank Account</option>
            {bankOptions.map(bank => (
              <option key={bank.id} value={bank.id}>
                {bank.display_name}
              </option>
            ))}
          </select>
          {errors.bank_id && (
            <p className="text-red-500 text-xs mt-1">{errors.bank_id}</p>
          )}
          {selectedBank && (
            <p className="text-xs text-slate-500 mt-1">
              Current Balance: ${selectedBank.current_balance.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </p>
          )}
        </div>

        {/* Amount and Fee */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Amount *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              placeholder="0.00"
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.price ? 'border-red-500' : 'border-slate-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.price && (
              <p className="text-red-500 text-xs mt-1">{errors.price}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Fee
            </label>
            <input
              type="number"
              name="fee"
              value={formData.fee}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              placeholder="0.00"
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.fee ? 'border-red-500' : 'border-slate-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.fee && (
              <p className="text-red-500 text-xs mt-1">{errors.fee}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Income/Expense State*
          </label>          
          <select
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSubmitting}
          >
            <option value="">Select State </option>            
            <option key='1' value="Income"> Income </option>
            <option key='2' value="Expense"> Expense </option>
           
          </select>
        </div>

        {/* Cost Center */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Cost Center
          </label>
          <select
            name="cost_center_id"
            value={formData.cost_center_id}
            onChange={handleInputChange}
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSubmitting}
          >
            <option value="">Select Cost Center (Optional)</option>
            {costCenterOptions.map(costCenter => (
              <option key={costCenter.id} value={costCenter.id}>
                {costCenter.name}
                {costCenter.group_name && ` (${costCenter.group_name})`}
              </option>
            ))}
          </select>
        </div>

        {/* Total Amount Display */}
        {formData.price && (
          <div className="bg-slate-50 p-3 rounded-md">
            <div className="flex justify-between text-sm">
              <span>Amount:</span>
              <span>${parseFloat(formData.price || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Fee:</span>
              <span>${parseFloat(formData.fee || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium text-base border-t pt-2 mt-2">
              <span>Total:</span>
              <span>${(parseFloat(formData.price || 0) + parseFloat(formData.fee || 0)).toFixed(2)}</span>
            </div>
            {selectedBank && (
              <div className="flex justify-between text-sm text-slate-600 mt-1">
                <span>New Balance:</span>
                <span>
                  ${(selectedBank.current_balance - (parseFloat(formData.price || 0) + parseFloat(formData.fee || 0))).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding Bill...' : 'Add Bill'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddBillModal;