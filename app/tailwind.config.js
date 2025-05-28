/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue-dark': '#0A74DA',
        'brand-blue-light': '#2596F7',
        'brand-purple-dark': '#7C3AED', // Example: used in gradient-purple
        'brand-purple-light': '#A855F7',// Example: used in gradient-purple
        'brand-teal-dark': '#10B981',   // Example: used in gradient-teal
        'brand-teal-light': '#34D399',  // Example: used in gradient-teal
        'brand-indigo-dark': '#3B82F6', // Example: used in gradient-indigo
        'brand-indigo-light': '#2563EB',// Example: used in gradient-indigo
        'status-green': '#10B981',
        'status-red': '#EF4444',
      },
      backgroundImage: {
        'gradient-blue': 'linear-gradient(to right, #0A74DA, #2596F7)',
        'gradient-purple': 'linear-gradient(to right, #7C3AED, #A855F7)',
        'gradient-teal': 'linear-gradient(to right, #10B981, #34D399)',
        'gradient-indigo': 'linear-gradient(to right, #3B82F6, #2563EB)',
        // Add more gradients if your CARD_COLOR_OPTIONS have more
      }
    },
  },
  plugins: [],
}