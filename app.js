/**
 * app.js - Main Application Controller
 * Vanilla JS ES Module Architecture
 * Handles Theme Switching (View Transitions API), Universal Visible Email UX (Clipboard + Toast + Webmail Links),
 * Command Palette (⌘K), Project Detail Drawer, Bento Grid, Lab Filtering/Search/Sort with FLIP,
 * GitHub API Badges, Animated Count-Up, Scroll Progress, and Pathfinder City Three.js Integration.
 */

document.addEventListener('DOMContentLoaded', async () => {
  let allProjects = [];

  // Load project dataset
  try {
    const res = await fetch('data/projects.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allProjects = await res.json();
  } catch (err) {
    console.error('Failed to load projects.json:', err);
    return;
  }

  // 1. Initialize Theme Switcher
  setupThemeToggle();

  // 2. Initialize Scroll Progress Bar
  setupScrollProgress();

  // 3. Render Bento Featured Work & Lab
  renderFeaturedWork(allProjects.filter(p => p.featured));
  const labProjects = allProjects.filter(p => !p.featured);
  renderLab(labProjects);
  setupLabControls(labProjects, allProjects);

  // 4. Initialize Project Detail Drawer & Hash Routing
  setupProjectDrawer(allProjects);

  // 5. Initialize Command Palette (⌘K)
  setupCommandPalette(allProjects);

  // 6. Universal Email Action Handlers
  setupEmailActionHandlers();

  // 7. Fetch GitHub Recently Updated Badges (Deferred until idle)
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => fetchGithubRepoUpdates(allProjects), { timeout: 8000 });
  } else {
    setTimeout(() => fetchGithubRepoUpdates(allProjects), 8000);
  }

  // 8. Init Pathfinder City Three.js Hero Visual via Dynamic Import
  const heroContainer = document.getElementById('hero-canvas-container');
  if (heroContainer) {
    let graphLoaded = false;
    const startGraph = () => {
      if (graphLoaded) return;
      graphLoaded = true;
      cleanup();
      import('./hero-graph.js')
        .then(({ initHeroGraph }) => {
          initHeroGraph(heroContainer);
        })
        .catch(err => {
          console.warn('Three.js hero graph dynamic load fallback:', err);
        });
    };

    const cleanup = () => {
      ['pointerdown', 'touchstart', 'scroll', 'keydown'].forEach(evt => {
        window.removeEventListener(evt, startGraph);
      });
    };

    ['pointerdown', 'touchstart', 'scroll', 'keydown'].forEach(evt => {
      window.addEventListener(evt, startGraph, { once: true, passive: true });
    });

    const isMobile = window.innerWidth <= 768;
    setTimeout(startGraph, isMobile ? 6500 : 600);
  }

  // 9. Setup Scroll Reveals & Active Nav Highlight
  setupScrollReveals();
  setupNavActiveObserver();

  // 10. Setup Hero Stats Count-Up Animation
  setupStatsCountUp(allProjects.length);

  // 11. Setup Magnetic Hover for Primary Buttons (Desktop only)
  setupMagneticButtons();

  // 12. Setup Mobile Nav Toggle
  setupMobileNav();

  // 13. Setup Back to Top Button
  setupBackToTop();
});

