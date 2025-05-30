// Default form data for bank card creation
export const DEFAULT_BANK_CARD_FORM_DATA = {
  bank_name: '',
  account: '',
  current_balance: 0,
  endpoint: '',
  color: 'blue',
  role: 'checking'
};

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