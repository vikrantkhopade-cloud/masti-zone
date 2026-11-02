/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['Sora', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#eef4fb',
          100: '#d6e3f3',
          200: '#adc6e6',
          300: '#7c9fcf',
          400: '#4d75b0',
          500: '#2f5592',
          600: '#1f3f75',
          700: '#163061',
          800: '#0e224a',
          900: '#0a1a3a',
          950: '#050f26',
        },
        aqua: {
          50: '#ebfdff',
          100: '#cdf8fd',
          200: '#a1effa',
          300: '#62e1f4',
          400: '#22cbe6',
          500: '#08aecb',
          600: '#0a8bab',
          700: '#106f8a',
          800: '#165b71',
          900: '#174c60',
        },
        coral: { 400: '#ff8a6b', 500: '#ff6b47' },
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(10, 26, 58, 0.18)',
        glow: '0 12px 40px -8px rgba(8, 174, 203, 0.55)',
        card: '0 1px 2px rgba(10,26,58,0.04), 0 8px 24px -10px rgba(10,26,58,0.12)',
      },
      backgroundImage: {
        'aqua-gradient': 'linear-gradient(135deg, #22cbe6 0%, #08aecb 45%, #0a8bab 100%)',
        'navy-gradient': 'linear-gradient(160deg, #0a1a3a 0%, #0e224a 55%, #106f8a 130%)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        wave: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(16px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        wave: 'wave 18s linear infinite',
        'wave-slow': 'wave 28s linear infinite',
        'fade-up': 'fade-up .7s cubic-bezier(.2,.7,.2,1) both',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