/* -------------------------------------------------------------------------- */
/* 1. THEME SWITCHER (View Transitions API Circular Reveal)                   */
/* -------------------------------------------------------------------------- */
function setupThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (!toggleBtn) return;

  const updateAria = (theme) => {
    toggleBtn.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
  };

  const initialTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  updateAria(initialTheme);

  toggleBtn.addEventListener('click', (event) => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';

    const applyTheme = () => {
      document.documentElement.setAttribute('data-theme', next);
      try {
        localStorage.setItem('theme', next);
      } catch (e) {}
      updateAria(next);
      window.dispatchEvent(new CustomEvent('themechanged', { detail: { theme: next } }));
    };

    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || isReduced) {
      applyTheme();
      return;
    }

    // Circular clip-path animation from button center
    const rect = toggleBtn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      applyTheme();
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`
          ]
        },
        {
          duration: 400,
          easing: 'ease-out',
          pseudoElement: '::view-transition-new(root)'
        }
      );
    });
  });
}

/* -------------------------------------------------------------------------- */
/* 2. SCROLL PROGRESS BAR                                                     */
/* -------------------------------------------------------------------------- */
function setupScrollProgress() {
  const progressBar = document.getElementById('scroll-progress');
  if (!progressBar) return;

  const updateProgress = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = `${progress}%`;
  };

  window.addEventListener('scroll', updateProgress, { passive: true });
}

/* -------------------------------------------------------------------------- */
/* 3. RENDER FEATURED WORK (BENTO GRID: 4 COLS DESKTOP)                       */
/* -------------------------------------------------------------------------- */
function renderFeaturedWork(featuredProjects) {
  const container = document.getElementById('featured-bento-container') || document.getElementById('featured-container');
  if (!container) return;

  container.innerHTML = featuredProjects.map((p) => {
    const techChips = (p.tech || []).slice(0, 3).map(t => `<span class="tech-chip">${escapeHtml(t)}</span>`).join('');

    if (p.id === 'softech') {
      return `
        <article class="bento-card bento-2x2 reveal" data-id="${p.id}">
          <div class="browser-frame">
            <div class="browser-header">
              <span class="browser-dot"></span>
              <span class="browser-dot"></span>
              <span class="browser-dot"></span>
              <span class="browser-url-pill">reachsoftech.onrender.com</span>
            </div>
            <img src="${p.image}" alt="Screenshot of ${escapeHtml(p.title)}" class="browser-img" width="1200" height="675" loading="lazy" />
          </div>
          <div class="bento-details">
            <div class="bento-meta">
              <span class="bento-num">01</span>
              <span class="bento-link-slide">Case study →</span>
            </div>
            <h3 class="bento-title"><a href="#project/${p.id}" class="bento-title-link">${escapeHtml(p.title)}</a></h3>
            <p class="bento-oneliner">${escapeHtml(p.oneLiner)}</p>
            <div class="bento-chips-row">${techChips}</div>
          </div>
        </article>
      `;
    }

    if (p.id === 'nammaroute') {
      return `
        <article class="bento-card bento-2x1 reveal" data-id="${p.id}">
          <div class="browser-frame">
            <div class="browser-header">
              <span class="browser-dot"></span>
              <span class="browser-dot"></span>
              <span class="browser-dot"></span>
              <span class="browser-url-pill">nammaroute-sigma.vercel.app</span>
            </div>
            <img src="${p.image}" alt="Screenshot of ${escapeHtml(p.title)}" class="browser-img" width="1200" height="675" loading="lazy" />
          </div>
          <div class="bento-details">
            <div class="bento-meta">
              <span class="bento-num">02</span>
              <span class="bento-link-slide">Case study →</span>
            </div>
            <h3 class="bento-title"><a href="#project/${p.id}" class="bento-title-link">${escapeHtml(p.title)}</a></h3>
            <p class="bento-oneliner">${escapeHtml(p.oneLiner)}</p>
            <div class="bento-chips-row">${techChips}</div>
          </div>
        </article>
      `;
    }

    if (p.id === 'schemasentinel') {
      return `
        <article class="bento-card bento-1x1 reveal" data-id="${p.id}">
          <div class="terminal-frame" aria-hidden="true">
            <div class="browser-header" style="background:transparent; border-bottom:1px solid rgba(255,255,255,0.06); margin:-14px -16px 12px; padding:6px 12px;">
              <span class="browser-dot"></span><span class="browser-dot"></span><span class="browser-dot"></span>
              <span class="browser-url-pill">sentinel v1.4</span>
            </div>
            <p><span class="terminal-prompt">$</span> sentinel verify --strict</p>
            <p class="terminal-success">✔ 24 schemas validated</p>
            <p class="terminal-success">✔ 0 breaking drift detected</p>
            <p class="terminal-muted">100% offline — zero egress</p>
          </div>
          <div class="bento-details">
            <div class="bento-meta">
              <span class="bento-num">03</span>
              <span class="bento-link-slide">Case study →</span>
            </div>
            <h3 class="bento-title"><a href="#project/${p.id}" class="bento-title-link">${escapeHtml(p.title)}</a></h3>
            <p class="bento-oneliner">${escapeHtml(p.oneLiner)}</p>
            <div class="bento-chips-row">${techChips}</div>
          </div>
        </article>
      `;
    }

    if (p.id === 'ledger') {
      return `
        <article class="bento-card bento-1x1 reveal" data-id="${p.id}">
          <div class="phone-mockup-frame" aria-hidden="true">
            <div class="phone-notch"></div>
            <img src="${p.image}" alt="Screenshot of ${escapeHtml(p.title)}" class="browser-img" width="1200" height="675" loading="lazy" />
          </div>
          <div class="bento-details">
            <div class="bento-meta">
              <span class="bento-num">04</span>
              <span class="bento-link-slide">Case study →</span>
            </div>
            <h3 class="bento-title"><a href="#project/${p.id}" class="bento-title-link">${escapeHtml(p.title)}</a></h3>
            <p class="bento-oneliner">${escapeHtml(p.oneLiner)}</p>
            <div class="bento-chips-row">${techChips}</div>
          </div>
        </article>
      `;
    }

    return '';
  }).join('');

  // Add click listeners to bento cards to open detail drawer
  container.querySelectorAll('.bento-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      if (id) {
        window.location.hash = `#project/${id}`;
      }
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
}

