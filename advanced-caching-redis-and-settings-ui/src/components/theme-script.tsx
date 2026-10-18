// Runs before paint to avoid a light/dark flash. Reads the user's locally
// stored preference (falls back to system preference) and applies the
// `dark` class to <html> accordingly.
const THEME_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem('ph-theme');
    var isDark = stored === 'dark' || (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  } catch (e) {}
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
