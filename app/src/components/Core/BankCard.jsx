// src/components/Core/BankCard.jsx
import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import visaLogoPlaceholder from '../../assets/images/visa-logo.png'; // Your Visa logo

const BankCard = ({ account, onEdit, onDelete, clickable = true }) => {
  const navigate = useNavigate();
  const { id, bankName, last4, balance, expiry, cardType, colorGradient, logo } = account;

  const handleCardClick = () => {
    if (clickable) {
      navigate(`/accounts/${id}`);
    }
  };

  return (
    <div
      className={`relative p-4 md:p-5 rounded-xl shadow-lg text-white min-w-[260px] md:min-w-[280px] h-[170px] md:h-[180px] flex flex-col justify-between cursor-${clickable ? 'pointer' : 'default'} ${colorGradient}`}
      onClick={handleCardClick}
    >
      <div>
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium">{bankName}</span>
          {logo && <img src={logo} alt={`${cardType} logo`} className="h-5 opacity-80" />}
        </div>
        <div className="mt-3 md:mt-4">
          <span className="block text-2xl md:text-3xl font-bold tracking-wider">
            $ {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="block text-xs opacity-80 mt-1">Available Balance</span>
        </div>
      </div>
      <div className="flex justify-between items-end">
        <div>
          <span className="block text-sm font-mono tracking-widest">**** **** **** {last4}</span>
          <span className="block text-xs opacity-80 mt-0.5">Expires: {expiry}</span>
        </div>
        {onEdit && onDelete && clickable && (
          <div className="flex space-x-2">
            <button onClick={(e) => { e.stopPropagation(); onEdit(account); }} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full">
              <PencilIcon className="h-4 w-4 text-white" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(account.id); }} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full">
              <TrashIcon className="h-4 w-4 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

BankCard.defaultProps = {
  logo: visaLogoPlaceholder,
};

export default BankCard;