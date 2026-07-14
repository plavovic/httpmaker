import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#050816',
        mist: '#f4f4f4',
      },
      boxShadow: {
        soft: '0 20px 50px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
} satisfies Config;
