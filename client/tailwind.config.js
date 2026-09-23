/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          surface: 'var(--surface)',
          card: 'var(--surface-card)',
          elevated: 'var(--surface-elevated)',
          hover: 'var(--surface-hover)',
          primary: 'var(--text-primary)',
          muted: 'var(--text-muted)',
          subtle: 'var(--text-subtle)',
          accent: 'var(--accent)',
          'accent-hover': 'var(--accent-hover)',
          'accent-light': 'var(--accent-light)',
          border: 'var(--border)',
          'border-light': 'var(--border-light)',
          'border-accent': 'var(--border-accent)',
        },
        navy: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        }
      },
      boxShadow: {
        'theme-sm': '0 1px 3px 0 var(--shadow-color)',
        'theme-md': '0 4px 6px -1px var(--shadow-color), 0 2px 4px -2px var(--shadow-color)',
        'theme-lg': '0 10px 15px -3px var(--shadow-color), 0 4px 6px -4px var(--shadow-color)',
        'theme-xl': '0 20px 25px -5px var(--shadow-color), 0 8px 10px -6px var(--shadow-color)',
        'theme-accent': '0 10px 25px -5px var(--accent-shadow)',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        sans: ['Open Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
