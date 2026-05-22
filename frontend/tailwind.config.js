/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cdi-client-02': '#2563eb', // Blue color for employer
        'cdi-freelancer-02': '#f97316', // Orange color for freelancer
        'cdi-client-03': '#3b82f6', // Lighter blue for focus ring
      },
    },
  },
  plugins: [],
} 