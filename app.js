/**
 * app.js - Main Application Controller
 * Vanilla JS ES Module Architecture
 * Handles Theme Switching (View Transitions API), Email Popover Menu,
 * Web3Forms Contact Form, Command Palette (⌘K), Project Detail Drawer,
 * Lab Filtering/Search/Sort with FLIP, GitHub API Badges, Animated Count-Up,
 * Scroll Progress, Magnetic Buttons, and Diwali Sky "HIRED?" Easter Egg.
 */

import { initHeroGraph } from './hero-graph.js';

// Configuration Constant for Web3Forms
// Rule: Until this is set (not "TODO"), hide form and show only popover options
const WEB3FORMS_KEY = "TODO";

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

  // 3. Render Featured Work & Lab
  renderFeaturedWork(allProjects.filter(p => p.featured));
  const labProjects = allProjects.filter(p => !p.featured);
  renderLab(labProjects);
  setupLabControls(labProjects, allProjects);

  // 4. Initialize Project Detail Drawer & Hash Routing
  setupProjectDrawer(allProjects);

  // 5. Initialize Command Palette (⌘K)
  setupCommandPalette(allProjects);

  // 6. Initialize Email Popover Menu
  setupEmailPopover();

  // 7. Initialize Web3Forms Contact Form
  setupContactForm();

  // 8. Fetch GitHub Recently Updated Badges (Cached in sessionStorage)
  fetchGithubRepoUpdates(allProjects);

  // 9. Lazy-init Three.js Hero Graph
  const heroContainer = document.getElementById('hero-canvas-container');
  if (heroContainer) {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => initHeroGraph(heroContainer, allProjects));
    } else {
      setTimeout(() => initHeroGraph(heroContainer, allProjects), 150);
    }
  }

  // 10. Setup Scroll Reveals & Active Nav Highlight
  setupScrollReveals();
  setupNavActiveObserver();

  // 11. Setup Hero Stats Count-Up Animation
  setupStatsCountUp(allProjects.length);

  // 12. Setup Magnetic Hover for Primary Buttons (Desktop only)
  setupMagneticButtons();

  // 13. Setup Easter Egg ("hire" -> amber particle burst)
  setupEasterEgg();

  // 14. Setup Copy Email Button in Contact section
  setupCopyEmailButtons();

  // 15. Setup Mobile Nav Toggle
  setupMobileNav();

  // 16. Setup Back to Top Button
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
/* 3. EMAIL POPOVER MENU (Reused for all "Email me" buttons)                  */
/* -------------------------------------------------------------------------- */
function setupEmailPopover() {
  const popover = document.getElementById('email-popover');
  const popoverClose = document.getElementById('email-popover-close');
  const popoverMailApp = document.getElementById('popover-mail-app');
  const popoverGmail = document.getElementById('popover-gmail');
  const popoverCopy = document.getElementById('popover-copy');

  if (!popover) return;

  let activeTrigger = null;

  function openPopover(triggerBtn) {
    activeTrigger = triggerBtn;
    const subject = triggerBtn.getAttribute('data-subject') || 'SDE Role Opportunity — B Pradeep';
    const encodedSubject = encodeURIComponent(subject);

    if (popoverMailApp) {
      popoverMailApp.href = `mailto:pradeepbashaa@gmail.com?subject=${encodedSubject}`;
    }
    if (popoverGmail) {
      popoverGmail.href = `https://mail.google.com/mail/?view=cm&fs=1&to=pradeepbashaa@gmail.com&su=${encodedSubject}`;
    }

    // Position popover near trigger button with viewport bounds
    const rect = triggerBtn.getBoundingClientRect();
    const popoverWidth = 290;
    let left = rect.left + window.scrollX;
    let top = rect.bottom + window.scrollY + 8;

    if (left + popoverWidth > window.innerWidth - 16) {
      left = window.innerWidth - popoverWidth - 16;
    }
    if (left < 16) left = 16;

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
    popover.classList.add('open');
    popover.setAttribute('aria-hidden', 'false');
    triggerBtn.setAttribute('aria-expanded', 'true');

    // Focus first interactive option
    if (popoverMailApp) popoverMailApp.focus();
  }

  function closePopover() {
    if (!popover.classList.contains('open')) return;
    popover.classList.remove('open');
    popover.setAttribute('aria-hidden', 'true');
    if (activeTrigger) {
      activeTrigger.setAttribute('aria-expanded', 'false');
      activeTrigger.focus();
      activeTrigger = null;
    }
  }

  // Attach to all buttons with .btn-email-popover
  document.querySelectorAll('.btn-email-popover').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (popover.classList.contains('open') && activeTrigger === btn) {
        closePopover();
      } else {
        openPopover(btn);
      }
    });
  });

  if (popoverClose) {
    popoverClose.addEventListener('click', closePopover);
  }

  if (popoverCopy) {
    popoverCopy.addEventListener('click', () => {
      copyToClipboard('pradeepbashaa@gmail.com');
      showToast('Email address copied: pradeepbashaa@gmail.com');
      closePopover();
    });
  }

  // Keyboard accessibility
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popover.classList.contains('open')) {
      closePopover();
    }
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (popover.classList.contains('open') && !popover.contains(e.target) && !e.target.closest('.btn-email-popover')) {
      closePopover();
    }
  });
}

