/* ==========================================================================
   PRADEEP 3D PORTFOLIO - MAIN INTERACTIVE UI LOGIC & FEATURE ENGINES
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // 1. SYNTHESIZED WEB AUDIO SFX ENGINE (Zero external dependencies)
  // --------------------------------------------------------------------------
  let audioCtx = null;
  let isAudioEnabled = localStorage.getItem('pradeep_audio_enabled') === 'true';

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSfx(type = 'click') {
    if (!isAudioEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.06);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'step') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.09);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'run') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      console.warn('Audio SFX error', e);
    }
  }

  // Audio Toggle Button
  const audioToggleBtn = document.getElementById('audio-toggle');
  const audioIcon = document.getElementById('audio-toggle-icon');

  function updateAudioButtonUI() {
    if (!audioIcon) return;
    if (isAudioEnabled) {
      audioIcon.innerHTML = '🔊';
      if (audioToggleBtn) audioToggleBtn.setAttribute('title', 'Sound Effects: ON (Click to Mute)');
    } else {
      audioIcon.innerHTML = '🔇';
      if (audioToggleBtn) audioToggleBtn.setAttribute('title', 'Sound Effects: OFF (Click to Unmute)');
    }
  }

  if (audioToggleBtn) {
    updateAudioButtonUI();
    audioToggleBtn.addEventListener('click', () => {
      isAudioEnabled = !isAudioEnabled;
      localStorage.setItem('pradeep_audio_enabled', isAudioEnabled ? 'true' : 'false');
      updateAudioButtonUI();
      if (isAudioEnabled) {
        initAudio();
        playSfx('success');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 2. MOBILE NAVIGATION DRAWER
  // --------------------------------------------------------------------------
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinks = document.getElementById('nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
      playSfx('click');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileToggle.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }

  // --------------------------------------------------------------------------
  // 3. INTERACTIVE CODE TERMINAL WINDOW
  // --------------------------------------------------------------------------
  const termTabs = document.querySelectorAll('.term-tab');
  const termCodeBodies = {
    java: document.getElementById('code-body-java'),
    json: document.getElementById('code-body-json'),
    yaml: document.getElementById('code-body-yaml')
  };
  const btnRunCode = document.getElementById('btn-run-code');
  const btnCopyCode = document.getElementById('btn-copy-code');
  const consoleOutput = document.getElementById('terminal-console-output');

  termTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetLang = tab.getAttribute('data-tab');
      termTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      Object.keys(termCodeBodies).forEach(lang => {
        if (termCodeBodies[lang]) {
          termCodeBodies[lang].style.display = lang === targetLang ? 'block' : 'none';
        }
      });
      playSfx('click');
    });
  });

  if (btnRunCode && consoleOutput) {
    btnRunCode.addEventListener('click', () => {
      playSfx('run');
      btnRunCode.disabled = true;
      btnRunCode.innerHTML = '⚡ Compiling &amp; Executing...';

      consoleOutput.innerHTML = '<span class="console-prompt">&gt;</span> <span class="code-comment">Compiling PradeepTrainer.java with OpenJDK 21...</span>';

      setTimeout(() => {
        playSfx('success');
        consoleOutput.innerHTML = `
          <div class="console-log-line"><span class="console-prompt">&gt;</span> <span style="color:#10b981;">[OK] Build Successful (12ms) • JVM Heap Target: 1024MB • GC: ZGC Active</span></div>
          <div class="console-log-line"><span class="console-prompt">&gt;</span> <span style="color:#22d3ee;">[TRAINER] Pradeep B. active • 7,500+ Engineers Mentored in Core Java &amp; DSA</span></div>
          <div class="console-log-line"><span class="console-prompt">&gt;</span> <span style="color:#5fe0c4;">[WEB PLATFORM] Softech Portal active: https://reachsoftech.onrender.com/home</span></div>
          <div class="console-log-line"><span class="console-prompt">&gt;</span> <span style="color:#a855f7;">[FLAGSHIP] 9 3D WebGL Systems &amp; Repositories Live • 100% Placement Ready</span></div>
        `;
        btnRunCode.disabled = false;
        btnRunCode.innerHTML = '▶ Run Code';
      }, 500);
    });
  }

  if (btnCopyCode) {
    btnCopyCode.addEventListener('click', () => {
      const activeTab = document.querySelector('.term-tab.active');
      const lang = activeTab ? activeTab.getAttribute('data-tab') : 'java';
      const activeBody = termCodeBodies[lang];
      const textToCopy = activeBody ? activeBody.innerText : '';

      navigator.clipboard.writeText(textToCopy).then(() => {
        playSfx('success');
        const origText = btnCopyCode.innerText;
        btnCopyCode.innerText = 'Copied ✓';
        btnCopyCode.style.color = '#10b981';

        setTimeout(() => {
          btnCopyCode.innerText = origText;
          btnCopyCode.style.color = '';
        }, 2000);
      }).catch(err => {
        console.error('Copy failed', err);
      });
    });
  }

  // --------------------------------------------------------------------------
  // 5. SKILLS REAL-TIME SEARCH FILTER
  // --------------------------------------------------------------------------
  const skillsSearchInput = document.getElementById('skills-search-input');
  const skillCategoryCards = document.querySelectorAll('.skill-category-card');

  if (skillsSearchInput) {
    skillsSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();

      skillCategoryCards.forEach(card => {
        const items = card.querySelectorAll('.skill-list li');
        let cardHasMatch = false;

        items.forEach(item => {
          const text = item.innerText.toLowerCase();
          if (!q || text.includes(q)) {
            item.style.display = 'flex';
            cardHasMatch = true;
          } else {
            item.style.display = 'none';
          }
        });

        card.style.display = cardHasMatch ? 'block' : 'none';
      });
    });
  }

  // --------------------------------------------------------------------------
  // 6. REPOSITORY CATEGORY FILTERING
  // --------------------------------------------------------------------------
  const filterBtns = document.querySelectorAll('.project-filter-bar .filter-btn');
  const projectCards = document.querySelectorAll('.projects-grid .project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSfx('click');
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.style.display = 'flex';
          card.style.animation = 'fadeInUp 0.4s ease forwards';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // --------------------------------------------------------------------------
  // 7. 3D CARD TILT EFFECT ON HOVER
  // --------------------------------------------------------------------------
  const tiltCards = document.querySelectorAll('.tilt-card');

  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)`;
    });
  });

  // --------------------------------------------------------------------------
  // 8. CONTACT INQUIRY TOPIC SELECTOR & COPY EMAIL
  // --------------------------------------------------------------------------
  const topicChips = document.querySelectorAll('.topic-chip');
  const copyBtn = document.getElementById('copy-email-btn');
  const copyText = document.getElementById('email-btn-text');

  let selectedTopic = 'Custom Website / App Development';

  topicChips.forEach(chip => {
    chip.addEventListener('click', () => {
      playSfx('click');
      topicChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedTopic = chip.innerText.trim();
    });
  });

  if (copyBtn && copyText) {
    copyBtn.addEventListener('click', () => {
      playSfx('success');
      const email = copyBtn.getAttribute('data-email') || 'pradeepbashaa@gmail.com';

      navigator.clipboard.writeText(email).then(() => {
        const originalText = copyText.innerText;
        copyText.innerText = 'Copied to Clipboard! ✓';
        copyBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

        setTimeout(() => {
          copyText.innerText = originalText;
          copyBtn.style.background = '';
        }, 2500);
      }).catch(err => {
        console.error('Copy failed', err);
      });
    });
  }

  // --------------------------------------------------------------------------
  // 9. ANIMATED COUNTER ON SCROLL
  // --------------------------------------------------------------------------
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');

  if ('IntersectionObserver' in window && statNumbers.length > 0) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-target'), 10);
          animateValue(el, 0, target, 1500);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    statNumbers.forEach(num => observer.observe(num));
  }

  function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const val = Math.floor(progress * (end - start) + start);
      obj.innerHTML = val.toLocaleString() + (end >= 1000 ? '+' : (end === 99 ? '%' : '+'));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  // --------------------------------------------------------------------------
  // 10. SCROLL TO TOP FLOATING BUTTON
  // --------------------------------------------------------------------------
  const scrollTopBtn = document.getElementById('scroll-top-btn');

  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 350) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    });

    scrollTopBtn.addEventListener('click', () => {
      playSfx('click');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});
