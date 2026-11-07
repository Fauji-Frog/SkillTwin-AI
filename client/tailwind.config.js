/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0B0F14',
          surface: '#111720',
          card: '#161F2B',
          cardHover: '#1A2433',
          border: '#1F2937',
          borderLight: '#2D3748'
        },
        lime: {
          accent: '#A3E635',
          light: '#BEF264',
          dim: '#4D7C0F',
          dark: '#1A2E05'
        }
      }
    }
  },
  plugins: []
};
