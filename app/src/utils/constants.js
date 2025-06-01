// Default form data for bank card creation
export const DEFAULT_BANK_CARD_FORM_DATA = {
  bank_name: '',
  account: '',
  current_balance: 0,
  endpoint: '',
  color: 'blue',
  role: 'checking'
};

export const NAV_ITEMS = [
  {name: 'Home', path:'/'},
  {name: 'Tranctions', path:'/transactions'},
  {name: 'Dashboard', path:'/dashboard'},
  {name: 'Cost-Centers', path:'/cost-centers'},
  {name: 'Billing', path:'/billing'}
];

// Available bank card colors
export const BANK_CARD_COLORS = [
  { name: 'Blue', value: 'blue' },
  { name: 'Green', value: 'green' },
  { name: 'Purple', value: 'purple' },
  { name: 'Red', value: 'red' },
  { name: 'Orange', value: 'orange' },
  { name: 'Teal', value: 'teal' },
  { name: 'Indigo', value: 'indigo' },
  { name: 'Pink', value: 'pink' }
];

// Account types
export const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking Account' },
  { value: 'savings', label: 'Savings Account' },
  { value: 'business', label: 'Business Account' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'investment', label: 'Investment Account' }
];

// Transaction states
export const TRANSACTION_STATES = {
  INCOME: 'income',
  OUTGOING: 'outgoing'
};

// API endpoints (if needed for future use)
export const API_ENDPOINTS = {
  HOME_DATA: 'get_home_data',
  ADD_BANK: 'add_bank',
  UPDATE_BANK: 'update_bank',
  DELETE_BANK: 'delete_bank',
  IMPORT_TRANSACTIONS: 'import_transactions',
  SYNC_GOOGLE_SHEETS: 'sync_google_sheets'
};

// File types for import
export const SUPPORTED_FILE_TYPES = [
  { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
  { name: 'CSV Files', extensions: ['csv'] }
];

// Currency formatting options
export const CURRENCY_OPTIONS = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
};

// Date formatting options
export const DATE_OPTIONS = {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
};

  // Filter options (can be expanded)
  export const DATE_FILTER_OPTIONS = [
    { value: 'all', label: 'All Dates' },
    { value: 'daily', label: 'Today' },
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'This Month' },
];

export const TRANSACTION_TYPE_FILTER_OPTIONS = [
    { value: 'all', label: 'All Types' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
];
export const COST_CENTER_TYPES = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
];
export const CHART_COLORS = ['#0A74DA', '#10B981', '#A855F7', '#F59E0B', '#EF4444', '#3B82F6'];
export const DEFAULT_COST_CENTER_FORM_DATA = {
  group: '',
  cost_center: '',
  area: '',
  state: ''
};