/* -------------------------------------------------------------------------- */
/* 4. RENDER LAB GRID                                                         */
/* -------------------------------------------------------------------------- */
function renderLab(labProjects) {
  const grid = document.getElementById('lab-grid');
  if (!grid) return;

  grid.innerHTML = labProjects.map(p => {
    const liveBtn = p.liveUrl 
      ? `<a href="${p.liveUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-sm" onclick="event.stopPropagation()" aria-label="Live demo: ${escapeHtml(p.title)}">Live →</a>` 
      : '';

    const codeBtn = p.codeUrl 
      ? `<a href="${p.codeUrl}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm" onclick="event.stopPropagation()" aria-label="Code repository: ${escapeHtml(p.title)}">Code</a>` 
      : '';

    return `
      <article class="lab-card reveal" id="project-${p.id}" data-id="${p.id}" data-category="${escapeHtml(p.category)}" data-title="${escapeHtml(p.title.toLowerCase())}" data-codeurl="${p.codeUrl || ''}">
        <div class="lab-card-thumb-wrapper">
          <img 
            src="${p.image}" 
            alt="Preview of ${escapeHtml(p.title)}" 
            width="600" 
            height="375" 
            loading="lazy" 
            class="lab-card-thumb"
          />
        </div>
        <div class="lab-card-body">
          <h3 class="lab-card-title"><a href="#project/${p.id}" class="lab-card-title-link">${escapeHtml(p.title)}</a></h3>
          <p class="lab-card-oneliner">${escapeHtml(p.oneLiner)}</p>
          <span class="lab-card-metric">${escapeHtml(p.metric)}</span>

          <div class="lab-card-actions">
            ${liveBtn}
            ${codeBtn}
          </div>
        </div>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('.lab-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      window.location.hash = `#project/${id}`;
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = card.getAttribute('data-id');
        window.location.hash = `#project/${id}`;
      }
    });
  });
}

