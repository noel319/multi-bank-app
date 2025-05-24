// src/pages/HomePage.jsx
import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/solid';
import { useMockData } from '../contexts/MockDataContext';
import BankCard from '../components/Core/BankCard';
import TotalBalanceCard from '../components/UI/TotalBalanceCard';
import TransactionItem from '../components/Core/TransactionItem';
import Modal from '../components/Core/Modal';
import Button from '../components/Core/Button';
import BankCardForm from '../components/Forms/BankCardForm'; // <-- IMPORT NEW FORM
import { DEFAULT_BANK_CARD_FORM_DATA } from '../../utils/constants'; // <-- IMPORT CONSTANT

const HomePage = () => {
  const { accounts, totalBalance, transactions, userProfile, addAccount, updateAccount, deleteAccount } = useMockData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const recentTransactions = transactions.slice(0, 3);

  const handleAddCardClick = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const handleEditCardClick = (account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleDeleteCard = (accountId) => {
    if (window.confirm("Are you sure you want to delete this card?")) {
      deleteAccount(accountId);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingAccount(null); // Reset editing state
  };

  const handleFormSubmit = (accountData) => {
    if (editingAccount) {
      updateAccount({ ...editingAccount, ...accountData });
    } else {
      addAccount(accountData);
    }
    handleModalClose();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6 px-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Home</h1>
          <p className="text-slate-500">Welcome back, {userProfile?.name || 'User'}!</p>
        </div>
        {userProfile?.avatar && <img src={userProfile.avatar} alt="User" className="h-12 w-12 rounded-full" />}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-3/5 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-700">Your cards</h2>
            <Button onClick={handleAddCardClick} variant="primary" size="sm">
              <PlusIcon className="h-5 w-5 mr-1 inline" /> Add Card
            </Button>
          </div>
          {accounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {accounts
                .filter(acc => acc.cardType !== 'Savings') // Example filter
                .map(account => ( // <-- USING .map()
                  <BankCard
                    key={account.id}
                    account={account}
                    onEdit={handleEditCardClick}
                    onDelete={handleDeleteCard}
                  />
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-10 bg-white rounded-lg shadow">No cards added yet. Click "Add Card" to get started.</p>
          )}
        </div>

        <div className="lg:w-2/5 space-y-6">
          <TotalBalanceCard totalBalance={totalBalance} />
          <div>
            <h2 className="text-xl font-semibold text-slate-700 mb-3">Latest transactions</h2>
            <div className="bg-white p-4 rounded-lg shadow">
              {recentTransactions.length > 0 ? (
                recentTransactions.map(tx => <TransactionItem key={tx.id} transaction={tx} />) // <-- USING .map()
              ) : (
                <p className="text-slate-500">No recent transactions.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleModalClose} title={editingAccount ? "Edit Card" : "Add New Card"}>
        <BankCardForm
          initialData={editingAccount || DEFAULT_BANK_CARD_FORM_DATA}
          onSubmit={handleFormSubmit}
          onCancel={handleModalClose}
          isEditing={!!editingAccount}
        />
      </Modal>
    </div>
  );
};

export default HomePage;