// src/components/Core/Button.jsx
import React from 'react';

const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', type = 'button', disabled = false }) => {
  const baseStyle = 'font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors duration-150';
  
  let variantStyle = '';
  switch (variant) {
    case 'primary':
      variantStyle = 'bg-brand-blue-light hover:bg-brand-blue-dark text-white focus:ring-brand-blue-dark';
      break;
    case 'secondary':
      variantStyle = 'bg-slate-200 hover:bg-slate-300 text-slate-700 focus:ring-slate-400';
      break;
    case 'danger':
      variantStyle = 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-600';
      break;
    case 'icon':
      variantStyle = 'bg-transparent hover:bg-slate-200 text-slate-600 p-2 rounded-full';
      break;
    default:
      variantStyle = 'bg-brand-blue-light hover:bg-brand-blue-dark text-white';
  }

  let sizeStyle = '';
  switch (size) {
    case 'sm': sizeStyle = 'px-3 py-1.5 text-sm'; break;
    case 'md': sizeStyle = 'px-4 py-2 text-base'; break;
    case 'lg': sizeStyle = 'px-6 py-3 text-lg'; break;
    case 'icon': sizeStyle = 'p-2'; break; // for icon buttons
    default: sizeStyle = 'px-4 py-2';
  }
  if (variant === 'icon') sizeStyle = 'p-2';


  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;