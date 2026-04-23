/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        koda: {
          purple: '#7B61FF',
          'purple-hover': '#6344E3',
          'purple-dark': '#4F2EE3',
          'purple-light': '#CABEFF',
          'purple-pastel': '#EDE8FF',
          'purple-ghost': '#F8F6FF',
          black: '#0A0A0A',
          'black-soft': '#1E1B2E',
          'gray-purple': '#6B667C',
          'gray-light': '#A19FB0',
          background: '#FAF9FE',
          hover: '#F0EDFF',
          border: '#E2DDF5',
          'border-soft': '#F0EEF8',
          error: '#FF4D6D',
          warning: '#FFB800',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'display': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'title': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'subtitle': ['1.125rem', { lineHeight: '1.4', fontWeight: '500' }],
        'body': ['0.9375rem', { lineHeight: '1.5' }],
        'caption': ['0.8125rem', { lineHeight: '1.4' }],
        'tiny': ['0.75rem', { lineHeight: '1.3' }],
      },
      borderRadius: {
        '2xl': '1rem',
        'xl': '0.75rem',
        'lg': '0.625rem',
        'md': '0.5rem',
        'sm': '0.375rem',
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(123, 97, 255, 0.04), 0 1px 2px rgba(10, 10, 10, 0.06)',
        'card': '0 4px 24px rgba(123, 97, 255, 0.06), 0 1px 2px rgba(10, 10, 10, 0.04)',
        'card-hover': '0 8px 32px rgba(123, 97, 255, 0.1), 0 2px 4px rgba(10, 10, 10, 0.06)',
        'dropdown': '0 10px 40px rgba(10, 10, 10, 0.12)',
        'glow': '0 0 20px rgba(123, 97, 255, 0.3)',
        'glow-sm': '0 0 12px rgba(123, 97, 255, 0.2)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'fade-up': 'fadeUp 0.4s ease-out forwards',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
        'slide-in-right': 'slideInRight 0.3s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'marquee': 'marquee 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(123, 97, 255, 0.2)' },
          '50%': { boxShadow: '0 0 24px rgba(123, 97, 255, 0.4)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