/* -------------------------------------------------------------------------- */
/* 5. LAB SEARCH, FILTER & SORT (WITH FLIP ANIMATION)                         */
/* -------------------------------------------------------------------------- */
function setupLabControls(initialLabProjects, allProjects) {
  const searchInput = document.getElementById('lab-search-input');
  const clearSearchBtn = document.getElementById('btn-clear-search');
  const filterChips = document.querySelectorAll('.filter-chip');
  const sortSelect = document.getElementById('lab-sort-select');
  const countBadge = document.getElementById('lab-count-indicator');
  const emptyState = document.getElementById('lab-empty-state');
  const resetBtn = document.getElementById('btn-clear-lab');
  const grid = document.getElementById('lab-grid');

  if (!grid) return;

  let activeCategory = 'all';
  let searchQuery = '';
  let activeSort = 'featured';

  function applyFilters() {
    const cards = Array.from(grid.querySelectorAll('.lab-card'));
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // FLIP First state
    const firstRects = new Map();
    if (!isReduced) {
      cards.forEach(card => firstRects.set(card, card.getBoundingClientRect()));
    }

    let visibleCount = 0;

    cards.forEach(card => {
      const id = card.getAttribute('data-id');
      const project = allProjects.find(p => p.id === id);
      if (!project) return;

      const matchesCat = activeCategory === 'all' || project.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        project.title.toLowerCase().includes(q) ||
        project.oneLiner.toLowerCase().includes(q) ||
        project.metric.toLowerCase().includes(q) ||
        (project.tech || []).some(t => t.toLowerCase().includes(q));

      const isVisible = matchesCat && matchesSearch;
      card.style.display = isVisible ? 'flex' : 'none';
      if (isVisible) visibleCount++;
    });

    const visibleCards = cards.filter(card => card.style.display !== 'none');
    if (activeSort === 'az') {
      visibleCards.sort((a, b) => {
        const titleA = a.getAttribute('data-title') || '';
        const titleB = b.getAttribute('data-title') || '';
        return titleA.localeCompare(titleB);
      });
      visibleCards.forEach(card => grid.appendChild(card));
    } else if (activeSort === 'newest') {
      visibleCards.sort((a, b) => {
        const hasA = a.querySelector('.badge-updated') !== null;
        const hasB = b.querySelector('.badge-updated') !== null;
        return (hasB ? 1 : 0) - (hasA ? 1 : 0);
      });
      visibleCards.forEach(card => grid.appendChild(card));
    }

    if (countBadge) {
      countBadge.textContent = `Showing ${visibleCount} of ${initialLabProjects.length} projects`;
    }

    if (emptyState) {
      emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    if (!isReduced) {
      visibleCards.forEach(card => {
        const first = firstRects.get(card);
        if (first) {
          const last = card.getBoundingClientRect();
          const dx = first.left - last.left;
          const dy = first.top - last.top;
          if (dx !== 0 || dy !== 0) {
            card.style.transform = `translate(${dx}px, ${dy}px)`;
            card.style.transition = 'none';

            requestAnimationFrame(() => {
              card.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
              card.style.transform = 'none';
            });
          }
        }
      });
    }
  }

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      activeCategory = chip.getAttribute('data-filter') || 'all';
      filterChips.forEach(c => {
        const isActive = c === chip;
        c.classList.toggle('active', isActive);
        c.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      applyFilters();
    });
  });

  let searchDebounce;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (clearSearchBtn) clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(applyFilters, 100);
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      applyFilters();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeSort = e.target.value;
      applyFilters();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      activeCategory = 'all';
      searchQuery = '';
      activeSort = 'featured';
      if (searchInput) searchInput.value = '';
      if (clearSearchBtn) clearSearchBtn.style.display = 'none';
      if (sortSelect) sortSelect.value = 'featured';
      filterChips.forEach(c => {
        const isAll = c.getAttribute('data-filter') === 'all';
        c.classList.toggle('active', isAll);
        c.setAttribute('aria-selected', isAll ? 'true' : 'false');
      });
      applyFilters();
    });
  }
}

/* -------------------------------------------------------------------------- */
/* 6. UNIVERSAL EMAIL UX (COPY + 6S TOAST + GMAIL + OUTLOOK + HIDDEN MAILTO)   */
/* -------------------------------------------------------------------------- */
let emailToastTimer = null;

function fallbackCopy(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    ta.remove();
  } catch (e) {}
}

export function handleEmailClick(options = {}) {
  const email = 'pradeepbashaa@gmail.com';
  const subject = options.subject || 'SDE Role Opportunity — B Pradeep';
  const encodedSubject = encodeURIComponent(subject);

  // 1) Copy to clipboard
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).catch(() => {
        fallbackCopy(email);
      });
    } else {
      fallbackCopy(email);
    }
  } catch (e) {
    fallbackCopy(email);
  }

  // 2) Show toast for 6 seconds with action buttons
  showEmailActionToast(email, encodedSubject);

  // 3) Trigger mailto via hidden anchor
  try {
    const hiddenAnchor = document.createElement('a');
    hiddenAnchor.href = `mailto:${email}?subject=${encodedSubject}`;
    hiddenAnchor.style.display = 'none';
    document.body.appendChild(hiddenAnchor);
    hiddenAnchor.click();
    setTimeout(() => hiddenAnchor.remove(), 500);
  } catch (e) {}
}

