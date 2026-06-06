/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mahjong: {
          green: '#1a6b3c',
          red: '#c53030',
          gold: '#d69e2e',
          felt: '#0f4c2e',
        },
      },
    },
  },
  plugins: [],
};
