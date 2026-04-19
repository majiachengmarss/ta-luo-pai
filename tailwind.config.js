/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          900: '#061611',
          800: '#0a1f18',
          700: '#153329',
          600: '#1d4d3c',
          500: '#2d5a27',
        },
        magic: {
          cyan: '#a7f3d0',
          emerald: '#34d399',
          gold: '#fde68a',
          pink: '#fbcfe8',
        },
        mystic: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
      },
      fontFamily: {
        display: ['"Newsreader"', 'serif'],
        serif: ['"EB Garamond"', 'serif'],
        sans: ['"Lexend"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}