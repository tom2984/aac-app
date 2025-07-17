/** @type {import('tailwindcss').Config} */
module.exports = {
  // 👈--  include *every* place JSX lives in your monorepo
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    '../../packages/ui/**/*.{js,jsx,ts,tsx}',  // example shared package
  ],

  // NativeWind adds React-Native-safe defaults
  presets: [require('nativewind/preset')],
  theme: { extend: {} },
  plugins: [],
};
