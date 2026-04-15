// ===== Theme Toggle =====
// Dark/light mode with localStorage persistence.

import { getState, setState } from '../state.js';

/**
 * Initialize the theme toggle button and apply saved theme.
 */
export function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  const html = document.documentElement;

  // Apply saved theme on load
  const savedTheme = getState('theme');
  html.setAttribute('data-theme', savedTheme);

  btn.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';

    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setState({ theme: next });
  });
}
