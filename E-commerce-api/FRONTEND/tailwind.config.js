/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#F85606',
          'orange-hover': '#D04400',
          accent: '#E7FFFD',
          canvas: '#EFF0F5',
          surface: '#FFFFFF',
          dark: '#212121',
          muted: '#757575',
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#F85606',
          600: '#D04400',
          700: '#c23b00',
        }
      }
    },
  },
  plugins: [],
}

