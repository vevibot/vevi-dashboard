/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Sora carries more personality than Fira Sans without reading as a
        // gaming font. JetBrains Mono has genuinely good tabular figures, which
        // matters when columns of prices have to line up.
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        sans: ['Sora', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        // ── Ground stack ────────────────────────────────────────────────────
        // Five steps, not two. The old #000 base with a #0A0A0A surface was a 4%
        // luminance difference, so nothing on the page had depth or a light source.
        bg:        '#06070A',
        surface:   '#0B0E13',
        elevated:  '#11151C',
        float:     '#171C25',   // NEW — the step that lets cards sit above panels
        border:    '#1D232E',
        'border-soft': '#161B23',

        // ── P&L owns green and red, exclusively ─────────────────────────────
        green:     '#3DDC84',   // semantic positive — P&L / long ONLY
        red:       '#FB5E6D',   // semantic negative — P&L / short ONLY
        warn:      '#F5B93B',

        // ── Brand ───────────────────────────────────────────────────────────
        // Previously this was #00FF41 — the SAME hex as `green`. Buttons, nav-active,
        // focus rings and profit all rendered identically, so nothing read as a
        // signal. Now distinct, and used as glow / hairline / focus rather than as a
        // large flat fill.
        accent:    '#00F5A0',
        'accent-dim': '#00C482',

        muted:     '#5C6675',   // micro-text / secondary labels
        secondary: '#98A3B3',   // values / mid-emphasis text
        text:      '#EEF2F7',
      },
      borderRadius: {
        sm: '6px',
        md: '9px',
        lg: '12px',
        xl: '14px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.40)',
        md: '0 4px 12px rgba(0,0,0,0.50)',
        lg: '0 20px 46px -26px rgba(0,0,0,0.92)',
        // Top-edge highlight — a light source from above. This is most of what
        // separates a considered dark surface from a flat one.
        rim: '0 1px 0 rgba(255,255,255,.04) inset, 0 20px 46px -26px rgba(0,0,0,.92)',
        glow: '0 0 26px -6px #00F5A0',
      },
      transitionTimingFunction: {
        // The built-in easings are too weak to read as deliberate. ease-in is never
        // used for UI: it delays the first frame, which is exactly when the eye is
        // on the element.
        out: 'cubic-bezier(.23,1,.32,1)',
        'in-out': 'cubic-bezier(.77,0,.175,1)',
      },
      keyframes: {
        rise: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'none' } },
        flashUp: { '0%': { background: 'rgba(61,220,132,.24)' }, '100%': { background: 'transparent' } },
        flashDown: { '0%': { background: 'rgba(251,94,109,.24)' }, '100%': { background: 'transparent' } },
        breathe: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.35' } },
      },
      animation: {
        rise: 'rise .42s cubic-bezier(.23,1,.32,1) both',
        'flash-up': 'flashUp .75s cubic-bezier(.23,1,.32,1)',
        'flash-down': 'flashDown .75s cubic-bezier(.23,1,.32,1)',
        breathe: 'breathe 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
