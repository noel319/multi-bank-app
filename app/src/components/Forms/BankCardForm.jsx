import React, { useState, useEffect } from 'react';
import Button from '../Core/Button';

const CARD_COLORS = [
  { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
  { name: 'Green', value: 'green', class: 'bg-green-500' },
  { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
  { name: 'Red', value: 'red', class: 'bg-red-500' },
  { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
  { name: 'Teal', value: 'teal', class: 'bg-teal-500' },
  { name: 'Indigo', value: 'indigo', class: 'bg-indigo-500' },
  { name: 'Pink', value: 'pink', class: 'bg-pink-500' }
];

const BankCardForm = ({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isEditing = false, 
  isSubmitting = false 
}) => {
  const [formData, setFormData] = useState({
    bank_name: '',
    account: '',
    current_balance: '',
    endpoint: '',
    color: 'blue',
    role: 'checking'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        bank_name: initialData.bank_name || '',
        account: initialData.account || '',
        current_balance: initialData.current_balance?.toString() || '',
        endpoint: initialData.endpoint || '',
        color: initialData.color || 'blue',
        role: initialData.role || 'checking'
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.bank_name.trim()) {
      newErrors.bank_name = 'Bank name is required';
    }

    if (!formData.account.trim()) {
      newErrors.account = 'Account name is required';
    }

    if (!formData.current_balance.trim()) {
      newErrors.current_balance = 'Balance is required';
    } else if (isNaN(parseFloat(formData.current_balance))) {
      newErrors.current_balance = 'Balance must be a valid number';
    }

    if (formData.endpoint && !isValidUrl(formData.endpoint)) {
      newErrors.endpoint = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      current_balance: parseFloat(formData.current_balance)
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Bank Name */}
      <div>
        <label htmlFor="bank_name" className="block text-sm font-medium text-slate-700 mb-1">
          Bank Name *
        </label>
        <input
          type="text"
          id="bank_name"
          name="bank_name"
          value={formData.bank_name}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.bank_name ? 'border-red-300' : 'border-slate-300'
          }`}
          placeholder="e.g., Chase Bank"
          disabled={isSubmitting}
        />
        {errors.bank_name && (
          <p className="text-red-500 text-xs mt-1">{errors.bank_name}</p>
        )}
      </div>

      {/* Account Name */}
      <div>
        <label htmlFor="account" className="block text-sm font-medium text-slate-700 mb-1">
          Account Name *
        </label>
        <input
          type="text"
          id="account"
          name="account"
          value={formData.account}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.account ? 'border-red-300' : 'border-slate-300'
          }`}
          placeholder="e.g., Main Checking"
          disabled={isSubmitting}
        />
        {errors.account && (
          <p className="text-red-500 text-xs mt-1">{errors.account}</p>
        )}
      </div>

      {/* Current Balance */}
      <div>
        <label htmlFor="current_balance" className="block text-sm font-medium text-slate-700 mb-1">
          Current Balance *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-slate-500">$</span>
          <input
            type="number"
            id="current_balance"
            name="current_balance"
            value={formData.current_balance}
            onChange={handleInputChange}
            step="0.01"
            className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.current_balance ? 'border-red-300' : 'border-slate-300'
            }`}
            placeholder="0.00"
            disabled={isSubmitting}
          />
        </div>
        {errors.current_balance && (
          <p className="text-red-500 text-xs mt-1">{errors.current_balance}</p>
        )}
      </div>

      {/* Account Role */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">
          Account Type
        </label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          <option value="checking">Checking Account</option>
          <option value="savings">Savings Account</option>
          <option value="business">Business Account</option>
          <option value="credit">Credit Card</option>
          <option value="investment">Investment Account</option>
        </select>
      </div>

      {/* API Endpoint (Optional) */}
      <div>
        <label htmlFor="endpoint" className="block text-sm font-medium text-slate-700 mb-1">
          API Endpoint (Optional)
        </label>
        <input
          type="url"
          id="endpoint"
          name="endpoint"
          value={formData.endpoint}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.endpoint ? 'border-red-300' : 'border-slate-300'
          }`}
          placeholder="https://api.example.com/account"
          disabled={isSubmitting}
        />
        {errors.endpoint && (
          <p className="text-red-500 text-xs mt-1">{errors.endpoint}</p>
        )}
        <p className="text-xs text-slate-500 mt-1">
          Connect to your bank's API for automatic balance updates
        </p>
      </div>

      {/* Color Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Card Color
        </label>
        <div className="grid grid-cols-4 gap-2">
          {CARD_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => handleInputChange({ target: { name: 'color', value: color.value } })}
              className={`p-3 rounded-md ${color.class} relative transition-all ${
                formData.color === color.value 
                  ? 'ring-2 ring-slate-800 ring-offset-2' 
                  : 'hover:scale-105'
              }`}
              disabled={isSubmitting}
              title={color.name}
            >
              {formData.color === color.value && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Saving...' : (isEditing ? 'Update Card' : 'Add Card')}
        </Button>
      </div>
    </form>
  );
};

export default BankCardForm;