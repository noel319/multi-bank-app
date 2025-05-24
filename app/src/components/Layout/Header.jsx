// src/components/Layout/Header.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import GoogleLoginButton from '../Auth/GoogleLoginButton';
import { NAV_ITEMS } from '../../utils/constants'; // <-- IMPORT CONSTANT

const Header = () => {
  const { user } = useAuth();

  // NAV_ITEMS already defined in constants.js

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-brand-blue-dark">FinanceControl</h1>
        </div>
        
        <nav className="hidden md:flex space-x-2">
          {NAV_ITEMS.map((item) => ( // <-- USE NAV_ITEMS with .map()
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'bg-brand-blue-light text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center space-x-3">
          <button className="p-2 text-slate-500 hover:text-brand-blue-dark hover:bg-slate-100 rounded-full">
            <QuestionMarkCircleIcon className="h-6 w-6" />
          </button>
          {user ? (
            <div className="flex items-center space-x-2">
               <img src={user.imageUrl} alt={user.name} className="h-8 w-8 rounded-full" />
            </div>
          ) : (
            <GoogleLoginButton />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;