import React, { useState, useEffect } from 'react';
import Button from '../Core/Button';
import LoadingSpinner from '../UI/LoadingSpinner';

const CostCenterForm = ({ initialData, onSubmit, onCancel, isEditing = false, isSubmitting = false }) => {
  const [formData, setFormData] = useState(initialData);
  const [groupOptions, setGroupOptions] = useState([]);
  const [areaOptions, setAreaOptions] = useState([]);
  const [costCenterOptions, setCostCenterOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    // Fetch available options from backend
    const fetchOptions = async () => {
      try {
        setLoading(true);
        const response = await window.electronAPI.callPython({
          action: 'get_cost_center_options'
        });

        if (response.success) {
          setGroupOptions(response.groups || []);
          setAreaOptions(response.areas || []);
          setCostCenterOptions(response.cost_centers || []);
        } else {
          console.error('Failed to fetch cost center options:', response.error);
        }
      } catch (err) {
        console.error('Failed to fetch cost center options:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.group.trim()) {
      errors.group = 'Group is required';
    }
    
    if (!formData.cost_center.trim()) {
      errors.cost_center = 'Cost center code is required';
    }
    
    if (!formData.area.trim()) {
      errors.area = 'Area is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {loading ? (
        <div className="text-center py-8">
          <LoadingSpinner />
          <p className="mt-3 text-sm text-gray-600">Loading options...</p>
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">
              Group
            </label>
            <div className="relative">
              <input
                list="group-options"
                type="text"
                name="group"
                id="group"
                className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border ${
                  validationErrors.group ? 'border-red-300' : 'border-gray-300'
                } rounded-md p-2`}
                value={formData.group}
                onChange={handleChange}
                placeholder="Department or main category"
                disabled={isSubmitting}
                required
              />
              <datalist id="group-options">
                {groupOptions.map((option, index) => (
                  <option key={index} value={option} />
                ))}
              </datalist>
            </div>
            {validationErrors.group && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.group}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Select an existing group or create a new one
            </p>
          </div>

          <div>
            <label htmlFor="cost_center" className="block text-sm font-medium text-gray-700 mb-1">
              Cost Center Code
            </label>
            <div className="relative">
              <input
                list="cost-center-options"
                type="text"
                name="cost_center"
                id="cost_center"
                className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border ${
                  validationErrors.cost_center ? 'border-red-300' : 'border-gray-300'
                } rounded-md p-2`}
                value={formData.cost_center}
                onChange={handleChange}
                placeholder="Code or identifier"
                disabled={isSubmitting}
                required
              />
              <datalist id="cost-center-options">
                {costCenterOptions.map((option, index) => (
                  <option key={index} value={option} />
                ))}
              </datalist>
            </div>
            {validationErrors.cost_center && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.cost_center}</p>
            )}
          </div>

          <div>
            <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
              Area
            </label>
            <div className="relative">
              <input
                list="area-options"
                type="text"
                name="area"
                id="area"
                className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border ${
                  validationErrors.area ? 'border-red-300' : 'border-gray-300'
                } rounded-md p-2`}
                value={formData.area}
                onChange={handleChange}
                placeholder="Business area or division"
                disabled={isSubmitting}
                required
              />
              <datalist id="area-options">
                {areaOptions.map((option, index) => (
                  <option key={index} value={option} />
                ))}
              </datalist>
            </div>
            {validationErrors.area && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.area}</p>
            )}
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
              State (Optional)
            </label>
            <input
              type="text"
              name="state"
              id="state"
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
              value={formData.state || ''}
              onChange={handleChange}
              placeholder="Geographic state or region if applicable"
              disabled={isSubmitting}
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
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
                  <span className="inline-block mr-2">
                    <LoadingSpinner size="sm" />
                  </span>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Cost Center' : 'Create Cost Center'
              )}
            </Button>
          </div>
        </>
      )}
    </form>
  );
};

export default CostCenterForm;