function showEmailActionToast(email, encodedSubject) {
  let toast = document.getElementById('email-action-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'email-action-toast';
    toast.className = 'email-action-toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encodedSubject}`;
  const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${email}&subject=${encodedSubject}`;

  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-header-row">
        <span class="toast-dot"></span>
        <span class="toast-message toast-title">Email copied — <strong>${email}</strong></span>
        <button class="toast-close-btn" id="toast-close-btn" aria-label="Close notification">✕</button>
      </div>
      <div class="toast-actions">
        <a href="${gmailUrl}" target="_blank" rel="noopener" id="toast-gmail-btn" class="toast-btn toast-btn-primary">
          <span>Open Gmail</span>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
        <a href="${outlookUrl}" target="_blank" rel="noopener" id="toast-outlook-btn" class="toast-btn toast-btn-secondary">
          <span>Open Outlook</span>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
      </div>
    </div>
  `;

  toast.classList.add('visible');

  if (emailToastTimer) clearTimeout(emailToastTimer);

  const closeBtn = toast.querySelector('.toast-close-btn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      toast.classList.remove('visible');
    };
  }

  emailToastTimer = setTimeout(() => {
    toast.classList.remove('visible');
  }, 6000);
}

function setupEmailActionHandlers() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.email-action-btn, .contact-big-email');
    if (btn) {
      e.preventDefault();
      const subject = btn.getAttribute('data-subject') || 'SDE Role Opportunity — B Pradeep';
      handleEmailClick({ subject });
    }
  });
}

/* -------------------------------------------------------------------------- */
/* 7. PROJECT DETAIL DRAWER & DEEP LINK HASH ROUTING                          */
/* -------------------------------------------------------------------------- */
const BLOCKED_IFRAME_IDS = ['softech', 'schemasentinel'];

function setupProjectDrawer(allProjects) {
  const drawer = document.getElementById('project-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  const body = document.getElementById('drawer-body');
  const title = document.getElementById('drawer-title');
  const category = document.getElementById('drawer-category');
  const closeBtn = document.getElementById('drawer-close-btn');

  if (!drawer || !backdrop || !body) return;

  function openDrawer(projectId) {
    const p = allProjects.find(item => item.id === projectId);
    if (!p) return;

    if (title) title.textContent = p.title;
    if (category) category.textContent = `// ${p.category.toUpperCase()}`;

    const techChips = (p.tech || []).map(t => `<span class="tech-chip">${escapeHtml(t)}</span>`).join('');

    const liveBtn = p.liveUrl 
      ? `<a href="${p.liveUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">
           <span>Launch App</span>
           <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
         </a>` 
      : '';

    const codeBtn = p.codeUrl 
      ? `<a href="${p.codeUrl}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
           <span>Source Code</span>
           <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
         </a>` 
      : '';

    let contentHtml = '';
    if (p.featured && p.problem) {
      contentHtml = `
        <div class="drawer-case-breakdown">
          <div class="drawer-breakdown-item">
            <span class="breakdown-label">Problem</span>
            <p>${escapeHtml(p.problem)}</p>
          </div>
          <div class="drawer-breakdown-item">
            <span class="breakdown-label">What I Built</span>
            <p>${escapeHtml(p.built)}</p>
          </div>
          <div class="drawer-breakdown-item">
            <span class="breakdown-label">Result &amp; Impact</span>
            <p>${escapeHtml(p.result)}</p>
          </div>
        </div>
      `;
    } else {
      contentHtml = `
        <p class="drawer-oneliner">${escapeHtml(p.oneLiner)}</p>
        <div class="drawer-metric-box">
          <span class="metric-label">Key Metric</span>
          <p class="metric-val">${escapeHtml(p.metric)}</p>
        </div>
      `;
    }

    const canFrame = p.liveUrl && !BLOCKED_IFRAME_IDS.includes(p.id);
    let iframeHtml = '';
    if (canFrame) {
      iframeHtml = `
        <div class="drawer-preview-box">
          <div class="preview-header">
            <span>Interactive Live Sandbox</span>
            <a href="${p.liveUrl}" target="_blank" rel="noopener" class="preview-ext-link">Full Screen ↗</a>
          </div>
          <iframe 
            src="${p.liveUrl}" 
            title="Interactive preview of ${escapeHtml(p.title)}" 
            class="drawer-iframe" 
            loading="lazy" 
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          ></iframe>
        </div>
      `;
    }

    body.innerHTML = `
      <div class="drawer-media">
        <img src="${p.image}" alt="Screenshot of ${escapeHtml(p.title)}" class="drawer-img" width="1200" height="675" />
      </div>
      <div class="drawer-info-section">
        ${contentHtml}
        <div class="tech-stack-row" style="margin: 20px 0;">
          ${techChips}
        </div>
        <div class="drawer-actions">
          ${liveBtn}
          ${codeBtn}
        </div>
      </div>
      ${iframeHtml}
    `;

    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    drawer.removeAttribute('inert');
    document.body.style.overflow = 'hidden';

    if (closeBtn) closeBtn.focus();
  }

  function closeDrawer() {
    if (!drawer.classList.contains('open')) return;
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.setAttribute('inert', '');
    document.body.style.overflow = '';

    if (window.location.hash.startsWith('#project/')) {
      history.pushState(null, '', window.location.pathname + window.location.search);
    }
  }

  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });

  function handleHash() {
    const hash = window.location.hash;
    if (hash.startsWith('#project/')) {
      const id = hash.replace('#project/', '').trim();
      openDrawer(id);
    } else {
      closeDrawer();
    }
  }

  window.addEventListener('hashchange', handleHash);
  window.addEventListener('popstate', handleHash);

  if (window.location.hash.startsWith('#project/')) {
    setTimeout(handleHash, 100);
  }
}

