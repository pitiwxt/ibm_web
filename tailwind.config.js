/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#f0f4ff', 100: '#dbe4ff', 200: '#bac8ff', 300: '#91a7ff', 400: '#748ffc', 500: '#5c7cfa', 600: '#4c6ef5', 700: '#4263eb', 800: '#3b5bdb', 900: '#364fc7' },
        accent: { 400: '#f59e0b', 500: '#f97316', 600: '#ea580c' },
        surface: { 900: '#0a0a0f', 800: '#0f0f1a', 700: '#141428', 600: '#1a1a38' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'dice-reveal': 'diceReveal 0.6s ease-out',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 20px rgba(92,124,250,0.4)' }, '50%': { boxShadow: '0 0 40px rgba(92,124,250,0.8)' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        diceReveal: { '0%': { transform: 'scale(0.5) rotate(-10deg)', opacity: '0' }, '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' } },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};
