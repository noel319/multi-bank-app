// src/components/Forms/CostCenterForm.jsx
import React, { useState, useEffect } from 'react';
import Button from '../Core/Button';
import { DEFAULT_COST_CENTER_FORM_DATA, COST_CENTER_TYPES } from '../../utils/constants';

const CostCenterForm = ({ initialData, onSubmit, onCancel, isEditing = false }) => {
  const [formData, setFormData] = useState(DEFAULT_COST_CENTER_FORM_DATA);

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        name: initialData.name || '',
        type: initialData.type || COST_CENTER_TYPES[0].value,
      });
    } else {
      setFormData(DEFAULT_COST_CENTER_FORM_DATA);
    }
  }, [isEditing, initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Cost center name cannot be empty.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">Name</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue-light focus:border-brand-blue-light sm:text-sm" />
      </div>
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-slate-700">Type</label>
        <select name="type" id="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue-light focus:border-brand-blue-light sm:text-sm">
          {COST_CENTER_TYPES.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary">{isEditing ? 'Save Changes' : 'Add Cost Center'}</Button>
      </div>
    </form>
  );
};

export default CostCenterForm;