/* -------------------------------------------------------------------------- */
/* 4. WEB3FORMS CONTACT FORM                                                  */
/* -------------------------------------------------------------------------- */
function setupContactForm() {
  const formBox = document.getElementById('contact-form-box');
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('form-status');
  const submitBtn = document.getElementById('form-submit-btn');

  if (!formBox) return;

  // Strict rule: Until key is set, hide form and show only popover options
  if (WEB3FORMS_KEY === "TODO" || !WEB3FORMS_KEY.trim()) {
    formBox.style.display = 'none';
    return;
  }

  // Key is provided, reveal form
  formBox.style.display = 'block';

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    formData.append('access_key', WEB3FORMS_KEY);

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Sending...</span>';
    statusEl.className = 'form-status';
    statusEl.textContent = '';

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        statusEl.className = 'form-status success';
        statusEl.textContent = 'Message sent successfully! I will get back to you within 24 hours.';
        form.reset();
      } else {
        throw new Error(data.message || 'Submission failed');
      }
    } catch (err) {
      statusEl.className = 'form-status error';
      statusEl.textContent = 'Failed to deliver message. Please reach out directly to pradeepbashaa@gmail.com.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Send message</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
    }
  });
}

/* -------------------------------------------------------------------------- */
/* 5. RENDER FEATURED WORK                                                    */
/* -------------------------------------------------------------------------- */
function renderFeaturedWork(featuredProjects) {
  const container = document.getElementById('featured-container');
  if (!container) return;

  container.innerHTML = featuredProjects.map((p, idx) => {
    const isEven = idx % 2 === 1;
    const techChips = (p.tech || []).slice(0, 3).map(t => `<span class="tech-chip">${escapeHtml(t)}</span>`).join('');

    const liveBtn = p.liveUrl 
      ? `<a href="${p.liveUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-sm" onclick="event.stopPropagation()">
           <span>Live Platform</span>
           <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
         </a>` 
      : '';

    const codeBtn = p.codeUrl 
      ? `<a href="${p.codeUrl}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm" onclick="event.stopPropagation()">
           <span>Source Code</span>
           <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
         </a>` 
      : '';

    return `
      <article class="featured-case-row ${isEven ? 'row-reversed' : ''} reveal" id="project-${p.id}" data-id="${p.id}" tabindex="0" role="button" aria-label="View details for ${escapeHtml(p.title)}">
        <div class="featured-media-wrapper">
          <img 
            src="${p.image}" 
            alt="Screenshot of ${escapeHtml(p.title)}" 
            width="1200" 
            height="675" 
            loading="lazy" 
            class="featured-img"
          />
        </div>
        <div class="featured-details">
          <div class="featured-header-meta">
            <span class="category-tag">// ${escapeHtml(p.category.toUpperCase())}</span>
            <span class="proof-metric">${escapeHtml(p.metric)}</span>
          </div>
          <h3 class="featured-title">${escapeHtml(p.title)}</h3>
          <p class="featured-oneliner">${escapeHtml(p.oneLiner)}</p>

          <div class="case-study-breakdown">
            <div class="breakdown-item">
              <span class="breakdown-label">Problem</span>
              <p class="breakdown-text">${escapeHtml(p.problem || '')}</p>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">What I built</span>
              <p class="breakdown-text">${escapeHtml(p.built || '')}</p>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">Result</span>
              <p class="breakdown-text">${escapeHtml(p.result || '')}</p>
            </div>
          </div>

          <div class="tech-stack-row">
            ${techChips}
          </div>

          <div class="case-actions">
            ${liveBtn}
            ${codeBtn}
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Card click triggers drawer
  container.querySelectorAll('.featured-case-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.getAttribute('data-id');
      window.location.hash = `#project/${id}`;
    });
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = row.getAttribute('data-id');
        window.location.hash = `#project/${id}`;
      }
    });
  });
}