/* -------------------------------------------------------------------------- */
/* 8. COMMAND PALETTE (⌘K / Ctrl+K)                                           */
/* -------------------------------------------------------------------------- */
function setupCommandPalette(allProjects) {
  const overlay = document.getElementById('palette-overlay');
  const input = document.getElementById('palette-input');
  const results = document.getElementById('palette-results');
  const navBtn = document.getElementById('nav-palette-btn');

  if (!overlay || !input || !results) return;

  const actions = [
    { title: 'Download Résumé', badge: 'Action', handler: () => window.open('assets/B_Pradeep_Resume.pdf', '_blank') },
    { title: 'Send Email', badge: 'Action', handler: () => handleEmailClick() },
    { title: 'Compose in Gmail', badge: 'Action', handler: () => window.open('https://mail.google.com/mail/?view=cm&fs=1&to=pradeepbashaa@gmail.com&su=SDE%20Role%20Opportunity%20%E2%80%94%20B%20Pradeep', '_blank') },
    { title: 'Compose in Outlook', badge: 'Action', handler: () => window.open('https://outlook.live.com/mail/0/deeplink/compose?to=pradeepbashaa@gmail.com&subject=SDE%20Role%20Opportunity%20%E2%80%94%20B%20Pradeep', '_blank') },
    { title: 'Copy Email Address', badge: 'Action', handler: () => { copyToClipboard('pradeepbashaa@gmail.com'); showEmailActionToast('pradeepbashaa@gmail.com', encodeURIComponent('SDE Role Opportunity — B Pradeep')); } },
    { title: 'Toggle Theme', badge: 'Action', handler: () => document.getElementById('theme-toggle-btn')?.click() },
    { title: 'Open GitHub Profile', badge: 'Link', handler: () => window.open('https://github.com/Pradeep-B28', '_blank') },
    { title: 'Open LinkedIn Profile', badge: 'Link', handler: () => window.open('https://www.linkedin.com/in/pradeepb-2k/', '_blank') },
    { title: 'Open LeetCode Profile', badge: 'Link', handler: () => window.open('https://leetcode.com/u/PradeepKrishB/', '_blank') }
  ];

  const sections = [
    { title: 'Go to Featured Work', hash: '#work' },
    { title: 'Go to Engineering Lab', hash: '#lab' },
    { title: 'Go to Experience & Timeline', hash: '#experience' },
    { title: 'Go to Skills & Architecture', hash: '#skills' },
    { title: 'Go to Contact Section', hash: '#contact' }
  ];

  let selectedIndex = 0;
  let currentItems = [];

  function openPalette() {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    input.value = '';
    renderPaletteResults('');
    input.focus();
  }

  function closePalette() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function renderPaletteResults(query) {
    const q = query.toLowerCase().trim();
    currentItems = [];

    const matchedActions = actions.filter(a => !q || a.title.toLowerCase().includes(q));
    const matchedSections = sections.filter(s => !q || s.title.toLowerCase().includes(q));
    const matchedProjects = allProjects.filter(p => !q || 
      p.title.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q) ||
      (p.tech || []).some(t => t.toLowerCase().includes(q))
    );

    let html = '';

    if (matchedActions.length > 0) {
      html += `<div class="palette-group-title" style="padding: 6px 12px; font-size: 11px; text-transform: uppercase; color: var(--muted); font-family: var(--font-mono);">Commands &amp; Actions</div>`;
      matchedActions.forEach(a => {
        const itemIdx = currentItems.length;
        currentItems.push({ type: 'action', data: a });
        html += `
          <div class="palette-item ${itemIdx === 0 ? 'active' : ''}" data-index="${itemIdx}">
            <div class="palette-item-left">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>${escapeHtml(a.title)}</span>
            </div>
            <span class="palette-item-badge">${a.badge}</span>
          </div>
        `;
      });
    }

    if (matchedSections.length > 0) {
      html += `<div class="palette-group-title" style="padding: 6px 12px; font-size: 11px; text-transform: uppercase; color: var(--muted); font-family: var(--font-mono);">Navigation</div>`;
      matchedSections.forEach(s => {
        const itemIdx = currentItems.length;
        currentItems.push({ type: 'section', data: s });
        html += `
          <div class="palette-item ${itemIdx === 0 ? 'active' : ''}" data-index="${itemIdx}">
            <div class="palette-item-left">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
              <span>${escapeHtml(s.title)}</span>
            </div>
            <span class="palette-item-badge">Jump</span>
          </div>
        `;
      });
    }

    if (matchedProjects.length > 0) {
      html += `<div class="palette-group-title" style="padding: 6px 12px; font-size: 11px; text-transform: uppercase; color: var(--muted); font-family: var(--font-mono);">Projects</div>`;
      matchedProjects.slice(0, 8).forEach(p => {
        const itemIdx = currentItems.length;
        currentItems.push({ type: 'project', data: p });
        html += `
          <div class="palette-item ${itemIdx === 0 ? 'active' : ''}" data-index="${itemIdx}">
            <div class="palette-item-left">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              <span>${escapeHtml(p.title)}</span>
            </div>
            <span class="palette-item-badge">${escapeHtml(p.category)}</span>
          </div>
        `;
      });
    }

    results.innerHTML = html || `<div style="padding: 24px; text-align: center; color: var(--muted); font-size: 13px;">No commands or projects found.</div>`;
    selectedIndex = 0;
  }

  function executeSelectedItem() {
    const item = currentItems[selectedIndex];
    if (!item) return;

    closePalette();
    if (item.type === 'action') {
      item.data.handler();
    } else if (item.type === 'section') {
      window.location.hash = item.data.hash;
    } else if (item.type === 'project') {
      window.location.hash = `#project/${item.data.id}`;
    }
  }

  // Keyboard Navigation
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (overlay.classList.contains('open')) {
        closePalette();
      } else {
        openPalette();
      }
      return;
    }

    if (!overlay.classList.contains('open')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentItems.length > 0) {
        selectedIndex = (selectedIndex + 1) % currentItems.length;
        updateSelectedHighlight();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentItems.length > 0) {
        selectedIndex = (selectedIndex - 1 + currentItems.length) % currentItems.length;
        updateSelectedHighlight();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeSelectedItem();
    }
  });

  function updateSelectedHighlight() {
    const items = results.querySelectorAll('.palette-item');
    items.forEach((it, idx) => {
      it.classList.toggle('active', idx === selectedIndex);
      if (idx === selectedIndex) {
        it.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  input.addEventListener('input', (e) => {
    renderPaletteResults(e.target.value);
  });

  results.addEventListener('click', (e) => {
    const it = e.target.closest('.palette-item');
    if (!it) return;
    selectedIndex = parseInt(it.getAttribute('data-index'), 10);
    executeSelectedItem();
  });

  if (navBtn) navBtn.addEventListener('click', openPalette);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePalette();
  });
}

/* -------------------------------------------------------------------------- */
/* 9. GITHUB REPO RECENT UPDATES API CALL (SessionStorage Cached)              */
/* -------------------------------------------------------------------------- */
async function fetchGithubRepoUpdates(allProjects) {
  const CACHE_KEY = 'gh_repo_updates_v2';
  const CACHE_TTL = 3600 * 1000;

  let repos = null;
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        repos = parsed.data;
      }
    }
  } catch (e) {}

  if (!repos) {
    try {
      const res = await fetch('https://api.github.com/users/Pradeep-B28/repos?per_page=100');
      if (res.ok) {
        repos = await res.json();
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: repos }));
        } catch (e) {}
      }
    } catch (e) {
      return;
    }
  }

  if (!Array.isArray(repos)) return;

  const updateMap = new Map();
  repos.forEach(r => {
    if (r.name && r.pushed_at) {
      updateMap.set(r.name.toLowerCase().replace(/[-_]/g, ''), new Date(r.pushed_at));
    }
  });

  document.querySelectorAll('.lab-card').forEach(card => {
    const codeUrl = card.getAttribute('data-codeurl') || '';
    if (!codeUrl || !codeUrl.includes('github.com/Pradeep-B28/')) return;

    const parts = codeUrl.split('/');
    const repoName = parts[parts.length - 1].toLowerCase().replace(/[-_]/g, '');

    const pushedDate = updateMap.get(repoName);
    if (pushedDate) {
      const diffMs = Date.now() - pushedDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let label = '';
      if (diffDays <= 1) label = 'Updated today';
      else if (diffDays < 30) label = `Updated ${diffDays}d ago`;
      else if (diffDays < 365) label = `Updated ${Math.floor(diffDays / 30)}mo ago`;
      else label = `Updated ${Math.floor(diffDays / 365)}y ago`;

      const titleEl = card.querySelector('.lab-card-title');
      if (titleEl && !titleEl.querySelector('.badge-updated')) {
        const badge = document.createElement('span');
        badge.className = 'badge-updated';
        badge.style.cssText = 'font-size:10px; font-family:var(--font-mono); color:var(--accent-text); background:var(--accent-muted); padding:2px 6px; border-radius:4px; margin-left:8px; font-weight:400;';
        badge.textContent = label;
        titleEl.appendChild(badge);
      }
    }
  });
}

