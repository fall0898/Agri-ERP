/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
          400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
          800: '#166534', 900: '#14532d', 950: '#052e16',
        },
        secondary: {
          50:  '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
          400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
          800: '#92400e', 900: '#78350f',
        },
        accent: {
          50:  '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a8a',
        },
        neutral: {
          50:  '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4', 300: '#d6d3d1',
          400: '#a8a29e', 500: '#78716c', 600: '#57534e', 700: '#44403c',
          800: '#292524', 900: '#1c1917', 950: '#0c0a09',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'card':         '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-md':      '0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
        'card-lg':      '0 12px 28px -4px rgb(0 0 0 / 0.10), 0 4px 8px -4px rgb(0 0 0 / 0.05)',
        'glow-green':   '0 0 24px -6px rgb(22 163 74 / 0.40)',
        'sidebar':      '4px 0 20px -4px rgb(0 0 0 / 0.20)',
        'dropdown':     '0 8px 24px -4px rgb(0 0 0 / 0.12), 0 2px 8px -2px rgb(0 0 0 / 0.06)',
      },
      animation: {
        'fade-in':       'fadeIn 0.2s ease-out',
        'fade-up':       'fadeUp 0.25s ease-out',
        'slide-in-left': 'slideInLeft 0.22s ease-out',
        'scale-in':      'scaleIn 0.15s ease-out',
        'shimmer':       'shimmer 1.8s infinite linear',
        'float':         'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:      { '0%': { opacity: '0' },                                          '100%': { opacity: '1' } },
        fadeUp:      { '0%': { opacity: '0', transform: 'translateY(10px)' },           '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInLeft: { '0%': { opacity: '0', transform: 'translateX(-14px)' },          '100%': { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:     { '0%': { opacity: '0', transform: 'scale(0.95)' },                '100%': { opacity: '1', transform: 'scale(1)' } },
        shimmer:     { '0%': { backgroundPosition: '-400% 0' },                         '100%': { backgroundPosition: '400% 0' } },
        float:       { '0%,100%': { transform: 'translateY(0px)' },                     '50%': { transform: 'translateY(-10px)' } },
      },
    },
  },
  plugins: [],
}