/* -------------------------------------------------------------------------- */
/* 6. RENDER LAB GRID                                                         */
/* -------------------------------------------------------------------------- */
function renderLab(labProjects) {
  const grid = document.getElementById('lab-grid');
  if (!grid) return;

  grid.innerHTML = labProjects.map(p => {
    const techChips = (p.tech || []).slice(0, 3).map(t => `<span class="tech-chip">${escapeHtml(t)}</span>`).join('');

    const liveBtn = p.liveUrl 
      ? `<a href="${p.liveUrl}" target="_blank" rel="noopener" class="card-link" onclick="event.stopPropagation()" aria-label="Launch ${escapeHtml(p.title)}">Live →</a>` 
      : '';

    const codeBtn = p.codeUrl 
      ? `<a href="${p.codeUrl}" target="_blank" rel="noopener" class="card-link card-link-muted" onclick="event.stopPropagation()" aria-label="Source code for ${escapeHtml(p.title)}">Code</a>` 
      : '';

    return `
      <article class="lab-card reveal" id="project-${p.id}" data-id="${p.id}" data-category="${escapeHtml(p.category)}" data-title="${escapeHtml(p.title.toLowerCase())}" data-codeurl="${p.codeUrl || ''}" tabindex="0" role="button" aria-label="View details for ${escapeHtml(p.title)}">
        <div class="lab-card-media">
          <img 
            src="${p.image}" 
            alt="Preview of ${escapeHtml(p.title)}" 
            width="600" 
            height="338" 
            loading="lazy" 
            class="lab-img"
          />
          <span class="lab-category-badge">${escapeHtml(p.category)}</span>
        </div>
        <div class="lab-card-body">
          <h3 class="lab-card-title">${escapeHtml(p.title)}</h3>
          <p class="lab-card-desc">${escapeHtml(p.oneLiner)}</p>

          <div class="lab-card-metric">
            <span class="metric-dot"></span>
            <span>${escapeHtml(p.metric)}</span>
          </div>

          <div class="tech-stack-row">
            ${techChips}
          </div>

          <div class="lab-card-footer">
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
/* 7. LAB CONTROLS (Search, Filters, Sort, FLIP Animation)                    */
/* -------------------------------------------------------------------------- */
function setupLabControls(initialLabProjects, allProjects) {
  const searchInput = document.getElementById('lab-search');
  const sortSelect = document.getElementById('lab-sort');
  const countBadge = document.getElementById('lab-count-badge');
  const emptyState = document.getElementById('lab-empty-state');
  const resetBtn = document.getElementById('btn-clear-lab');
  const filterChips = document.querySelectorAll('.filter-bar .filter-chip');
  const grid = document.getElementById('lab-grid');

  let activeCategory = 'All';
  let searchQuery = '';
  let activeSort = 'default';

  function applyFilters() {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cards = Array.from(grid.querySelectorAll('.lab-card'));

    // Record First bounding rects for FLIP
    const firstRects = new Map();
    if (!isReduced) {
      cards.forEach(card => {
        if (card.style.display !== 'none') {
          firstRects.set(card, card.getBoundingClientRect());
        }
      });
    }

    let visibleCount = 0;

    // Filter cards
    cards.forEach(card => {
      const id = card.getAttribute('data-id');
      const project = allProjects.find(p => p.id === id);
      if (!project) return;

      const matchesCat = activeCategory === 'All' || project.category === activeCategory;
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

    // Sort visible cards
    const visibleCards = cards.filter(card => card.style.display !== 'none');
    if (activeSort === 'az') {
      visibleCards.sort((a, b) => {
        const titleA = a.getAttribute('data-title') || '';
        const titleB = b.getAttribute('data-title') || '';
        return titleA.localeCompare(titleB);
      });
      visibleCards.forEach(card => grid.appendChild(card));
    } else if (activeSort === 'newest') {
      // Sort by recent badge or id
      visibleCards.sort((a, b) => {
        const hasA = a.querySelector('.badge-updated') !== null;
        const hasB = b.querySelector('.badge-updated') !== null;
        return (hasB ? 1 : 0) - (hasA ? 1 : 0);
      });
      visibleCards.forEach(card => grid.appendChild(card));
    }

    // Update Result Count Badge
    if (countBadge) {
      countBadge.textContent = `Showing ${visibleCount} of ${initialLabProjects.length} projects`;
    }

    // Toggle Empty State
    if (emptyState) {
      emptyState.classList.toggle('hidden', visibleCount > 0);
    }

    // Execute FLIP Animation
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

  // Filter Chips Listeners
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      activeCategory = chip.getAttribute('data-filter') || 'All';
      filterChips.forEach(c => {
        const isActive = c === chip;
        c.classList.toggle('active', isActive);
        c.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      applyFilters();
    });
  });

  // Search Input Listener (Debounced)
  let searchDebounce;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        searchQuery = e.target.value;
        applyFilters();
      }, 100);
    });
  }

  // Sort Dropdown Listener
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeSort = e.target.value;
      applyFilters();
    });
  }

  // Reset Filters Button
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      activeCategory = 'All';
      searchQuery = '';
      activeSort = 'default';
      if (searchInput) searchInput.value = '';
      if (sortSelect) sortSelect.value = 'default';
      filterChips.forEach(c => {
        const isAll = c.getAttribute('data-filter') === 'All';
        c.classList.toggle('active', isAll);
        c.setAttribute('aria-selected', isAll ? 'true' : 'false');
      });
      applyFilters();
    });
  }
}

/* -------------------------------------------------------------------------- */
/* 8. PROJECT DETAIL DRAWER & DEEP LINKING (#project/<id>)                    */
/* -------------------------------------------------------------------------- */
function setupProjectDrawer(allProjects) {
  const backdrop = document.getElementById('drawer-backdrop');
  const drawer = document.getElementById('project-drawer');
  const closeBtn = document.getElementById('drawer-close-btn');
  const categoryEl = document.getElementById('drawer-category');
  const titleEl = document.getElementById('drawer-title');
  const bodyEl = document.getElementById('drawer-body');

  if (!drawer || !backdrop) return;

  function openDrawer(projectId) {
    const project = allProjects.find(p => p.id === projectId);
    if (!project) return;

    if (categoryEl) categoryEl.textContent = `// ${project.category.toUpperCase()}`;
    if (titleEl) titleEl.textContent = project.title;

    const techChips = (project.tech || []).map(t => `<span class="tech-chip">${escapeHtml(t)}</span>`).join('');

    let breakdownHtml = '';
    if (project.featured) {
      breakdownHtml = `
        <div class="case-study-breakdown">
          <div class="breakdown-item">
            <span class="breakdown-label">Problem</span>
            <p class="breakdown-text">${escapeHtml(project.problem || '')}</p>
          </div>
          <div class="breakdown-item">
            <span class="breakdown-label">What I built</span>
            <p class="breakdown-text">${escapeHtml(project.built || '')}</p>
          </div>
          <div class="breakdown-item">
            <span class="breakdown-label">Result</span>
            <p class="breakdown-text">${escapeHtml(project.result || '')}</p>
          </div>
        </div>
      `;
    } else {
      breakdownHtml = `
        <p class="drawer-desc" style="font-size: 15px; color: var(--muted); line-height: 1.6; margin-bottom: 16px;">
          ${escapeHtml(project.oneLiner)}
        </p>
        <div class="drawer-metric-box" style="margin-bottom: 20px;">
          <strong style="color: var(--accent-text);">Proof metric:</strong> ${escapeHtml(project.metric)}
        </div>
      `;
    }

    const liveBtn = project.liveUrl
      ? `<a href="${project.liveUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">
           <span>Launch Live App</span>
           <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
         </a>`
      : '';

    const codeBtn = project.codeUrl
      ? `<a href="${project.codeUrl}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
           <span>Source Code</span>
           <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
         </a>`
      : '';

    // "Try it here" Sandboxed Iframe (Hidden if app blocks framing)
    let iframeHtml = '';
    if (project.liveUrl && project.allowsFraming) {
      iframeHtml = `
        <div class="drawer-iframe-container">
          <div class="drawer-iframe-header">
            <span class="drawer-section-title">Try it here</span>
            <a href="${project.liveUrl}" target="_blank" rel="noopener" class="card-link" style="font-size: 12px;">Open full screen ↗</a>
          </div>
          <iframe 
            class="drawer-iframe" 
            src="${project.liveUrl}" 
            sandbox="allow-scripts allow-same-origin allow-forms" 
            loading="lazy" 
            title="${escapeHtml(project.title)} interactive preview"
          ></iframe>
        </div>
      `;
    }

    bodyEl.innerHTML = `
      <img src="${project.image}" alt="Preview of ${escapeHtml(project.title)}" width="1200" height="675" class="drawer-img" />
      ${breakdownHtml}
      <div class="drawer-stack-group" style="margin-bottom: 20px;">
        <span class="drawer-section-title">Technology Stack</span>
        <div class="tech-stack-row" style="margin-top: 8px;">
          ${techChips}
        </div>
      </div>
      <div class="drawer-actions-row">
        ${liveBtn}
        ${codeBtn}
      </div>
      ${iframeHtml}
    `;

    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (closeBtn) closeBtn.focus();
  }

  function closeDrawer() {
    if (!drawer.classList.contains('open')) return;
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Revert hash if it points to a project
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

  // Deep Link Routing on hash change and page load
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

  // Check initial hash on page load
  if (window.location.hash.startsWith('#project/')) {
    setTimeout(handleHash, 100);
  }
}

/* -------------------------------------------------------------------------- */
/* 9. COMMAND PALETTE (⌘K / Ctrl+K)                                           */
/* -------------------------------------------------------------------------- */
function setupCommandPalette(allProjects) {
  const overlay = document.getElementById('palette-overlay');
  const input = document.getElementById('palette-input');
  const results = document.getElementById('palette-results');
  const navBtn = document.getElementById('nav-palette-btn');

  if (!overlay || !input || !results) return;

  const actions = [
    { title: 'Toggle Theme', badge: 'Action', handler: () => document.getElementById('theme-toggle-btn')?.click() },
    { title: 'Copy Email Address', badge: 'Action', handler: () => { copyToClipboard('pradeepbashaa@gmail.com'); showToast('Email copied: pradeepbashaa@gmail.com'); } },
    { title: 'Compose in Gmail', badge: 'Action', handler: () => window.open('https://mail.google.com/mail/?view=cm&fs=1&to=pradeepbashaa@gmail.com&su=SDE%20Role%20Opportunity%20%E2%80%94%20B%20Pradeep', '_blank') },
    { title: 'Open GitHub Profile', badge: 'Link', handler: () => window.open('https://github.com/Pradeep-B28', '_blank') },
    { title: 'Open LinkedIn Profile', badge: 'Link', handler: () => window.open('https://www.linkedin.com/in/pradeepb-2k/', '_blank') },
    { title: 'Open LeetCode Profile', badge: 'Link', handler: () => window.open('https://leetcode.com/u/PradeepKrishB/', '_blank') }
  ];

  const sections = [
    { title: 'Go to Featured Work', hash: '#work' },
    { title: 'Go to Engineering Lab', hash: '#lab' },
    { title: 'Go to Experience & Timeline', hash: '#experience' },
    { title: 'Go to Core Specialization Skills', hash: '#skills' },
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

    // Filter Actions
    const matchedActions = actions.filter(a => !q || a.title.toLowerCase().includes(q));
    // Filter Sections
    const matchedSections = sections.filter(s => !q || s.title.toLowerCase().includes(q));
    // Filter Projects
    const matchedProjects = allProjects.filter(p => !q || 
      p.title.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q) ||
      (p.tech || []).some(t => t.toLowerCase().includes(q))
    );

    let html = '';

    if (matchedActions.length > 0) {
      html += `<div class="palette-group-title">Commands &amp; Actions</div>`;
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
      html += `<div class="palette-group-title">Navigation</div>`;
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
      html += `<div class="palette-group-title">Projects (${matchedProjects.length})</div>`;
      matchedProjects.forEach(p => {
        const itemIdx = currentItems.length;
        currentItems.push({ type: 'project', data: p });
        html += `
          <div class="palette-item ${itemIdx === 0 ? 'active' : ''}" data-index="${itemIdx}">
            <div class="palette-item-left">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              <span>${escapeHtml(p.title)}</span>
            </div>
            <span class="palette-item-badge">${escapeHtml(p.category)}</span>
          </div>
        `;
      });
    }

    if (currentItems.length === 0) {
      html = `<div class="palette-empty">No results found for "${escapeHtml(query)}"</div>`;
    }

    results.innerHTML = html;
    selectedIndex = 0;
    highlightItem(0);

    // Click handler for rendered items
    results.querySelectorAll('.palette-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.getAttribute('data-index'), 10);
        executeItem(idx);
      });
    });
  }

  function highlightItem(index) {
    const items = results.querySelectorAll('.palette-item');
    items.forEach((item, i) => {
      item.classList.toggle('active', i === index);
      if (i === index) {
        item.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  function executeItem(index) {
    if (!currentItems[index]) return;
    const item = currentItems[index];

    closePalette();

    if (item.type === 'action') {
      item.data.handler();
    } else if (item.type === 'section') {
      const el = document.querySelector(item.data.hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (item.type === 'project') {
      window.location.hash = `#project/${item.data.id}`;
    }
  }

  // Keyboard Navigation inside Palette
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentItems.length > 0) {
        selectedIndex = (selectedIndex + 1) % currentItems.length;
        highlightItem(selectedIndex);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentItems.length > 0) {
        selectedIndex = (selectedIndex - 1 + currentItems.length) % currentItems.length;
        highlightItem(selectedIndex);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeItem(selectedIndex);
    } else if (e.key === 'Escape') {
      closePalette();
    }
  });

  input.addEventListener('input', (e) => {
    renderPaletteResults(e.target.value);
  });

  if (navBtn) {
    navBtn.addEventListener('click', openPalette);
  }

  // Global ⌘K / Ctrl+K listener
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (overlay.classList.contains('open')) {
        closePalette();
      } else {
        openPalette();
      }
    }
  });

  // Close when clicking overlay backdrop
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePalette();
  });
}

