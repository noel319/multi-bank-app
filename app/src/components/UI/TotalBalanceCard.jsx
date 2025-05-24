// src/components/UI/TotalBalanceCard.jsx
import React from 'react';
import { CreditCardIcon, QrCodeIcon, ArrowsRightLeftIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline'; // Or solid

const ActionButton = ({ icon: Icon, label, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center space-y-1 text-white hover:opacity-80 transition-opacity">
    <span className="p-3 bg-white/10 rounded-lg">
      <Icon className="h-5 w-5" />
    </span>
    <span className="text-xs">{label}</span>
  </button>
);


const TotalBalanceCard = ({ totalBalance }) => {
  return (
    <div className="bg-gradient-blue p-6 rounded-2xl shadow-xl text-white">
      <div className="mb-3">
        <span className="text-sm opacity-80">Total</span>
        <h2 className="text-4xl font-bold tracking-tight">
          $ {totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h2>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-6 pt-4 border-t border-white/20">
        <ActionButton icon={CreditCardIcon} label="Card" onClick={() => console.log("Card action")} />
        <ActionButton icon={QrCodeIcon} label="QR Pay" onClick={() => console.log("QR Pay action")} />
        <ActionButton icon={ArrowsRightLeftIcon} label="Exchange" onClick={() => console.log("Exchange action")} />
        <ActionButton icon={ArrowUpRightIcon} label="Send" onClick={() => console.log("Send action")} />
      </div>
    </div>
  );
};

export default TotalBalanceCard;