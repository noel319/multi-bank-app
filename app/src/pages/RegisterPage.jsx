import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, GoogleLoginButton } from '../contexts/AuthContext';

const RegisterPage = () => {
  const { user, signUp, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      await signUp(formData.email, formData.password, formData.name);
      // Navigation will happen automatically via useEffect when user state changes
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
      console.error('Google registration failed:', error);
      setError('Google registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google registration error:', error);
    setError('Google registration failed. Please try again.');
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
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Create Account</h1>
        <p className="text-slate-600 mb-6">
          Join us to start managing your finances securely.
        </p>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label htmlFor="name" className="block text-slate-700 text-sm font-medium">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full mt-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-blue-dark focus:outline-none disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-slate-700 text-sm font-medium">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full mt-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-blue-dark focus:outline-none disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-slate-700 text-sm font-medium">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full mt-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-blue-dark focus:outline-none disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-slate-700 text-sm font-medium">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
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
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="my-6 border-t border-slate-200 relative">
          <span className="absolute top-[-12px] left-1/2 transform -translate-x-1/2 bg-white px-4 text-slate-500 text-sm">or</span>
        </div>

        {/* Google Registration */}
        <div className="flex flex-col items-center">
          <GoogleLoginButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Your data is stored securely and encrypted.
        </p>

        {/* Link to login page */}
        <div className="mt-4 text-sm text-slate-600">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-brand-blue-dark hover:underline"
          >
            Sign in here
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;