/* -------------------------------------------------------------------------- */
/* 10. GITHUB API RECENT UPDATES (Cached in sessionStorage)                    */
/* -------------------------------------------------------------------------- */
async function fetchGithubRepoUpdates(allProjects) {
  const CACHE_KEY = 'gh_repo_updates_v2';
  const ONE_HOUR = 3600000;

  let repos = null;

  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < ONE_HOUR) {
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
      // Silent error: on rate-limit or offline, show nothing
      return;
    }
  }

  if (!Array.isArray(repos)) return;

  // Build map of lowercase repo name -> updated date
  const updateMap = new Map();
  repos.forEach(r => {
    if (r.name && r.pushed_at) {
      updateMap.set(r.name.toLowerCase().replace(/[-_]/g, ''), new Date(r.pushed_at));
    }
  });

  // Stamp cards
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
        badge.textContent = label;
        titleEl.appendChild(badge);
      }
    }
  });
}

/* -------------------------------------------------------------------------- */
/* 11. ANIMATED STATS COUNT-UP                                                */
/* -------------------------------------------------------------------------- */
function setupStatsCountUp(projectCount) {
  const statYears = document.getElementById('stat-years');
  const statTrained = document.getElementById('stat-trained');
  const statProjects = document.getElementById('stat-projects-count');

  const statsRow = document.querySelector('.hero-stats-row');
  if (!statsRow) return;

  let hasAnimated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true;
        animateNumber(statYears, 0, 4, 800, ' yrs engineering');
        animateNumber(statTrained, 0, 7500, 1000, '+ engineers trained');
        animateNumber(statProjects, 0, projectCount, 800, ' projects shipped');
      }
    });
  }, { threshold: 0.2 });

  observer.observe(statsRow);
}

