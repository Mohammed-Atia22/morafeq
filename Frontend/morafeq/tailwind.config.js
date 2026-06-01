/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        tajawal: ['Tajawal', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1a56db',
          700: '#1240a8',
          800: '#1e3a8a',
          900: '#1e2e6e',
        },
        accent: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, rgba(10,40,120,0.88) 0%, rgba(26,86,219,0.75) 50%, rgba(10,40,100,0.82) 100%)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.7s ease forwards',
        'fade-in': 'fadeIn 0.5s ease forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      boxShadow: {
        'card':    '0 4px 20px rgba(26, 86, 219, 0.08)',
        'card-lg': '0 12px 40px rgba(26, 86, 219, 0.15)',
        'hero':    '0 20px 60px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
}