import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
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
  const { 
    homeData, 
    loading, 
    error, 
    addBank, 
    updateBank, 
    deleteBank, 
    syncGoogleSheets,
    hasGoogleToken,
    hasBanks,
    hasTransactions 
  } = useApp();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleAddCardClick = () => {
    setEditingBank(null);
    setIsModalOpen(true);
  };

  const handleEditCardClick = (bank) => {
    setEditingBank(bank);
    setIsModalOpen(true);
  };

  const handleDeleteCard = async (bankId) => {
    const result = await deleteBank(bankId);
    // Error handling is managed in the context
    return result;
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
      
      let result;
      if (editingBank) {
        result = await updateBank(bankData, editingBank.id);
      } else {
        result = await addBank(bankData);
      }

      if (result.success) {
        handleModalClose();
      }
      // Error handling is managed in the context
    } catch (error) {
      console.error('Error in form submission:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncGoogleSheets = async () => {
    await syncGoogleSheets();
    // Error handling is managed in the context
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
          <p className="text-slate-500">
            Welcome back, {homeData.userProfile?.name || user?.name || 'User'}!
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasGoogleToken && (
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

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side - Bank Cards */}
        <div className="lg:w-3/5 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-700">Your Bank Cards</h2>
            <Button onClick={handleAddCardClick} variant="primary" size="sm">
              <PlusIcon className="h-5 w-5 mr-1 inline" /> Add Card
            </Button>
          </div>
          
          {hasBanks ? (
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
              {hasTransactions ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">                  
                    <TransactionItem transactions={homeData.recentTransactions} />                 
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