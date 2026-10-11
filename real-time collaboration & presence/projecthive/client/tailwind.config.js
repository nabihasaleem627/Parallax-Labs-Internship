/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f2f5fb',
          100: '#e3e9f5',
          200: '#c6d3ea',
          300: '#9ab2d8',
          400: '#6889c0',
          500: '#4769a6',
          600: '#35518a',
          700: '#2b4170',
          800: '#1e2d4f',
          900: '#14203a',
          950: '#0d1526',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(16 24 40 / 0.05), 0 1px 3px 0 rgb(16 24 40 / 0.08)',
        pop: '0 8px 24px -6px rgb(16 24 40 / 0.16), 0 2px 6px -2px rgb(16 24 40 / 0.08)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } },
        'typing-bounce': { '0%, 60%, 100%': { transform: 'translateY(0)' }, '30%': { transform: 'translateY(-3px)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out',
        'typing-bounce': 'typing-bounce 1.2s infinite',
      },
    },
  },
  plugins: [],
};
