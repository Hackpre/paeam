/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fffdf5',
          100: '#fef9e7',
          200: '#fdf0c4',
          300: '#fce49d',
          400: '#f5d060',
          500: '#d4a017',
          600: '#b8860b',
          700: '#9a7209',
          800: '#7d5d07',
          900: '#5c4405',
          950: '#3a2c03',
        },
      },
    },
  },
  plugins: [],
};
