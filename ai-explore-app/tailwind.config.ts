import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'space-black': '#01010C',
        'space-white': '#EAE9F3',
        'space-blue': {
          default: '#3528CE',
          light: '#A69FEC',
        },
        'space-gray': '#C1BFD2',
      },
    },
  },
  plugins: [],
};
export default config;
