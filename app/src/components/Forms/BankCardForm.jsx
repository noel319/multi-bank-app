// src/components/Forms/BankCardForm.jsx
import React, { useState } from 'react';
import Button from '../Core/Button';
import LoadingSpinner from '../UI/LoadingSpinner';

const BankCardForm = ({ initialData, onSubmit, onCancel, isEditing, isSubmitting }) => {
  const [formData, setFormData] = useState({
    bank_name: initialData?.bank_name || '',
    account_name: initialData?.account_name || '',
    account_number: initialData?.account_number || '',
    routing_number: initialData?.routing_number || '',
    username: initialData?.username || '',
    password: initialData?.password || '',
    color: initialData?.color || 'blue',
    api_endpoint: initialData?.api_endpoint || '',
    bank_type: initialData?.bank_type || 'checking'
  });

  const [errors, setErrors] = useState({});

  const colorOptions = [
    { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
    { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
    { value: 'green', label: 'Green', class: 'bg-green-500' },
    { value: 'red', label: 'Red', class: 'bg-red-500' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
    { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
    { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
    { value: 'teal', label: 'Teal', class: 'bg-teal-500' }
  ];

  const bankTypeOptions = [
    { value: 'checking', label: 'Checking Account' },
    { value: 'savings', label: 'Savings Account' },
    { value: 'credit', label: 'Credit Card' },
    { value: 'investment', label: 'Investment Account' }
  ];

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

    if (!formData.bank_name.trim()) {
      newErrors.bank_name = 'Bank name is required';
    }

    if (!formData.account_name.trim()) {
      newErrors.account_name = 'Account name is required';
    }

    if (!formData.account_number.trim()) {
      newErrors.account_number = 'Account number is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Bank Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Bank Name *
        </label>
        <input
          type="text"
          name="bank_name"
          value={formData.bank_name}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.bank_name ? 'border-red-500' : 'border-slate-300'
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
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Account Name *
        </label>
        <input
          type="text"
          name="account_name"
          value={formData.account_name}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.account_name ? 'border-red-500' : 'border-slate-300'
          }`}
          placeholder="e.g., John Doe Checking"
          disabled={isSubmitting}
        />
        {errors.account_name && (
          <p className="text-red-500 text-xs mt-1">{errors.account_name}</p>
        )}
      </div>

      {/* Account Number and Routing Number */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Account Number *
          </label>
          <input
            type="text"
            name="account_number"
            value={formData.account_number}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.account_number ? 'border-red-500' : 'border-slate-300'
            }`}
            placeholder="1234567890"
            disabled={isSubmitting}
          />
          {errors.account_number && (
            <p className="text-red-500 text-xs mt-1">{errors.account_number}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Routing Number
          </label>
          <input
            type="text"
            name="routing_number"
            value={formData.routing_number}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="021000021"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Bank Type */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Account Type
        </label>
        <select
          name="bank_type"
          value={formData.bank_type}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          {bankTypeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Login Credentials */}
      <div className="bg-slate-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Online Banking Credentials</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Username *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.username ? 'border-red-500' : 'border-slate-300'
              }`}
              placeholder="Your banking username"
              disabled={isSubmitting}
            />
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.password ? 'border-red-500' : 'border-slate-300'
              }`}
              placeholder="Your banking password"
              disabled={isSubmitting}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            API Endpoint (Optional)
          </label>
          <input
            type="url"
            name="api_endpoint"
            value={formData.api_endpoint}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://api.bank.com/v1/"
            disabled={isSubmitting}
          />
          <p className="text-xs text-slate-500 mt-1">
            Custom API endpoint for transaction fetching
          </p>
        </div>
      </div>

      {/* Card Color */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Card Color
        </label>
        <div className="grid grid-cols-4 gap-2">
          {colorOptions.map(color => (
            <label
              key={color.value}
              className="flex items-center cursor-pointer"
            >
              <input
                type="radio"
                name="color"
                value={color.value}
                checked={formData.color === color.value}
                onChange={handleInputChange}
                className="sr-only"
                disabled={isSubmitting}
              />
              <div className={`w-8 h-8 rounded-full ${color.class} ${
                formData.color === color.value 
                  ? 'ring-2 ring-offset-2 ring-slate-400' 
                  : ''
              }`}></div>
              <span className="ml-2 text-sm text-slate-600">{color.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          onClick={onCancel}
          variant="secondary"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              {isEditing ? 'Updating...' : 'Adding...'}
            </>
          ) : (
            isEditing ? 'Update Card' : 'Add Card'
          )}
        </Button>
      </div>
    </form>
  )
};

export default BankCardForm;