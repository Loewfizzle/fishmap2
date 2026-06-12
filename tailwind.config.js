/** Tailwind is precompiled to tailwind.css (committed) so the site stays zero-build at deploy time.
 *  After changing any Tailwind classes in index.html, rebuild with: npm run build:css */
module.exports = {
  darkMode: 'class',
  content: ['./index.html'],
  theme: { extend: {} },
  plugins: [],
};
