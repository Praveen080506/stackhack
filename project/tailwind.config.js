export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        admin: {
          primary: '#1e40af',
          secondary: '#3b82f6',
          accent: '#60a5fa',
          dark: '#1e3a8a',
          light: '#dbeafe',
        },
        user: {
          primary: '#059669',
          secondary: '#10b981',
          accent: '#34d399',
          dark: '#047857',
          light: '#d1fae5',
        },
      },
    },
  },
  plugins: [],
}
