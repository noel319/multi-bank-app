// src/utils/constants.js

export const NAV_ITEMS = [
    { name: 'Home', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Transactions', path: '/transactions' },
    { name: 'Cost Centers', path: '/cost-centers' },
  ];
  
  export const DEFAULT_BANK_CARD_FORM_DATA = {
    bankName: '',
    last4: '',
    balance: '',
    expiry: '',
    cardType: 'VISA',
    colorGradient: 'gradient-purple', // Default color
  };
  
  export const CARD_COLOR_OPTIONS = [
    { label: 'Purple', value: 'gradient-purple', class: 'bg-gradient-purple' },
    { label: 'Teal', value: 'gradient-teal', class: 'bg-gradient-teal' },
    { label: 'Indigo', value: 'gradient-indigo', class: 'bg-gradient-indigo' },
    { label: 'Blue', value: 'gradient-blue', class: 'bg-gradient-blue' },
    // Add more if needed, ensure these 'bg-gradient-*' classes are in tailwind.config.js
  ];
  
  export const CARD_TYPE_OPTIONS = [
    { value: 'VISA', label: 'VISA' },
    { value: 'MasterCard', label: 'MasterCard' },
    { value: 'Amex', label: 'American Express' },
    // Add other card types
  ];
  
  
  export const DEFAULT_COST_CENTER_FORM_DATA = {
    name: '',
    type: 'expense', // 'expense' or 'income'
  };
  
  export const COST_CENTER_TYPES = [
    { value: 'expense', label: 'Expense' },
    { value: 'income', label: 'Income' },
  ];
  
  export const TRANSACTION_TYPES = {
    INCOME: 'income',
    EXPENSE: 'expense',
  };
  
  // For charts
  export const CHART_COLORS = ['#0A74DA', '#10B981', '#A855F7', '#F59E0B', '#EF4444', '#3B82F6'];
  // Primary Blue, Green, Purple, Amber, Red, Indigo
  
  // Filter options (can be expanded)
  export const DATE_FILTER_OPTIONS = [
      { value: 'all', label: 'All Dates' },
      { value: 'daily', label: 'Today' },
      { value: 'weekly', label: 'This Week' },
      { value: 'monthly', label: 'This Month' },
  ];
  
  export const TRANSACTION_TYPE_FILTER_OPTIONS = [
      { value: 'all', label: 'All Types' },
      { value: TRANSACTION_TYPES.INCOME, label: 'Income' },
      { value: TRANSACTION_TYPES.EXPENSE, label: 'Expense' },
  ];
  
  // Placeholder for initial assets if they were static
  // export const VISA_LOGO_URL = '/src/assets/images/visa-logo.png';
  // export const USER_AVATAR_URL = '/src/assets/images/user-avatar.png';
  
  // You can also define keys for localStorage here
  export const LOCAL_STORAGE_KEYS = {
    SPREADSHEET_ID: 'spreadsheetId',
    // other keys
  };