// src/components/Layout/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  QuestionMarkCircleIcon, 
  UserCircleIcon, 
  ChevronDownIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { GoogleLoginButton } from '../../contexts/AuthContext';
import { NAV_ITEMS } from '../../utils/constants';

const Header = () => {
  const { user, signOut, initiateGoogleLogin, connectGoogleSheets } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await initiateGoogleLogin();
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const handleConnectGoogleSheets = async () => {
    try {
      await connectGoogleSheets();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Google Sheets connection error:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-brand-blue-dark">FinanceControl</h1>
        </div>
        
        <nav className="hidden md:flex space-x-2">
          {NAV_ITEMS.map((item) => (
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
            <div className="relative" ref={dropdownRef}>
              {/* User Profile Button */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {user.imageUrl ? (
                  <img 
                    src={user.imageUrl} 
                    alt={user.name} 
                    className="h-8 w-8 rounded-full object-cover" 
                  />
                ) : (
                  <UserCircleIcon className="h-8 w-8 text-slate-500" />
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-slate-700">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <ChevronDownIcon className="h-4 w-4 text-slate-500" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                  {/* User Info Section */}
                  <div className="px-4 py-3 border-b border-slate-200">
                    <div className="flex items-center space-x-3">
                      {user.imageUrl ? (
                        <img 
                          src={user.imageUrl} 
                          alt={user.name} 
                          className="h-10 w-10 rounded-full object-cover" 
                        />
                      ) : (
                        <UserCircleIcon className="h-10 w-10 text-slate-500" />
                      )}
                      <div>
                        <p className="font-medium text-slate-800">{user.name}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                        {user.google_token && (
                          <p className="text-xs text-green-600 flex items-center mt-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Google Connected
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Google Connection Section */}
                  {!user.google_token && (
                    <div className="px-4 py-2 border-b border-slate-200">
                      <button
                        onClick={handleConnectGoogleSheets}
                        className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 w-full"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span>Connect Google Sheets</span>
                      </button>
                    </div>
                  )}

                  {/* Logout Section */}
                  <div className="px-4 py-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-800 w-full py-2"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Not logged in - Show Google login icon only */
            <GoogleLoginButton 
              variant="icon"
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;