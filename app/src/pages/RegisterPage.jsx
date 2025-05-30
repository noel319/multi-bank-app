import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, GoogleLoginButton } from '../contexts/AuthContext';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

const SignupPage = () => {
  const { user, signUp, handleGoogleAuth } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [validation, setValidation] = useState({
    name: { isValid: false, message: '' },
    email: { isValid: false, message: '' },
    password: { isValid: false, message: '' },
    confirmPassword: { isValid: false, message: '' }
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Real-time validation
  useEffect(() => {
    validateField('name', formData.name);
  }, [formData.name]);

  useEffect(() => {
    validateField('email', formData.email);
  }, [formData.email]);

  useEffect(() => {
    validateField('password', formData.password);
  }, [formData.password]);

  useEffect(() => {
    validateField('confirmPassword', formData.confirmPassword);
  }, [formData.confirmPassword, formData.password]);

  const validateField = (fieldName, value) => {
    let isValid = false;
    let message = '';

    switch (fieldName) {
      case 'name':
        if (!value.trim()) {
          message = 'Full name is required';
        } else if (value.trim().length < 2) {
          message = 'Name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          message = 'Name can only contain letters and spaces';
        } else {
          isValid = true;
          message = 'Looks good!';
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          message = 'Email address is required';
        } else if (!emailRegex.test(value)) {
          message = 'Please enter a valid email address';
        } else {
          isValid = true;
          message = 'Valid email address';
        }
        break;

      case 'password':
        if (!value) {
          message = 'Password is required';
        } else if (value.length < 8) {
          message = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          message = 'Password must contain uppercase, lowercase, and number';
        } else {
          isValid = true;
          message = 'Strong password!';
        }
        break;

      case 'confirmPassword':
        if (!value) {
          message = 'Please confirm your password';
        } else if (value !== formData.password) {
          message = 'Passwords do not match';
        } else {
          isValid = true;
          message = 'Passwords match!';
        }
        break;

      default:
        break;
    }

    setValidation(prev => ({
      ...prev,
      [fieldName]: { isValid, message }
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear general error when user starts typing
    if (error) {
      setError('');
    }
  };

  const isFormValid = () => {
    return (
      validation.name.isValid &&
      validation.email.isValid &&
      validation.password.isValid &&
      validation.confirmPassword.isValid &&
      agreedToTerms
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isFormValid()) {
      setError('Please fix all validation errors before submitting');
      return;
    }

    setLoading(true);

    try {
      await signUp(formData.name.trim(), formData.email, formData.password);
      // Navigation will be handled by useEffect when user state changes
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    
    try {
      await handleGoogleAuth(credentialResponse);
      // Navigation will be handled by useEffect when user state changes
    } catch (error) {
      console.error('Google signup failed:', error);
      setError('Google registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getValidationIcon = (field) => {
    if (!formData[field]) return null;
    
    return validation[field].isValid ? (
      <CheckCircleIcon className="h-5 w-5 text-green-500" />
    ) : (
      <XCircleIcon className="h-5 w-5 text-red-500" />
    );
  };

  const getInputClassName = (field) => {
    const baseClass = "w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors";
    
    if (!formData[field]) {
      return `${baseClass} border-slate-300 focus:ring-blue-500 focus:border-blue-500`;
    }
    
    return validation[field].isValid 
      ? `${baseClass} border-green-300 focus:ring-green-500 focus:border-green-500 bg-green-50`
      : `${baseClass} border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-teal-700 p-4">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center mb-4">
            <BanknotesIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Create Account</h1>
          <p className="text-slate-600">
            Join us to start managing your finances securely
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                className={getInputClassName('name')}
                placeholder="Enter your full name"
                disabled={loading}
              />
              <div className="absolute right-3 top-3.5">
                {getValidationIcon('name')}
              </div>
            </div>
            {formData.name && (
              <p className={`text-xs mt-1 ${validation.name.isValid ? 'text-green-600' : 'text-red-600'}`}>
                {validation.name.message}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className={getInputClassName('email')}
                placeholder="Enter your email address"
                disabled={loading}
              />
              <div className="absolute right-3 top-3.5">
                {getValidationIcon('email')}
              </div>
            </div>
            {formData.email && (
              <p className={`text-xs mt-1 ${validation.email.isValid ? 'text-green-600' : 'text-red-600'}`}>
                {validation.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                className={getInputClassName('password')}
                placeholder="Create a strong password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-8 top-3.5 text-slate-400 hover:text-slate-600"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
              <div className="absolute right-2 top-3.5">
                {getValidationIcon('password')}
              </div>
            </div>
            {formData.password && (
              <p className={`text-xs mt-1 ${validation.password.isValid ? 'text-green-600' : 'text-red-600'}`}>
                {validation.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={getInputClassName('confirmPassword')}
                placeholder="Confirm your password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-8 top-3.5 text-slate-400 hover:text-slate-600"
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
              <div className="absolute right-2 top-3.5">
                {getValidationIcon('confirmPassword')}
              </div>
            </div>
            {formData.confirmPassword && (
              <p className={`text-xs mt-1 ${validation.confirmPassword.isValid ? 'text-green-600' : 'text-red-600'}`}>
                {validation.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start gap-3">
            <input
              id="terms"
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              disabled={loading}
            />
            <label htmlFor="terms" className="text-sm text-slate-600">
              I agree to the{' '}
              <button
                type="button"
                onClick={() => window.electronAPI?.openExternalLink('https://example.com/terms')}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Terms of Service
              </button>
              {' '}and{' '}
              <button
                type="button"
                onClick={() => window.electronAPI?.openExternalLink('https://example.com/privacy')}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Privacy Policy
              </button>
            </label>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isFormValid()}
            className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 border-t border-slate-200 relative">
          <span className="absolute top-[-12px] left-1/2 transform -translate-x-1/2 bg-white px-4 text-slate-500 text-sm">
            or
          </span>
        </div>

        {/* Google Signup */}
        <div className="flex flex-col items-center">
          <GoogleLoginButton
            onSuccess={handleGoogleSuccess}
            onError={(error) => {
              console.error('Google signup failed:', error);
              setError('Google registration failed. Please try again.');
            }}
          />
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            🔒 Your financial data is encrypted and stored securely on your device
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;