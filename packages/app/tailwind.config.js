/** @type {import('tailwindcss').Config} */
// "Jade Parlour" palette. The app's components use Tailwind's slate/emerald/
// amber/red/blue/yellow scales, so we redefine those scales (rather than
// rewrite every className) to a warm, premium mahjong identity:
//   slate   -> warm bone → espresso neutrals (panels, text, tile faces)
//   emerald -> jade (interactive / primary)
//   amber   -> antique gold (tai, wins, value)
//   red     -> vermilion (萬 character suit, urgent)
//   blue    -> indigo (筒 dot suit)
//   yellow  -> brass gold (winds)
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // warm neutral ramp (bone → espresso)
        // neutral ramp from theme tokens (styles/index.css): dark in Jade Night, inverted in Daylight
        slate: Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
          .map(k => [k, `rgb(var(--s-${k}) / <alpha-value>)`])),
        // semantic tokens for new screens
        bg: 'var(--bg)', surface: 'var(--surface)', 'surface-2': 'var(--surface-2)', line: 'var(--line)',
        ink: 'var(--ink)', mute: 'var(--mute)', accent: 'var(--accent)', 'accent-ink': 'var(--accent-ink)',
        'accent-soft': 'var(--accent-soft)',
        // jade (interactive / primary)
        emerald: {
          50: '#E7F6EE', 100: '#C6EAD6', 200: '#94D8B5', 300: '#5FC494',
          400: '#3FB683', 500: '#2F9E6E', 600: '#27885D', 700: '#236F4D',
          800: '#1F5A40', 900: '#1A4A35', 950: '#0C2A1E',
        },
        // antique gold (tai / wins / value)
        amber: {
          50: '#FBF4DF', 100: '#F6E7B8', 200: '#EDD488', 300: '#E6CC80',
          400: '#D8B45A', 500: '#C49A3F', 600: '#A37E2F', 700: '#836326',
          800: '#69501F', 900: '#574219', 950: '#33260E',
        },
        // vermilion (character suit / urgent)
        red: {
          50: '#FBEDE9', 100: '#F6D6CC', 200: '#EEB2A2', 300: '#E6826F',
          400: '#DA5A44', 500: '#CE4630', 600: '#B83A28', 700: '#9A3020',
          800: '#7E281B', 900: '#682318', 950: '#3A120C',
        },
        // indigo (dot suit)
        blue: {
          50: '#EDEFF8', 100: '#D6DBF0', 200: '#B2BAE2', 300: '#8E9BD6',
          400: '#6E80C8', 500: '#5566B0', 600: '#46548F', 700: '#3A4670',
          800: '#303A59', 900: '#283048', 950: '#171B2A',
        },
        // brass gold (winds)
        yellow: {
          50: '#FBF5E2', 100: '#F5E8BE', 200: '#EAD68C', 300: '#DCBE6E',
          400: '#CDAA52', 500: '#B8923F', 600: '#977430', 700: '#785B26',
          800: '#624A20', 900: '#523E1B', 950: '#2F230E',
        },
        // semantic aliases
        felt: { DEFAULT: '#15211B', dark: '#101913' },
        gold: '#C9A24B',
        ivory: '#F1E7D2',
      },
      fontFamily: {
        sans: ['var(--font-body)'],
        display: ['var(--font-display)'],
        // Numbers used to render in a code font; keep them in Inter (tabular via .font-mono).
        mono: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // Bumped type scale (~+15%) — the whole app reads larger without touching
      // every className. [size, line-height].
      fontSize: {
        '2xs': ['0.75rem', '1rem'],      // 12 (was the [10px]/[11px] micro-labels)
        xs: ['0.8125rem', '1.15rem'],    // 13
        sm: ['0.9375rem', '1.35rem'],    // 15
        base: ['1.0625rem', '1.6rem'],   // 17
        lg: ['1.1875rem', '1.7rem'],     // 19
        xl: ['1.375rem', '1.9rem'],      // 22
        '2xl': ['1.625rem', '2.05rem'],  // 26
        '3xl': ['2rem', '2.35rem'],      // 32
        '4xl': ['2.5rem', '2.6rem'],     // 40
        '5xl': ['3.25rem', '1'],         // 52
      },
      boxShadow: {
        // Rounded, lit ivory body: tight contact + soft drop for depth, a bright
        // specular top edge, light/warm side bevels, and a warm bottom "thickness".
        tile: '0 1px 2px rgba(0,0,0,0.35), 0 4px 8px -2px rgba(0,0,0,0.45), inset 0 1.5px 0 rgba(255,255,255,0.85), inset 1px 0 0 rgba(255,255,255,0.25), inset -1px 0 0 rgba(120,95,55,0.22), inset 0 -3px 4px rgba(120,95,55,0.3)',
        'tile-up': '0 2px 4px rgba(0,0,0,0.35), 0 12px 22px -6px rgba(0,0,0,0.55), inset 0 1.5px 0 rgba(255,255,255,0.9), inset 0 -3px 4px rgba(120,95,55,0.32)',
      },
    },
  },
  plugins: [],
};
