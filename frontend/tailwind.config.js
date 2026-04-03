/** @type {import('tailwindcss').Config} */
export default {
  // 1. Mandatory: This tells Tailwind where your components are!
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 2. Your custom animations
      keyframes: {
        'dark-veil': {
          '0%': { transform: 'translate(-5%, -5%)' },
          '50%': { transform: 'translate(5%, 5%)' },
          '100%': { transform: 'translate(-5%, -5%)' },
        },
      },
      animation: {
        // Slowing it down to 25s makes the 'veil' look more natural/smoky
        'dark-veil': 'dark-veil 25s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}