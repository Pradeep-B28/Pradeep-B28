/* ==========================================================================
   B PRADEEP - PORTFOLIO INTERACTIVITY & THEME ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // 1. LIGHT / DARK THEME CONTROLLER
  // --------------------------------------------------------------------------
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeColorMeta = document.getElementById('theme-color-meta');

  function getPreferredTheme() {
    const savedTheme = localStorage.getItem('pradeep_theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pradeep_theme', theme);
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', theme === 'dark' ? '#0D1117' : '#FFFFFF');
    }
    // Notify 3D canvas of theme change if active
    if (window.onPortfolioThemeChange) {
      window.onPortfolioThemeChange(theme);
    }
  }

  // Initial Theme Setup
  const currentTheme = getPreferredTheme();
  applyTheme(currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme');
      const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  }

  // Listen to OS theme changes
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (!localStorage.getItem('pradeep_theme')) {
      applyTheme(e.matches ? 'light' : 'dark');
    }
  });

  // --------------------------------------------------------------------------
  // 2. MOBILE NAVIGATION MENU
  // --------------------------------------------------------------------------
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinks = document.getElementById('nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });

    // Close mobile nav on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });
  }

  // --------------------------------------------------------------------------
  // 3. LAZY THREE.JS 3D HERO INITIALIZATION
  // --------------------------------------------------------------------------
  function checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasWebGL = checkWebGLSupport();

  // If reduced motion is requested or no WebGL, keep static SVG fallback
  if (!prefersReducedMotion && hasWebGL) {
    // Lazy-load after first paint to optimize initial mobile paint time
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        if (window.initLattice3D) window.initLattice3D();
      });
    } else {
      setTimeout(() => {
        if (window.initLattice3D) window.initLattice3D();
      }, 100);
    }
  }
});
