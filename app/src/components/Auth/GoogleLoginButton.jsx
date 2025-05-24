import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const GoogleLoginButton = ({ className = "" }) => {
  const { user, signIn, signOut, isGapiLoaded } = useAuth();

    if (!isGapiLoaded && !user) {
    return (
        <button
          className={`px-4 py-2 font-semibold text-white bg-gray-400 rounded-lg shadow-md cursor-not-allowed ${className}`}
          disabled
        >
          Loading Google API...
        </button>
    );
  }

  if (user) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {user.imageUrl && <img src={user.imageUrl} alt={user.name || 'User'} className="w-8 h-8 rounded-full" />}
        {user.name && <span className="text-sm text-slate-700 hidden md:inline">{user.name}</span>}
        <button 
          onClick={signOut} 
          className="px-3 py-1.5 text-xs font-semibold text-white bg-red-500 rounded-md hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn} // Using signIn from the (simplified) AuthContext
      className={`w-full bg-brand-blue-light hover:bg-brand-blue-dark text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center justify-center space-x-2 ${className}`}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        <path d="M1 1h22v22H1z" fill="none" />
      </svg>
      <span>Sign in with Google</span>
    </button>
  );
};
export default GoogleLoginButton;