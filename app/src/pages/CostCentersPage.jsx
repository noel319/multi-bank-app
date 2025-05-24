// src/pages/CostCentersPage.jsx
import React, { useState } from 'react';
import { useMockData } from '../contexts/MockDataContext';
import Modal from '../components/Core/Modal';
import Button from '../components/Core/Button';
import { PlusIcon } from '@heroicons/react/24/solid';
import CostCenterForm from '../components/Forms/CostCenterForm'; // <-- IMPORT
import CostCenterListItem from '../components/CostCenters/CostCenterListItem'; // <-- IMPORT
import { DEFAULT_COST_CENTER_FORM_DATA } from '../../utils/constants'; // <-- IMPORT

const CostCentersPage = () => {
  const { costCenters, addCostCenter, editCostCenter, deleteCostCenter } = useMockData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCc, setEditingCc] = useState(null);

  const handleOpenModal = (cc = null) => {
    setEditingCc(cc);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCc(null);
  };

  const handleSubmit = (formData) => {
    if (editingCc) {
      editCostCenter({ ...editingCc, ...formData });
    } else {
      addCostCenter(formData);
    }
    handleCloseModal();
  };

  const handleDelete = (ccId) => {
    deleteCostCenter(ccId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Cost Centers</h1>
        <Button onClick={() => handleOpenModal()} variant="primary">
          <PlusIcon className="h-5 w-5 mr-1 inline" /> Add Cost Center
        </Button>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-lg shadow">
        {costCenters.length > 0 ? (
          <ul className="divide-y divide-slate-200">
            {costCenters.map(cc => ( // <-- USING .map() with new component
              <CostCenterListItem
                key={cc.id}
                costCenter={cc}
                onEdit={handleOpenModal}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 text-center py-6">No cost centers defined yet.</p>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCc ? 'Edit Cost Center' : 'Add New Cost Center'}>
        <CostCenterForm
          initialData={editingCc || DEFAULT_COST_CENTER_FORM_DATA}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isEditing={!!editingCc}
        />
      </Modal>
    </div>
  );
};

export default CostCentersPage;