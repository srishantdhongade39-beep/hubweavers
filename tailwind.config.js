/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          primary: '#0D6B5B',
          success: '#1D9E75',
          dark: '#0D2B25',
          light: '#E6F7F2',
          bg: '#EDF4F2',
        },
        amber: {
          gold: '#D4A017',
        },
        text: {
          primary: '#1A1A2E',
          secondary: '#6B7280',
        },
        error: '#E53E3E',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
