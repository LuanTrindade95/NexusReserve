/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        midnight: {
          blue: '#0F172A',
        },
        slate: {
          enterprise: '#1E293B',
        },
        enterprise: {
          cyan: '#06B6D4',
        },
        surface: '#F8FAFC',
        border: '#E2E8F0',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        enterprise: '0.5rem',
      },
      boxShadow: {
        soft: '0 12px 32px rgb(15 23 42 / 0.08)',
      },
    },
  },
  plugins: [],
};