/* -------------------------------------------------------------------------- */
/* 10. ANIMATED STATS COUNT-UP                                                */
/* -------------------------------------------------------------------------- */
function setupStatsCountUp(projectCount) {
  const statYears = document.getElementById('stat-years');
  const statTrained = document.getElementById('stat-trained');
  const statProjects = document.getElementById('stat-projects-count');

  const statsRow = document.querySelector('.proof-stats-grid');
  if (!statsRow) return;

  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth <= 768;
  if (isReduced || isMobile) return;

  let hasAnimated = false;

  const startAnimation = () => {
    if (hasAnimated) return;
    hasAnimated = true;
    animateNumber(statYears, 0, 4, 800, '+');
    animateNumber(statTrained, 0, 7500, 1000, '+');
    animateNumber(statProjects, 0, projectCount, 800, '');
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        startAnimation();
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  observer.observe(statsRow);
}

function animateNumber(element, start, end, duration, suffix = '') {
  if (!element) return;
  const startTime = performance.now();
  let lastVal = start;

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (end - start) * ease);

    if (current !== lastVal || progress >= 1) {
      lastVal = current;
      element.textContent = `${(progress >= 1 ? end : current).toLocaleString()}${suffix}`;
    }

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

/* -------------------------------------------------------------------------- */
/* 11. MAGNETIC BUTTON HOVER (Desktop only)                                   */
/* -------------------------------------------------------------------------- */
function setupMagneticButtons() {
  if (window.matchMedia('(hover: none) or (prefers-reduced-motion: reduce)').matches) return;

  const buttons = document.querySelectorAll('.magnetic-btn');
  buttons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

/* -------------------------------------------------------------------------- */
/* 12. SCROLL REVEALS & NAV ACTIVE OBSERVER                                   */
/* -------------------------------------------------------------------------- */
function setupScrollReveals() {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(el => observer.observe(el));
}

function setupNavActiveObserver() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(sec => observer.observe(sec));
}

/* -------------------------------------------------------------------------- */
/* 13. MOBILE NAV TOGGLE & BACK TO TOP                                        */
/* -------------------------------------------------------------------------- */
function setupMobileNav() {
  const toggle = document.getElementById('mobile-toggle');
  const links = document.getElementById('nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  links.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function setupBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (btn) {
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

/* -------------------------------------------------------------------------- */
/* 14. CLIPBOARD & UTILITIES                                                  */
/* -------------------------------------------------------------------------- */
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
