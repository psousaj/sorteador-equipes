/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fredoka One"', 'cursive', 'sans-serif'],
        body: ['Nunito', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#F54E00',
          light: '#FF7A3D',
          dark: '#CC3D00',
        },
        team: {
          1: '#6C5CE7',
          2: '#00B894',
          3: '#FD79A8',
          4: '#FDCB6E',
          5: '#74B9FF',
          6: '#E17055',
          7: '#00CEC9',
          8: '#A29BFE',
        },
      },
      animation: {
        'bounce-in': 'bounceIn 0.5s ease-out',
        'flip': 'flip 0.6s ease-in-out',
        'pop': 'pop 0.3s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'confetti': 'confetti 1s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(180deg)' },
          '100%': { transform: 'rotateY(360deg)' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(-100px) rotate(720deg)', opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
