// src/components/Core/BankCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';

// Placeholder for world map pattern - replace with your actual image path
import worldMapPatternPlaceholder from '../../assets/images/world_map_pattern.png';
// Placeholder for Mastercard logo - replace or make cardNetworkLogoUrl a prop
import MasterCardLogo from '../UI/MastercardLogo';


const BankCard = ({
  account, // Keep the account object for existing data structure
  // Props for new design:
  cardNetworkLogoUrl,
  cardNumberMasked,
  expiryDate,
  balanceLabel = "Balance", // Default label
  balanceAmount,
  currencySymbol = "$", // Default currency symbol
  bgColorClassName = "bg-blue-600", // Default background color class (Tailwind)
  textColorClassName = "text-white", // Default text color class
  worldMapPatternUrl = worldMapPatternPlaceholder, // Default map pattern
  // Existing functional props:
  onEdit,
  onDelete,
  clickable = true,
}) => {
  const navigate = useNavigate();
  const { id, bankName } = account || {}; // bankName might not be displayed in new design but good to have for context

  // Use specific props if available, otherwise fallback to account object for compatibility
  const displayCardNumber = cardNumberMasked || `**** **** **** ${account?.last4 || '0000'}`;
  const displayExpiry = expiryDate || account?.expiry || 'MM/YY';
  const displayBalance = typeof balanceAmount === 'number' ? balanceAmount : (account?.balance || 0);
  // const displayNetworkLogo = cardNetworkLogoUrl || (account?.cardType === 'MasterCard' ? mastercardLogoPlaceholder : mastercardLogoPlaceholder); // Basic logic, improve as needed

  const handleCardClick = () => {
    if (clickable && id) {
      navigate(`/accounts/${id}`);
    } else if (clickable) {
      console.warn("BankCard: Clickable but no account ID provided for navigation.");
    }
  };

  const formattedBalance = displayBalance.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div
      className={`relative rounded-xl shadow-lg p-5 md:p-6 flex flex-col justify-between min-w-[280px] w-full max-w-[340px] h-[190px] md:h-[200px] overflow-hidden cursor-${clickable ? 'pointer' : 'default'} ${bgColorClassName} ${textColorClassName}`}
      onClick={handleCardClick}
    >
      {/* World Map Background Pattern */}
      {worldMapPatternUrl && (
        <img
          src={worldMapPatternUrl}
          alt="" // Decorative
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-10 md:opacity-15 z-0 pointer-events-none"
        />
      )}

      {/* Card Content - position relative to be above the pattern */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* Top Row: Network Logo, Masked Number, Expiry */}
        <div className="flex justify-between items-center">
          <MasterCardLogo/>
          <span className="font-mono text-sm md:text-base tracking-wider opacity-90">
            {displayCardNumber.slice(-9).trim()} {/* Show only last part like "**** 3535" */}
          </span>
          <span className="font-mono text-xs md:text-sm opacity-90">{displayExpiry}</span>
        </div>

        {/* Bottom Section: Balance */}
        <div className="mt-auto"> {/* Pushes balance to the bottom */}
          <span className="block text-xs md:text-sm font-light opacity-80 tracking-wide">
            {balanceLabel}
          </span>
          <div className="flex items-baseline">
            <span className="text-2xl md:text-3xl font-bold tracking-tight">
              {currencySymbol}
            </span>
            <span className="text-3xl md:text-4xl font-bold tracking-tight ml-1">
              {formattedBalance.split('.')[0]}
            </span>
            <span className="text-xl md:text-2xl font-bold tracking-tight opacity-80">
              .{formattedBalance.split('.')[1]}
            </span>
          </div>
        </div>
      </div>

      {/* Edit/Delete Icons (optional, at the bottom right, overlayed) */}
      {clickable && onEdit && onDelete && id && (
        <div className="absolute bottom-3 right-3 z-20 flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(account); // Still pass the full account object for editing context
            }}
            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            aria-label="Edit card"
          >
            <PencilIcon className={`h-4 w-4 ${textColorClassName === 'text-white' ? 'text-white' : 'text-slate-700'}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            aria-label="Delete card"
          >
            <TrashIcon className={`h-4 w-4 ${textColorClassName === 'text-white' ? 'text-white' : 'text-slate-700'}`} />
          </button>
        </div>
      )}
    </div>
  );
};

export default BankCard;