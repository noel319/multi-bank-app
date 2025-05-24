import { useState } from 'react';
import { CostCenterModal } from '../components/CostCenterModal';

export function CostCenters() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState(null);

  const handleEdit = (costCenter) => {
    setEditingCostCenter(costCenter);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cost Centers</h1>
        <button
          onClick={() => {
            setEditingCostCenter(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Cost Center
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {costCenters.map((center) => (
          <div 
            key={center.id} 
            className={`p-4 rounded-lg border ${
              center.type === 'expense' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'
            }`}
          >
            <div className="flex justify-between">
              <h3 className="font-medium">{center.name}</h3>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEdit(center)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <EditIcon className="w-5 h-5" />
                </button>
                <button className="text-red-500 hover:text-red-700">
                  <DeleteIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">{center.description}</p>
          </div>
        ))}
      </div>

      <CostCenterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        costCenter={editingCostCenter}
      />
    </div>
  );
}