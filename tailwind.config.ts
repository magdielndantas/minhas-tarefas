import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Outfit', 'ui-sans-serif', 'sans-serif'],
        mono:    ['DM Mono', 'ui-monospace', 'monospace'],
        display: ['Syne', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        bg:       'var(--bg)',
        surface:  'var(--surface)',
        's2':     'var(--surface-2)',
        border:   'var(--border)',
        'border2':'var(--border-2)',
        tx:       'var(--text)',
        muted:    'var(--muted)',
        faint:    'var(--faint)',
        amber:    'var(--amber)',
        'amber-d':'var(--amber-dim)',
        hi:       'var(--red)',
        ok:       'var(--green)',
        accent:   'var(--violet)',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-in': 'slideIn 0.12s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: { from: { opacity: '0', transform: 'translateY(-4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}

export default config
