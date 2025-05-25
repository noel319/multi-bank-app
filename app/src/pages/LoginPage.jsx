import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GoogleLoginButton from '../components/Auth/GoogleLoginButton';

const LoginPage = () => {
  const { user, signIn } = useAuth(); // Adjust signIn if it supports email/password
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signIn(email, password); // Ensure signIn handles credentials
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-blue-dark to-brand-teal-light p-4">
      <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl text-center max-w-md w-full">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Welcome Back!</h1>
        <p className="text-slate-600 mb-6">
          Securely manage your finances by logging in.
        </p>

        {/* Email/Password Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label htmlFor="email" className="block text-slate-700 text-sm font-medium">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full mt-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-blue-dark focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-slate-700 text-sm font-medium">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full mt-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-blue-dark focus:outline-none"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-brand-blue-dark text-white py-2 px-4 rounded-md hover:bg-brand-blue-light transition"
          >
            Login
          </button>
        </form>

        <div className="my-6 border-t border-slate-200 relative">
          <span className="absolute top-[-12px] left-1/2 transform -translate-x-1/2 bg-white px-4 text-slate-500 text-sm">or</span>
        </div>

        {/* Google Login */}
        <GoogleLoginButton />

        <p className="mt-6 text-xs text-slate-500">
          Your data is stored securely in your Google Sheets.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
