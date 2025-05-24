// src/utils/helpers.js

// Example helper function (if you use date-fns extensively)
import { format, parseISO } from 'date-fns';

export const formatDate = (dateString, formatStr = 'dd MMM yyyy') => {
  if (!dateString) return '';
  try {
    // Assuming dateString might be ISO or a format parseISO can handle
    return format(parseISO(dateString), formatStr);
  } catch (error) {
    // Fallback for simple date strings if parseISO fails, or handle error
    try {
        return format(new Date(dateString), formatStr);
    } catch (e) {
        console.warn("Failed to format date:", dateString, e);
        return dateString; // Return original if formatting fails
    }
  }
};

export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  if (typeof amount !== 'number') return '';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: currency }).format(amount);
};

// You could add the getMonthSheetName helper here as well
// export const getMonthSheetName = (dateString) => {
//   if (!dateString) return new Date().toLocaleDateString('en-US', { month: 'short' }); // Default to current month if no date
//   try {
//     return format(parseISO(dateString), 'MMM'); // Jan, Feb, etc.
//   } catch (error) {
//     try {
//         return format(new Date(dateString), 'MMM');
//     } catch (e) {
//         console.warn("Failed to get month sheet name from date:", dateString, e);
//         return new Date().toLocaleDateString('en-US', { month: 'short' });
//     }
//   }
// };