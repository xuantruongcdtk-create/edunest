/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:    { DEFAULT: '#1D9E75', dark: '#168a63', darker: '#0f7452', light: '#e6f7f2' },
        accent:     { DEFAULT: '#534AB7', dark: '#453d99' },
        warning:    { DEFAULT: '#BA7517', dark: '#9a6112', light: '#fef3e2' },
        danger:     { DEFAULT: '#E24B4A', dark: '#c73f3e' },
        success:    { DEFAULT: '#639922' },
        'bgh-blue': { DEFAULT: '#185FA5', dark: '#124e8a' },
      },
      fontFamily: {
        display: ['Nunito', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        card:  '12px',
        btn:   '20px',
        input: '8px',
        chip:  '20px',
      },
      boxShadow: {
        card:         '0 1px 4px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 16px 0 rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
      },
      keyframes: {
        'fade-in':  { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'count-up': { from: { opacity: '0', transform: 'scale(0.9)' }, to: { opacity: '1', transform: 'scale(1)' } },
      },
      animation: {
        'fade-in':  'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'count-up': 'count-up 0.8s ease-out',
      },
    },
  },
  plugins: [],
}
