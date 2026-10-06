/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0a0a',
          900: '#111111',
          800: '#1f1f1f',
          700: '#2e2e2e',
          600: '#454545',
          500: '#5e5e5e',
          400: '#7a7a7a',
          300: '#a3a3a3',
          200: '#d4d4d4',
          100: '#e8e8e8',
          50: '#f7f7f7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
