/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        neo: {
          light: '#e0e5ec',
          dark: '#a3b1c6',
          background: '#e0e5ec',
        }
      },
      boxShadow: {
        'neo': '9px 9px 16px rgba(163, 177, 198, 0.6), -9px -9px 16px rgba(255, 255, 255, 0.5)',
        'neo-inset': 'inset 9px 9px 16px rgba(163, 177, 198, 0.6), inset -9px -9px 16px rgba(255, 255, 255, 0.5)',
        'neo-sm': '4px 4px 8px rgba(163, 177, 198, 0.6), -4px -4px 8px rgba(255, 255, 255, 0.5)',
        'neo-hover': '12px 12px 20px rgba(163, 177, 198, 0.6), -12px -12px 20px rgba(255, 255, 255, 0.5)',
      },
    },
  },
  plugins: [],
}
