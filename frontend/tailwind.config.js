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
          bg: '#212832',
          surface: '#3B3E47',
          accent: '#FD7014',
          text: '#EDEDED',
        },
      },
    },
  },
  plugins: [],
}
