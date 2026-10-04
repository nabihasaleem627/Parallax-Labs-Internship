/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#080a12', 900: '#0d101b', 800: '#151927', 700: '#23283a' },
        brand: { 50: '#f5f3ff', 100: '#ede9fe', 500: '#7c5cff', 600: '#6d4aff', 700: '#5b38dc' },
      },
      boxShadow: {
        card: '0 1px 2px rgba(10, 15, 30, 0.04), 0 8px 24px rgba(10, 15, 30, 0.04)',
        glow: '0 12px 28px rgba(109, 74, 255, 0.22)',
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
