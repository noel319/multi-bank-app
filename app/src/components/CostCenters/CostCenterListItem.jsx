import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const CostCenterListItem = ({ costCenter, onEdit, onDelete }) => {
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this cost center?')) {
      onDelete();
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit();
  };

  return (
    <li className="hover:bg-gray-50 transition-colors duration-150">
      <div className="flex items-center px-4 py-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-2">
              <span className="text-blue-800 font-medium">{costCenter.cost_center}</span>
            </div>
            <div className="ml-4">
              <div className="font-medium text-gray-900">{costCenter.group}</div>
              <div className="text-sm text-gray-500">
                Area: {costCenter.area} {costCenter.state && `(${costCenter.state})`}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-150"
          >
            <PencilIcon className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-150"
          >
            <TrashIcon className="h-5 w-5 text-red-600" />
          </button>
        </div>
      </div>
    </li>
  );
};

export default CostCenterListItem;