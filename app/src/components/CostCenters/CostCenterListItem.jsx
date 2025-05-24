// src/components/CostCenters/CostCenterListItem.jsx
import React from 'react';
import Button from '../Core/Button';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import { COST_CENTER_TYPES } from '../../utils/constants';

const CostCenterListItem = ({ costCenter, onEdit, onDelete }) => {
  const typeLabel = COST_CENTER_TYPES.find(cct => cct.value === costCenter.type)?.label || costCenter.type;
  return (
    <li className="py-3 flex justify-between items-center">
      <div>
        <span className="font-medium text-slate-700">{costCenter.name}</span>
        <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${costCenter.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {typeLabel}
        </span>
      </div>
      <div className="space-x-2">
        <Button variant="icon" size="sm" onClick={() => onEdit(costCenter)}>
          <PencilIcon className="h-5 w-5 text-slate-500 hover:text-brand-blue-dark" />
        </Button>
        <Button variant="icon" size="sm" onClick={() => onDelete(costCenter.id)}>
          <TrashIcon className="h-5 w-5 text-slate-500 hover:text-red-500" />
        </Button>
      </div>
    </li>
  );
};

export default CostCenterListItem;