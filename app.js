/**
 * app.js - Main Application Controller
 * Vanilla JS ES Module architecture
 */

import { initHeroGraph } from './hero-graph.js';

document.addEventListener('DOMContentLoaded', async () => {
  let allProjects = [];

  try {
    const res = await fetch('data/projects.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allProjects = await res.json();
  } catch (err) {
    console.error('Failed to load projects.json:', err);
    return;
  }

  // 1. Update Hero Project Count Stat
  const heroCountEl = document.getElementById('stat-projects-count');
  if (heroCountEl) {
    heroCountEl.textContent = `${allProjects.length} projects shipped`;
  }

  // 2. Render Featured Work (Case-Study Style, Alternating Rows)
  renderFeaturedWork(allProjects.filter(p => p.featured));

  // 3. Render Lab (Filterable Grid)
  const labProjects = allProjects.filter(p => !p.featured);
  renderLab(labProjects);
  setupLabFilters(labProjects);

  // 4. Lazy-init Hero Graph after first paint
  const heroContainer = document.getElementById('hero-canvas-container');
  if (heroContainer) {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => initHeroGraph(heroContainer, allProjects));
    } else {
      setTimeout(() => initHeroGraph(heroContainer, allProjects), 150);
    }
  }

  // 5. Setup Scroll Reveals
  setupScrollReveals();

  // 6. Setup 3D Card Tilt
  setupCardTilt();

  // 7. Setup Copy Email Action
  setupCopyEmail();

  // 8. Setup Mobile Navigation Menu
  setupMobileNav();

  // 9. Setup Back to Top
  setupBackToTop();
});

/* -------------------------------------------------------------------------- */
/* RENDER FEATURED WORK                                                       */
/* -------------------------------------------------------------------------- */
function renderFeaturedWork(featuredProjects) {
  const container = document.getElementById('featured-container');
  if (!container) return;

  container.innerHTML = featuredProjects.map((p, idx) => {
    const isEven = idx % 2 === 1;
    const techChips = (p.tech || []).slice(0, 3).map(t => `<span class="tech-chip">${escapeHtml(t)}</span>`).join('');

    const liveBtn = p.liveUrl 
      ? `<a href="${p.liveUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">
           <span>Live Platform</span>
           <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
         </a>` 
      : '';

    const codeBtn = p.codeUrl 
      ? `<a href="${p.codeUrl}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
           <span>Source Code</span>
           <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
         </a>` 
      : '';

    return `
      <article class="featured-case-row ${isEven ? 'row-reversed' : ''} reveal" id="project-${p.id}">
        <div class="featured-media-wrapper tilt-target">
          <a href="${p.liveUrl || p.codeUrl || '#'}" ${p.liveUrl || p.codeUrl ? 'target="_blank" rel="noopener"' : ''} aria-label="Inspect ${escapeHtml(p.title)}">
            <img 
              src="${p.image}" 
              alt="Screenshot of ${escapeHtml(p.title)}" 
              width="1200" 
              height="675" 
              loading="lazy" 
              class="featured-img"
            />
          </a>
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
}

/* -------------------------------------------------------------------------- */
/* RENDER LAB GRID                                                            */
/* -------------------------------------------------------------------------- */
function renderLab(labProjects) {
  const grid = document.getElementById('lab-grid');
  if (!grid) return;

  grid.innerHTML = labProjects.map(p => {
    const techChips = (p.tech || []).slice(0, 3).map(t => `<span class="tech-chip">${escapeHtml(t)}</span>`).join('');

    const liveBtn = p.liveUrl 
      ? `<a href="${p.liveUrl}" target="_blank" rel="noopener" class="card-link" aria-label="Launch ${escapeHtml(p.title)}">Live →</a>` 
      : '';

    const codeBtn = p.codeUrl 
      ? `<a href="${p.codeUrl}" target="_blank" rel="noopener" class="card-link card-link-muted" aria-label="Source code for ${escapeHtml(p.title)}">Code</a>` 
      : '';

    return `
      <article class="lab-card reveal tilt-target" id="project-${p.id}" data-category="${escapeHtml(p.category)}">
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
}

/* -------------------------------------------------------------------------- */
/* LAB FILTER LOGIC                                                           */
/* -------------------------------------------------------------------------- */
function setupLabFilters(labProjects) {
  const filterBtns = document.querySelectorAll('.filter-chip');
  const cards = document.querySelectorAll('.lab-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const activeCat = btn.getAttribute('data-filter');

      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      cards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (activeCat === 'All' || cat === activeCat) {
          card.style.display = 'flex';
          setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'none'; }, 20);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.96)';
          setTimeout(() => { card.style.display = 'none'; }, 200);
        }
      });
    });
  });
}

/* -------------------------------------------------------------------------- */
/* SCROLL REVEAL OBSERVER                                                     */
/* -------------------------------------------------------------------------- */
function setupScrollReveals() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* -------------------------------------------------------------------------- */
/* 3D CARD TILT ON HOVER (Max 4deg tilt + subtle perspective)                 */
/* -------------------------------------------------------------------------- */
function setupCardTilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

  const tiltTargets = document.querySelectorAll('.tilt-target');

  tiltTargets.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const midX = rect.width / 2;
      const midY = rect.height / 2;

      // Max 4 degrees tilt
      const rotY = ((x - midX) / midX) * 3.5;
      const rotX = -((y - midY) / midY) * 3.5;

      card.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-2px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
    });
  });
}

/* -------------------------------------------------------------------------- */
/* COPY EMAIL TO CLIPBOARD WITH TOAST                                         */
/* -------------------------------------------------------------------------- */
function setupCopyEmail() {
  const copyBtn = document.getElementById('copy-email-btn');
  const toast = document.getElementById('copy-toast');
  if (!copyBtn) return;

  copyBtn.addEventListener('click', async () => {
    const email = 'pradeepbashaa@gmail.com';
    try {
      await navigator.clipboard.writeText(email);
      if (toast) {
        toast.textContent = `Copied ${email} to clipboard!`;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2800);
      }
    } catch (err) {
      // Fallback prompt
      window.prompt('Copy email address:', email);
    }
  });
}

/* -------------------------------------------------------------------------- */
/* MOBILE NAVIGATION MENU (Accessible Hamburger)                              */
/* -------------------------------------------------------------------------- */
function setupMobileNav() {
  const toggleBtn = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-links');

  if (!toggleBtn || !navMenu) return;

  function closeMenu() {
    toggleBtn.classList.remove('is-active');
    toggleBtn.setAttribute('aria-expanded', 'false');
    navMenu.classList.remove('is-open');
  }

  toggleBtn.addEventListener('click', () => {
    const isOpen = navMenu.classList.contains('is-open');
    if (isOpen) {
      closeMenu();
    } else {
      toggleBtn.classList.add('is-active');
      toggleBtn.setAttribute('aria-expanded', 'true');
      navMenu.classList.add('is-open');
    }
  });

  // Close on nav link click
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
      closeMenu();
      toggleBtn.focus();
    }
  });
}

/* -------------------------------------------------------------------------- */
/* BACK TO TOP SMOOTH SCROLL                                                  */
/* -------------------------------------------------------------------------- */
function setupBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  btn.addEventListener('click', e => {
    e.preventDefault();
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
