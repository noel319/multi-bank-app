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
    state: '',
    group_name: '',
    cost_center: '',
    area: ''
  });

  const [errors, setErrors] = useState({});

  // Get unique group names
  const groupNames = [...new Set(costCenterOptions.map(option => option.group_name).filter(Boolean))];
  
  // Get unique cost centers for selected group - FIXED: Use consistent property name
  const costCentersForGroup = [...new Set(
    costCenterOptions
      .filter(option => option.group_name === formData.group_name)
      .map(option => option.cost_center) // FIXED: Changed from option.cost_cent to option.cost_center
      .filter(Boolean)
  )];
  
  // Get unique areas for selected group and cost center
  const areasForCostCenter = [...new Set(
    costCenterOptions
      .filter(option => 
        option.group_name === formData.group_name && 
        option.cost_center === formData.cost_center
      )
      .map(option => option.area)
      .filter(Boolean)
  )];


  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        date: new Date().toISOString().split('T')[0],
        bank_id: '',
        price: '',
        state: '',
        group_name: '',
        cost_center: '',
        area: ''
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle cascading selections
    if (name === 'group_name') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        cost_center: '', // Reset dependent fields
        area: ''
      }));
    } else if (name === 'cost_center') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        area: '' // Reset dependent field
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
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
      newErrors.state = 'Income/Expense state is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to find cost_center_id based on selected group_name, cost_center, and area
  const findCostCenterId = () => {
    if (!formData.group_name || !formData.cost_center || !formData.area) {
      return null;
    }

    const matchingCostCenter = costCenterOptions.find(option => 
      option.group_name === formData.group_name &&
      option.cost_center === formData.cost_center &&
      option.area === formData.area
    );

    return matchingCostCenter ? matchingCostCenter.id : null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Find the cost_center_id based on selected options
    const costCenterId = findCostCenterId();

    // Convert string values to appropriate types and prepare submit data
    const submitData = {
      ...formData,
      date: formData.date,
      bank_id: parseInt(formData.bank_id),
      price: parseFloat(formData.price),
      state: formData.state,
      cost_center_id: costCenterId
    };

    console.log('Submit data:', submitData); // Debug log to verify the data being sent

    onSubmit(submitData);
  };

  const handleCancel = () => {
    onClose();
  };

  const selectedBank = bankOptions.find(bank => bank.id === parseInt(formData.bank_id));

  // Format number in Chilean format
  const formatChileanNumber = (number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number);
  };

  // Calculate new balance based on transaction type
  const calculateNewBalance = () => {
    if (!selectedBank || !formData.price) return null;
    
    const amount = parseFloat(formData.price);
    const currentBalance = selectedBank.current_balance;
    
    if (formData.state === 'Income') {
      return currentBalance + amount;
    } else if (formData.state === 'Expense') {
      return currentBalance - amount;
    }
    return currentBalance;
  };

  const newBalance = calculateNewBalance();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Bill" maxWidth="max-w-7xl">
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-6">
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

          {/* Amount */}
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
              Current Balance: {formatChileanNumber(selectedBank.current_balance)}
            </p>
          )}
        </div>

        {/* Income/Expense State */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Transaction Type *
          </label>          
          <select
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.state ? 'border-red-500' : 'border-slate-300'
            }`}
            disabled={isSubmitting}
          >
            <option value="">Select Transaction Type</option>            
            <option value="Income">Ingreso (Income)</option>
            <option value="Expense">Salida (Expense)</option>
          </select>
          {errors.state && (
            <p className="text-red-500 text-xs mt-1">{errors.state}</p>
          )}
        </div>

        {/* Cost Center Selection - Unified label with three cascading dropdowns */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Select Cost Center
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Group Name */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Group Name
              </label>
              <select
                name="group_name"
                value={formData.group_name}
                onChange={handleInputChange}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              >
                <option value="">Select Group</option>
                {groupNames.map(groupName => (
                  <option key={groupName} value={groupName}>
                    {groupName}
                  </option>
                ))}
              </select>
            </div>

            {/* Cost Center */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Cost Center
              </label>
              <select
                name="cost_center"
                value={formData.cost_center}
                onChange={handleInputChange}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting || !formData.group_name}
              >
                <option value="">Select Cost Center</option>
                {costCentersForGroup.map(costCenter => (
                  <option key={costCenter} value={costCenter}>
                    {costCenter}
                  </option>
                ))}
              </select>
            </div>

            {/* Area */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Area
              </label>
              <select
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting || !formData.cost_center}
              >
                <option value="">Select Area</option>
                {areasForCostCenter.map(area => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Display selected cost center info */}
          {formData.group_name && formData.cost_center && formData.area && (
            <div className="mt-2 p-2 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-700">
                Selected: {formData.group_name} → {formData.cost_center} → {formData.area}
                {findCostCenterId() && ` (ID: ${findCostCenterId()})`}
              </p>
            </div>
          )}
        </div>

        {/* Transaction Summary Display */}
        {formData.price && selectedBank && formData.state && (
          <div className="bg-slate-50 p-4 rounded-md border">
            <h4 className="font-medium text-slate-700 mb-3">Transaction Summary</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Transaction Amount:</span>
                <span className={`font-medium ${formData.state === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                  {formData.state === 'Income' ? '+' : '-'}{formatChileanNumber(parseFloat(formData.price))}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>Current Balance:</span>
                <span>{formatChileanNumber(selectedBank.current_balance)}</span>
              </div>
              
              <hr className="my-2" />
              
              <div className="flex justify-between font-medium text-base">
                <span>New Balance:</span>
                <span className={newBalance < 0 ? 'text-red-600' : 'text-slate-700'}>
                  {formatChileanNumber(newBalance)}
                </span>
              </div>
            </div>

            <div className="mt-3 p-3 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-700">
                <strong>Transaction Description:</strong> This {formData.state === 'Income' ? 'income' : 'expense'} transaction will {formData.state === 'Income' ? 'increase' : 'decrease'} your account balance by {formatChileanNumber(parseFloat(formData.price))}.
                {newBalance < 0 && ' ⚠️ Warning: This transaction will result in a negative balance.'}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
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