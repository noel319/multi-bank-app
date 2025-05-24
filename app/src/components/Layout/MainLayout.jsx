// src/components/Layout/MainLayout.jsx
import React from 'react';
import Header from './Header';
// import BottomNav from '../UI/BottomNav'; // If you implement a mobile bottom navigation

const MainLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6">
        {children}
      </main>
      {/* <BottomNav /> */} {/* Example for mobile */}
      <footer className="text-center py-4 text-sm text-slate-500 border-t border-slate-200">
        © {new Date().getFullYear()} Income & Expenditure Control App.
      </footer>
    </div>
  );
};

export default MainLayout;