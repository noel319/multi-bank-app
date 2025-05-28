// src/components/Core/FilterGroup.jsx
import React from 'react';
import Button from './Button';
import { DATE_FILTER_OPTIONS, TRANSACTION_TYPE_FILTER_OPTIONS } from '../../utils/constants';
import { useMockData } from '../../contexts/MockDataContext'; // To get cost centers for filter

const FilterGroup = ({ onFilterChange, availableCostCenters = [] }) => {
    const { costCenters } = useMockData(); // Or pass as prop

    const handleChange = (filterType, value) => {
      if(onFilterChange) onFilterChange(filterType, value);
    };
  
    return (
      <div className="my-4 p-4 bg-white rounded-lg shadow flex flex-wrap gap-4 items-center">
        <select 
            onChange={(e) => handleChange('date', e.target.value)} 
            className="p-2 border border-slate-300 rounded-md text-sm focus:ring-brand-blue-light focus:border-brand-blue-light"
            defaultValue="all"
        >
          {DATE_FILTER_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select 
            onChange={(e) => handleChange('type', e.target.value)} 
            className="p-2 border border-slate-300 rounded-md text-sm focus:ring-brand-blue-light focus:border-brand-blue-light"
            defaultValue="all"
        >
          {TRANSACTION_TYPE_FILTER_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select 
            onChange={(e) => handleChange('costCenter', e.target.value)} 
            className="p-2 border border-slate-300 rounded-md text-sm focus:ring-brand-blue-light focus:border-brand-blue-light"
            defaultValue="all"
        >
          <option value="all">All Cost Centers</option>
          {costCenters.map(cc => ( // Assuming costCenters is an array of {id, name}
            <option key={cc.id} value={cc.id}>{cc.name}</option>
          ))}
        </select>
        <Button onClick={() => handleChange('reset', null)} variant="secondary" size="sm">Reset Filters</Button>
      </div>
    );
  };

export default FilterGroup;