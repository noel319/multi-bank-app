import React, { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Core/Modal';
import Button from '../components/Core/Button';
import CostCenterForm from '../components/Forms/CostCenterForm';
import CostCenterListItem from '../components/CostCenters/CostCenterListItem';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { DEFAULT_COST_CENTER_FORM_DATA } from '../utils/constants';

const CostCentersPage = () => {
  const { user } = useAuth();
  const [costCenters, setCostCenters] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCc, setEditingCc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadCostCenters();
    }
  }, [user]);

  const loadCostCenters = async () => {
    try {
      setLoading(true);
      const response = await window.electronAPI.callPython({
        action: 'get_cost_centers_list'
      });

      if (response.success) {
        setCostCenters(response.cost_centers || []);
      } else {
        console.error('Failed to load cost centers:', response.error);
        setError(response.error || 'Failed to load cost centers');
        await window.electronAPI.showErrorDialog({
          title: 'Error',
          content: response.error || 'Failed to load cost centers'
        });
      }
    } catch (error) {
      console.error('Error loading cost centers:', error);
      setError('Failed to connect to backend');
      await window.electronAPI.showErrorDialog({
        title: 'Error',
        content: 'Failed to connect to backend'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cc = null) => {
    setEditingCc(cc);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCc(null);
  };

  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true);
      if (editingCc) {
        const response = await window.electronAPI.callPython({
          action: 'update_cost_center',
          payload: {
            id: editingCc.id,
            group: formData.group,
            cost_center: formData.cost_center,
            area: formData.area,
            state: formData.state
          }
        });

        if (response.success) {
          handleCloseModal();
          await loadCostCenters(); // Refresh data
          await window.electronAPI.showMessageDialog({
            type: 'info',
            title: 'Success',
            message: 'Cost center updated successfully!'
          });
        } else {
          setError(response.error || 'Failed to update cost center');
          await window.electronAPI.showErrorDialog({
            title: 'Error',
            content: response.error || 'Failed to update cost center'
          });
        }
      } else {
        const response = await window.electronAPI.callPython({
          action: 'add_cost_center',
          payload: {
            group: formData.group,
            cost_center: formData.cost_center,
            area: formData.area,
            state: formData.state
          }
        });

        if (response.success) {
          handleCloseModal();
          await loadCostCenters(); // Refresh data
          await window.electronAPI.showMessageDialog({
            type: 'info',
            title: 'Success',
            message: 'Cost center added successfully!'
          });
        } else {
          setError(response.error || 'Failed to add cost center');
          await window.electronAPI.showErrorDialog({
            title: 'Error',
            content: response.error || 'Failed to add cost center'
          });
        }
      }
    } catch (err) {
      console.error('Error saving cost center:', err);
      setError('Failed to save cost center');
      await window.electronAPI.showErrorDialog({
        title: 'Error',
        content: 'Failed to save cost center'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (ccId) => {
    try {
      const confirmed = await window.electronAPI.showMessageDialog({
        type: 'question',
        buttons: ['Cancel', 'Delete'],
        defaultId: 0,
        title: 'Confirm Delete',
        message: 'Are you sure you want to delete this cost center?',
        detail: 'This action cannot be undone and may affect transactions using this cost center.'
      });

      if (confirmed.response === 1) {
        const response = await window.electronAPI.callPython({
          action: 'delete_cost_center',
          payload: { cost_center_id: ccId }
        });

        if (response.success) {
          await loadCostCenters(); // Refresh data
          await window.electronAPI.showMessageDialog({
            type: 'info',
            title: 'Success',
            message: 'Cost center deleted successfully!'
          });
        } else {
          setError(response.error || 'Failed to delete cost center');
          await window.electronAPI.showErrorDialog({
            title: 'Error',
            content: response.error || 'Failed to delete cost center'
          });
        }
      }
    } catch (err) {
      console.error('Error deleting cost center:', err);
      setError('Failed to delete cost center');
      await window.electronAPI.showErrorDialog({
        title: 'Error',
        content: 'Failed to delete cost center'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">COST CENTERS</h1>
          <p className="text-slate-500">Manage your financial categories and departments</p>
        </div>
        <Button onClick={() => handleOpenModal()} variant="primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Cost Center
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          {costCenters.length > 0 ? (
            <div className="overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {costCenters.map(cc => (
                  <CostCenterListItem 
                    key={cc.id} 
                    costCenter={cc} 
                    onEdit={() => handleOpenModal(cc)} 
                    onDelete={() => handleDelete(cc.id)} 
                  />
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="p-6 rounded-full bg-blue-50 inline-flex mx-auto mb-4">
                <PlusIcon className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No cost centers defined yet</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Cost centers help you categorize and organize your expenses by department, project, or area.
              </p>
              <Button 
                onClick={() => handleOpenModal()} 
                variant="primary"
              >
                Add Your First Cost Center
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Cost Center Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCc ? "Edit Cost Center" : "Add New Cost Center"}
      >
        <CostCenterForm
          initialData={editingCc || DEFAULT_COST_CENTER_FORM_DATA}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isEditing={!!editingCc}
          isSubmitting={submitting}
        />
      </Modal>
    </div>
  );
};

export default CostCentersPage;