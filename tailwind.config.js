/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        'main': ['Questrial', 'Inter', 'Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}