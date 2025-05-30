import React, { useState, useEffect } from 'react';
import { PlusIcon, ArrowUpTrayIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BankCard from '../components/Core/BankCard';
import PersonalAccountCard from '../components/UI/PersonalAccountCard';
import TotalBalanceCard from '../components/UI/TotalBalanceCard';
import TransactionItem from '../components/Core/TransactionItem';
import Modal from '../components/Core/Modal';
import Button from '../components/Core/Button';
import BankCardForm from '../components/Forms/BankCardForm';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { DEFAULT_BANK_CARD_FORM_DATA } from '../utils/constants';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [homeData, setHomeData] = useState({
    banks: [],
    totalBalance: 0,
    personalBalance: 0,
    recentTransactions: [],
    userProfile: null
  });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // Load home data on component mount
  useEffect(() => {
    if (user) {
      loadHomeData();
    }
  }, [user]);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const response = await window.electronAPI.callPython({
        action: 'get_home_data'
      });

      if (response.success) {
        setHomeData(response.data);
      } else {
        console.error('Failed to load home data:', response.error);
        await window.electronAPI.showErrorDialog({
          title: 'Error',
          content: response.error || 'Failed to load home data'
        });
      }
    } catch (error) {
      console.error('Error loading home data:', error);
      await window.electronAPI.showErrorDialog({
        title: 'Error',
        content: 'Failed to connect to backend'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCardClick = () => {
    setEditingBank(null);
    setIsModalOpen(true);
  };

  const handleEditCardClick = (bank) => {
    setEditingBank(bank);
    setIsModalOpen(true);
  };

  const handleDeleteCard = async (bankId) => {
    const confirmed = await window.electronAPI.showMessageDialog({
      type: 'question',
      buttons: ['Cancel', 'Delete'],
      defaultId: 0,
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this bank card?',
      detail: 'This action cannot be undone and will also delete all associated transactions.'
    });

    if (confirmed.response === 1) {
      try {
        const response = await window.electronAPI.callPython({
          action: 'delete_bank',
          payload: { bank_id: bankId }
        });

        if (response.success) {
          await loadHomeData(); // Refresh data
          await window.electronAPI.showMessageDialog({
            type: 'info',
            title: 'Success',
            message: 'Bank card deleted successfully!'
          });
        } else {
          await window.electronAPI.showErrorDialog({
            title: 'Error',
            content: response.error || 'Failed to delete bank card'
          });
        }
      } catch (error) {
        console.error('Error deleting bank:', error);
        await window.electronAPI.showErrorDialog({
          title: 'Error',
          content: 'Failed to delete bank card'
        });
      }
    }
  };

  const handleCardClick = (bank) => {
    navigate(`/bank-details/${bank.id}`);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingBank(null);
  };

  const handleFormSubmit = async (bankData) => {
    try {
      setSubmitting(true);
      const action = editingBank ? 'update_bank' : 'add_bank';
      const payload = editingBank 
        ? { ...bankData, bank_id: editingBank.id }
        : bankData;

      const response = await window.electronAPI.callPython({
        action,
        payload
      });

      if (response.success) {
        handleModalClose();
        await loadHomeData(); // Refresh data
        await window.electronAPI.showMessageDialog({
          type: 'info',
          title: 'Success',
          message: editingBank 
            ? 'Bank card updated successfully!' 
            : 'Bank card added successfully!'
        });
      } else {
        await window.electronAPI.showErrorDialog({
          title: 'Error',
          content: response.error || 'Failed to save bank card'
        });
      }
    } catch (error) {
      console.error('Error saving bank:', error);
      await window.electronAPI.showErrorDialog({
        title: 'Error',
        content: 'Failed to save bank card'
      });
    } finally {
      setSubmitting(false);
    }
  };  

  const handleSyncGoogleSheets = async () => {
    try {
      if (!user.google_token) {
        await window.electronAPI.showMessageDialog({
          type: 'info',
          title: 'Google Sheets Not Connected',
          message: 'Please log in with Google to sync with Google Sheets.'
        });
        return;
      }

      const response = await window.electronAPI.callPython({
        action: 'sync_google_sheets'
      });

      if (response.success) {
        await loadHomeData(); // Refresh data
        await window.electronAPI.showMessageDialog({
          type: 'info',
          title: 'Success',
          message: 'Google Sheets synchronized successfully!'
        });
      } else {
        await window.electronAPI.showErrorDialog({
          title: 'Sync Error',
          content: response.error || 'Failed to sync with Google Sheets'
        });
      }
    } catch (error) {
      console.error('Error syncing Google Sheets:', error);
      await window.electronAPI.showErrorDialog({
        title: 'Error',
        content: 'Failed to sync with Google Sheets'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">BANK INFORMATION</h1>
          <p className="text-slate-500">Welcome back, {homeData.userProfile?.name || user?.name || 'User'}!</p>
        </div>
        <div className="flex items-center gap-3">
                  
          {user?.google_token && (
            <Button 
              onClick={handleSyncGoogleSheets} 
              variant="secondary" 
              size="sm"
            >
              Sync Sheets
            </Button>
          )}
          
          {homeData.userProfile?.avatar && (
            <img 
              src={homeData.userProfile.avatar} 
              alt="User" 
              className="h-10 w-10 rounded-full" 
            />
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side - Bank Cards */}
        <div className="lg:w-3/5 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-700">Your Bank Cards</h2>
            <Button onClick={handleAddCardClick} variant="primary" size="sm">
              <PlusIcon className="h-5 w-5 mr-1 inline" /> Add Card
            </Button>
          </div>
          
          {homeData.banks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {homeData.banks.map(bank => (
                <BankCard
                  key={bank.id}
                  bank={bank}
                  onClick={() => handleCardClick(bank)}
                  onEdit={handleEditCardClick}
                  onDelete={handleDeleteCard}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-lg shadow">
              <p className="text-slate-500 mb-4">No bank cards added yet.</p>
              <Button onClick={handleAddCardClick} variant="primary">
                <PlusIcon className="h-5 w-5 mr-2 inline" /> Add Your First Card
              </Button>
            </div>
          )}
        </div>

        {/* Right Side - Balance and Transactions */}
        <div className="lg:w-2/5 space-y-6">
          {/* Balance Cards */}
          <div className="grid grid-cols-1 gap-4">
            <TotalBalanceCard totalBalance={homeData.totalBalance} />
            <PersonalAccountCard personalBalance={homeData.personalBalance} />
          </div>

          {/* Recent Transactions */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-slate-700">Recent Transactions</h2>
              <button
                onClick={() => navigate('/transactions')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All
              </button>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              {homeData.recentTransactions.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {homeData.recentTransactions.map(transaction => (
                    <TransactionItem key={transaction.id} transaction={transaction} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500 mb-4">No recent transactions.</p>
                  <p className="text-sm text-slate-400">
                    Import Excel file or sync with Google Sheets to see transactions
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Bank Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
        title={editingBank ? "Edit Bank Card" : "Add New Bank Card"}
      >
        <BankCardForm
          initialData={editingBank || DEFAULT_BANK_CARD_FORM_DATA}
          onSubmit={handleFormSubmit}
          onCancel={handleModalClose}
          isEditing={!!editingBank}
          isSubmitting={submitting}
        />
      </Modal>
    </div>
  );
};

export default HomePage;