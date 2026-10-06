/** Cấu hình Tailwind: build ra styles.css (xem HUONG-DAN.md) */
module.exports = {
  content: ['./index.html', './app.js'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4fc', 100: '#dbe7f8', 300: '#8fb0e3', 600: '#0d4792',
          700: '#0a3a78', 900: '#072a58', 950: '#051d3d'
        }
      }
    }
  }
};
