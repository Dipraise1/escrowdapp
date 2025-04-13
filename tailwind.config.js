/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'eth-blue': '#627EEA',
        'sol-purple': '#9945FF',
        'neon-green': '#39FF14',
        'acid-green': '#00FF41',
        'matrix-green': '#03A062',
        'deep-black': '#0A0A0A',
        'charcoal': '#121212',
        'dark-gray': '#1A1A1A',
      },
      boxShadow: {
        'neon-green': '0 0 5px #39FF14, 0 0 10px #39FF14, 0 0 15px #39FF14',
        'neon-green-sm': '0 0 2px #39FF14, 0 0 5px #39FF14',
        'neon-green-lg': '0 0 10px #39FF14, 0 0 20px #39FF14, 0 0 30px #39FF14',
      },
      backgroundImage: {
        'matrix-gradient': 'linear-gradient(to right, #000000, #0F0F0F, #121212)',
        'neon-gradient': 'linear-gradient(to right, #39FF14, #00FF41)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 