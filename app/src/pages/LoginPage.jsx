import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, GoogleLoginButton } from '../contexts/AuthContext';

const LoginPage = () => {
  const { user, signIn, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await signIn(email, password);
      // Navigation will happen automatically via useEffect when user state changes
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setIsLoading(true);
    
    try {
      await signInWithGoogle(credentialResponse);
      // Navigation will happen automatically via useEffect when user state changes
    } catch (error) {
      console.error('Google login failed:', error);
      setError('Google login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google login error:', error);
    setError('Google login failed. Please try again.');
  };

  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-blue-dark to-brand-teal-light">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

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
              disabled={isLoading}
              className="w-full mt-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-blue-dark focus:outline-none disabled:opacity-50"
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
              disabled={isLoading}
              className="w-full mt-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-blue-dark focus:outline-none disabled:opacity-50"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-blue-dark text-white py-2 px-4 rounded-md hover:bg-brand-blue-light transition disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="my-6 border-t border-slate-200 relative">
          <span className="absolute top-[-12px] left-1/2 transform -translate-x-1/2 bg-white px-4 text-slate-500 text-sm">or</span>
        </div>

        {/* Google Login */}
        <div className="flex flex-col items-center">
          <GoogleLoginButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Your data is stored securely in your Google Sheets.
        </p>

        {/* Optional: Link to registration page */}
        <div className="mt-4 text-sm text-slate-600">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-brand-blue-dark hover:underline"
          >
            Sign up here
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;