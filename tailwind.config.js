/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        plum: { DEFAULT: '#5A0F47', 900: '#3D0A30', 700: '#5A0F47', 500: '#7E2A68', 100: '#F3E4EE' },
        magenta: { DEFAULT: '#C2186B', 600: '#A8125B', 100: '#FBE3EF' },
        cream: { DEFAULT: '#FBF3E7', 200: '#F4E6D2' },
        leaf: { DEFAULT: '#2F8F5B', 700: '#1F6B42', 100: '#E1F2E8' },
        coral: { DEFAULT: '#FE8E94', 100: '#FFE6E7' },
        ink: { DEFAULT: '#2A1424', soft: '#5C4756' },
      },
      fontFamily: {
        sans: ['Inter', '"Inter Fallback"', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: { xl2: '1.25rem' },
      boxShadow: { card: '0 1px 2px rgba(42,20,36,.06), 0 8px 24px rgba(42,20,36,.08)' },
    },
  },
  plugins: [],
}
