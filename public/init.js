// Runs before first paint (loaded as a blocking, same-origin script so the CSP needs no inline hashes).
(function () {
  var root = document.documentElement;
  try {
    var theme = localStorage.getItem('theme');
    if (!theme) theme = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    root.dataset.theme = theme;
  } catch (e) {}
  // Home page only (data-intro): flag the smoke intro on the first visit of the session.
  var self = document.currentScript;
  if (self && self.dataset.intro) {
    try {
      if (!sessionStorage.getItem('intro') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        root.classList.add('intro');
        sessionStorage.setItem('intro', '1');
      }
    } catch (e) {}
  }
})();
