// Apply the saved theme (or the device's) before the app draws, so a reload never flashes
// the wrong one. ThemeService keeps it in sync afterwards. A separate file rather than an
// inline <script>, so the server's Content-Security-Policy can forbid inline scripts.
(function () {
  var choice = 'system';
  try {
    choice = JSON.parse(localStorage.getItem('dialer.theme')) || 'system';
  } catch (e) {}
  if (choice !== 'light' && choice !== 'dark') {
    choice = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  document.documentElement.dataset.theme = choice;
})();
