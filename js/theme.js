// ============================================================
// Night Mode / Theme Toggle logic
// - Persists choice in localStorage under 'fishmap-theme'
// - First visit respects prefers-color-scheme (no save until explicit toggle)
// - Swaps map tiles (weather icons adapt via CSS var(--icon-secondary) automatically)
// - Button icon updates (moon when in light, sun when in dark)
// ============================================================

function updateThemeToggle(isDark) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  // Show moon icon when currently light (clicking switches TO night)
  // Show sun icon when currently dark (clicking switches TO light)
  if (isDark) {
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>`;
    btn.setAttribute('aria-label', 'Switch to light mode');
  } else {
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
      </svg>`;
    btn.setAttribute('aria-label', 'Switch to night mode');
  }
}

// Single source of truth for theme changes.
// save=true persists the choice to localStorage (explicit user toggle);
// save=false applies without persisting (system-preference follow, init).
function applyTheme(theme, save) {
  const isDark = theme === 'dark';
  const htmlEl = document.documentElement;

  if (isDark) {
    htmlEl.classList.add('dark');
  } else {
    htmlEl.classList.remove('dark');
  }

  if (save) {
    localStorage.setItem('fishmap-theme', theme);
  }

  updateThemeToggle(isDark);

  // Swap map tiles for the new theme (markers use live getColorForType)
  updateMapTheme();
}

function toggleTheme() {
  const isCurrentlyDark = document.documentElement.classList.contains('dark');
  const newTheme = isCurrentlyDark ? 'light' : 'dark';
  applyTheme(newTheme, true);
}

function setupThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', toggleTheme);
  // Initial icon state (class already set by head script)
  const isDark = document.documentElement.classList.contains('dark');
  updateThemeToggle(isDark);
}

// If the user has NOT explicitly chosen a theme yet, follow live system preference changes.
// Once they toggle once, we save to localStorage and stop following system.
function setupSystemThemeListener() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  if (!localStorage.getItem('fishmap-theme')) {
    mediaQuery.addEventListener('change', (e) => {
      // Apply without saving (so next load still follows system until user decides)
      applyTheme(e.matches ? 'dark' : 'light', false);
    });
  }
}
