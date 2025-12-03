/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: '#FBBF24', // Amber 400
        'primary-dark': '#F59E0B', // Amber 500
        background: '#0d1117', // Very dark blue/black
        secondary: '#161b22', // Dark blue for cards/panels
        'secondary-light': '#21262d', // Lighter dark shade for hovers/borders
        border: '#30363d', // Border color
        text: {
          DEFAULT: '#e6edf3', // Primary text - light grey/white
          light: '#7d8590', // Secondary text - dimmer grey
        }
      },
    },
  },
  plugins: [],
}
