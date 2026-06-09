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
        bg:        '#020617',
        surface:   '#0F172A',
        elevated:  '#1E293B',
        border:    '#334155',
        green:     '#22C55E',
        red:       '#EF4444',
        muted:     '#94A3B8',
        text:      '#F8FAFC',
      },
    },
  },
  plugins: [],
};
