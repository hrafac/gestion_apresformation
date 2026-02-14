/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        marsa: {
          blue: '#004A99',
          orange: '#FF8200',
        }
      }
    },
  },
  plugins: [],
}
