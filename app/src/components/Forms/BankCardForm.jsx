// src/components/Forms/BankCardForm.jsx
import React, { useState, useEffect } from 'react';
import Button from '../Core/Button';
import { DEFAULT_BANK_CARD_FORM_DATA, CARD_COLOR_OPTIONS, CARD_TYPE_OPTIONS } from '../../utils/constants';

const BankCardForm = ({ initialData, onSubmit, onCancel, isEditing = false }) => {
  const [formData, setFormData] = useState(DEFAULT_BANK_CARD_FORM_DATA);

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        bankName: initialData.bankName || '',
        last4: initialData.last4 || '',
        balance: initialData.balance?.toString() || '', // Ensure balance is string for input
        expiry: initialData.expiry || '',
        cardType: initialData.cardType || 'VISA',
        colorGradient: initialData.colorGradient || CARD_COLOR_OPTIONS[0].value,
      });
    } else {
      setFormData(DEFAULT_BANK_CARD_FORM_DATA);
    }
  }, [isEditing, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      balance: parseFloat(formData.balance) || 0, // Convert balance back to number
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="bankName" className="block text-sm font-medium text-slate-700">Bank Name</label>
        <input type="text" name="bankName" id="bankName" value={formData.bankName} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue-light focus:border-brand-blue-light sm:text-sm" />
      </div>
      <div>
        <label htmlFor="last4" className="block text-sm font-medium text-slate-700">Last 4 Digits</label>
        <input type="text" name="last4" id="last4" value={formData.last4} onChange={handleChange} required pattern="\d{4}" title="Enter 4 digits" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue-light focus:border-brand-blue-light sm:text-sm" />
      </div>
      <div>
        <label htmlFor="balance" className="block text-sm font-medium text-slate-700">{isEditing ? "Current Balance" : "Initial Balance"}</label>
        <input type="number" name="balance" id="balance" value={formData.balance} onChange={handleChange} required step="0.01" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue-light focus:border-brand-blue-light sm:text-sm" 
        readOnly={isEditing} // Balance usually updated via transactions, not directly edited here after creation
        />
      </div>
      <div>
        <label htmlFor="expiry" className="block text-sm font-medium text-slate-700">Expiry (MM/YY)</label>
        <input type="text" name="expiry" id="expiry" value={formData.expiry} onChange={handleChange} required pattern="\d{2}/\d{2}" title="MM/YY format" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue-light focus:border-brand-blue-light sm:text-sm" />
      </div>
      <div>
        <label htmlFor="cardType" className="block text-sm font-medium text-slate-700">Card Type</label>
        <select name="cardType" id="cardType" value={formData.cardType} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue-light focus:border-brand-blue-light sm:text-sm">
          {CARD_TYPE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="colorGradient" className="block text-sm font-medium text-slate-700">Card Color</label>
        <select name="colorGradient" id="colorGradient" value={formData.colorGradient} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue-light focus:border-brand-blue-light sm:text-sm">
          {CARD_COLOR_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary">{isEditing ? "Save Changes" : "Add Card"}</Button>
      </div>
    </form>
  );
};

export default BankCardForm;