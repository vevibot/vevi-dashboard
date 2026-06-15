/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['Fira Code', 'monospace'],
        sans: ['Fira Sans', 'sans-serif'],
      },
      colors: {
        bg:        '#000000',
        surface:   '#0A0A0A',
        elevated:  '#141414',
        border:    '#1E1E1E',
        green:     '#00FF41',
        red:       '#FF3131',
        muted:     '#555555',
        text:      '#FFFFFF',
      },
    },
  },
  plugins: [],
};
