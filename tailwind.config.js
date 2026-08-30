/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Mono is the primary voice here, not a costume: every figure on this
        // product is a measurement, and tabular numerals stop columns of prices
        // dancing as digits change. Sans is reserved for prose.
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['Archivo', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        // Ground. A terminal is read for hours in a dark room — the scene picks
        // the theme, not the category.
        bg:        '#05060A',
        surface:   '#090B10',
        elevated:  '#0D1016',
        float:     '#12161D',

        // Hairlines carry the entire structure in place of cards, so they have to
        // be genuinely visible rather than a suggestion.
        border:      '#1B212B',
        'border-soft': '#12171F',
        'border-lit':  '#2A323F',

        green:     '#3DDC84',
        red:       '#FF5C6C',
        warn:      '#F5B93B',
        accent:    '#00F5A0',
        'accent-dim': '#00A870',

        // 4.5:1 on --bg at body size. Previously #5C6675, which failed.
        muted:     '#6B7788',
        secondary: '#98A3B3',
        text:      '#E8EDF2',
      },
      // A terminal has no rounded boxes. Keeping a token named `lg` avoids
      // breaking the 14 routes that reference it; it simply resolves to a corner
      // sharp enough to read as an instrument.
      borderRadius: { none: '0', sm: '0', md: '0', lg: '2px', xl: '2px', '2xl': '2px', full: '9999px' },
      boxShadow: {
        // Depth carries an offset and a blur. A zero-offset coloured halo is
        // decoration, and this world does not use one.
        sm: '0 1px 2px rgba(0,0,0,.5)',
        md: '0 6px 16px -8px rgba(0,0,0,.7)',
        lg: '0 18px 40px -22px rgba(0,0,0,.85)',
        rim: 'none',
        glow: 'none',
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '.09em' }],
        xs:    ['11px', { lineHeight: '16px' }],
        sm:    ['12.5px', { lineHeight: '18px' }],
        base:  ['14px', { lineHeight: '21px' }],
        lg:    ['16px', { lineHeight: '22px' }],
        xl:    ['19px', { lineHeight: '25px', letterSpacing: '-.02em' }],
        '2xl': ['24px', { lineHeight: '29px', letterSpacing: '-.028em' }],
        '3xl': ['32px', { lineHeight: '36px', letterSpacing: '-.034em' }],
        '4xl': ['44px', { lineHeight: '46px', letterSpacing: '-.04em' }],
      },
      spacing: { row: '30px', rail: '44px' },
      transitionTimingFunction: {
        out: 'cubic-bezier(.23,1,.32,1)',
        'in-out': 'cubic-bezier(.77,0,.175,1)',
      },
      keyframes: {
        // THE authored moment: a value that changed announces itself, then gets
        // out of the way. It is information, not decoration — which is why it is
        // the one animation that survives prefers-reduced-motion.
        markUp:   { '0%': { background: 'rgba(61,220,132,.26)' }, '100%': { background: 'transparent' } },
        markDown: { '0%': { background: 'rgba(255,92,108,.26)' }, '100%': { background: 'transparent' } },
        scanline: { '0%': { transform: 'scaleX(0)' }, '100%': { transform: 'scaleX(1)' } },
      },
      animation: {
        'mark-up': 'markUp .9s cubic-bezier(.23,1,.32,1)',
        'mark-down': 'markDown .9s cubic-bezier(.23,1,.32,1)',
        scanline: 'scanline .5s cubic-bezier(.23,1,.32,1) both',
      },
    },
  },
  plugins: [],
};