function animateNumber(element, start, end, duration, suffix = '') {
  if (!element) return;
  const startTime = performance.now();

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (end - start) * ease);

    element.textContent = `${current.toLocaleString()}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.textContent = `${end.toLocaleString()}${suffix}`;
    }
  }

  requestAnimationFrame(step);
}

/* -------------------------------------------------------------------------- */
/* 12. MAGNETIC BUTTON HOVER (Desktop only)                                    */
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
      btn.style.transform = 'translate(0px, 0px)';
    });
  });
}

/* -------------------------------------------------------------------------- */
/* 13. EASTER EGG ("hire" -> Amber Diwali Sky Firework Burst)                  */
/* -------------------------------------------------------------------------- */
function setupEasterEgg() {
  const targetCode = 'hire';
  let buffer = '';

  window.addEventListener('keydown', (e) => {
    const tag = document.activeElement ? document.activeElement.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.activeElement.isContentEditable) {
      return;
    }

    if (e.key && e.key.length === 1) {
      buffer += e.key.toLowerCase();
      if (buffer.length > targetCode.length) {
        buffer = buffer.slice(-targetCode.length);
      }

      if (buffer === targetCode) {
        buffer = '';
        triggerHiredFirework();
      }
    }
  });
}

function triggerHiredFirework() {
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReduced) {
    showToast('✨ Diwali Sky firework: You found the secret code "HIRED!"');
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'easter-egg-canvas';
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '10000';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const particleCount = 240;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // Generate explosion particles
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 8;
    particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      decay: 0.008 + Math.random() * 0.012,
      size: 2 + Math.random() * 3,
      color: Math.random() > 0.3 ? '#FFB224' : '#FFE89E'
    });
  }

  let startTime = performance.now();
  let reqId;

  function loop(now) {
    const elapsed = now - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw central "HIRED?" glowing title
    const textAlpha = Math.max(0, Math.min(1, (3000 - elapsed) / 1000));
    ctx.save();
    ctx.font = 'bold 54px "Instrument Serif", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(255, 178, 36, ${textAlpha})`;
    ctx.shadowColor = '#FFB224';
    ctx.shadowBlur = 24;
    ctx.fillText('HIRED?', centerX, centerY);
    ctx.restore();

    // Draw firework particles
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06; // gravity
      p.vx *= 0.98; // drag
      p.alpha -= p.decay;

      if (p.alpha > 0) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    if (elapsed < 3000) {
      reqId = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(reqId);
      canvas.remove();
    }
  }

  reqId = requestAnimationFrame(loop);
}

/* -------------------------------------------------------------------------- */
/* 14. ACTIVE SECTION OBSERVER (Nav link highlight)                           */
/* -------------------------------------------------------------------------- */
function setupNavActiveObserver() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links .nav-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          link.classList.toggle('active', href === `#${id}`);
        });
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  sections.forEach(s => observer.observe(s));
}

/* -------------------------------------------------------------------------- */
/* 15. UTILITIES: TOAST & CLIPBOARD                                           */
/* -------------------------------------------------------------------------- */
function setupCopyEmailButtons() {
  const copyBtn = document.getElementById('copy-email-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      copyToClipboard('pradeepbashaa@gmail.com');
      showToast('Email address copied: pradeepbashaa@gmail.com');
    });
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
  } catch (err) {}
  document.body.removeChild(textArea);
}

let toastTimer;
function showToast(message) {
  const toast = document.getElementById('copy-toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

function setupScrollReveals() {
  const revealElements = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealElements.forEach(el => observer.observe(el));
}

function setupMobileNav() {
  const toggle = document.getElementById('mobile-toggle');
  const navLinks = document.getElementById('nav-links');
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('is-open');
    toggle.classList.toggle('is-active', isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('is-open');
      toggle.classList.remove('is-active');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function setupBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
