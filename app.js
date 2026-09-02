/* ==========================================================================
   PRADEEP 3D PORTFOLIO - MAIN INTERACTIVE UI LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. NAVBAR SCROLL EFFECT & MOBILE MENU TOGGLE
  const navbar = document.querySelector('.navbar');
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinks = document.getElementById('nav-links');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      mobileToggle.classList.toggle('active');
    });

    // Close menu when clicking link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        mobileToggle.classList.remove('active');
      });
    });
  }

  // 2. REPOSITORY CATEGORY FILTERING
  const filterBtns = document.querySelectorAll('.project-filter-bar .filter-btn');
  const projectCards = document.querySelectorAll('.projects-grid .project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
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

  // 3. 3D CARD TILT EFFECT ON HOVER
  const tiltCards = document.querySelectorAll('.tilt-card');

  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -10; // Max 10deg
      const rotateY = ((x - centerX) / centerX) * 10;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)`;
    });
  });

  // 4. COPY EMAIL TO CLIPBOARD
  const copyBtn = document.getElementById('copy-email-btn');
  const copyText = document.getElementById('email-btn-text');

  if (copyBtn && copyText) {
    copyBtn.addEventListener('click', () => {
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

  // 5. ANIMATED COUNTER ON SCROLL
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
});
