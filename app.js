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
  // 2. NAVBAR SCROLL EFFECT & MOBILE MENU TOGGLE
  // --------------------------------------------------------------------------
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
      playSfx('click');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        mobileToggle.classList.remove('active');
        playSfx('click');
      });
    });
  }

  // --------------------------------------------------------------------------
  // 3. HERO CODE TERMINAL INTERACTIVE RUNNER & TABS
  // --------------------------------------------------------------------------
  const termTabs = document.querySelectorAll('.term-tab');
  const termCodeBodies = {
    'java': document.getElementById('code-body-java'),
    'json': document.getElementById('code-body-json'),
    'yaml': document.getElementById('code-body-yaml')
  };
  const btnRunCode = document.getElementById('btn-run-code');
  const btnCopyCode = document.getElementById('btn-copy-code');
  const consoleOutput = document.getElementById('terminal-console-output');

  termTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      termTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const targetLang = tab.getAttribute('data-tab');

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
      btnRunCode.innerHTML = '⚡ Compiling & Executing...';

      consoleOutput.innerHTML = '<span class="console-prompt">&gt;</span> <span class="code-comment">Compiling PradeepTrainer.java with OpenJDK 21...</span>';

      setTimeout(() => {
        playSfx('success');
        consoleOutput.innerHTML = `
          <div class="console-log-line"><span class="console-prompt">&gt;</span> <span style="color:#10b981;">[OK] Build Successful (12ms) · JVM Heap Target: 1024MB · GC: ZGC Active</span></div>
          <div class="console-log-line"><span class="console-prompt">&gt;</span> <span style="color:#22d3ee;">[TRAINER] Pradeep B. active · 7,500+ Engineers Mentored in Core Java &amp; DSA</span></div>
          <div class="console-log-line"><span class="console-prompt">&gt;</span> <span style="color:#5fe0c4;">[ENTERPRISE] Softech Portal active: https://reachsoftech.onrender.com/home</span></div>
          <div class="console-log-line"><span class="console-prompt">&gt;</span> <span style="color:#a855f7;">[FLAGSHIP] 9 3D WebGL Worlds &amp; Systems Deployed · 100% Placement Intuition</span></div>
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
        playSfx('click');
        const origText = btnCopyCode.innerText;
        btnCopyCode.innerText = 'Copied ✓';
        btnCopyCode.style.color = '#10b981';
        setTimeout(() => {
          btnCopyCode.innerText = origText;
          btnCopyCode.style.color = '';
        }, 2000);
      });
    });
  }

  // --------------------------------------------------------------------------
  // 4. LIVE INTERACTIVE ALGORITHM VISUALIZER
  // --------------------------------------------------------------------------
  const algoTabBtns = document.querySelectorAll('.algo-tab-btn');
  const algoContainer = document.getElementById('algo-bars-container');
  const btnStepAlgo = document.getElementById('btn-step-algo');
  const btnPlayAlgo = document.getElementById('btn-play-algo');
  const btnResetAlgo = document.getElementById('btn-reset-algo');
  const btnRandomAlgo = document.getElementById('btn-random-algo');
  const algoTargetInput = document.getElementById('algo-target-input');
  const algoStatusMsg = document.getElementById('algo-status-message');
  const algoComplexityEl = document.getElementById('algo-complexity');
  const algoCompCountEl = document.getElementById('algo-comp-count');
  const algoCodeContent = document.getElementById('algo-code-content');

  let currentAlgo = 'binarySearch';
  let algoArray = [12, 19, 25, 34, 42, 55, 68, 77, 85, 93];
  let targetVal = 55;
  let algoTimer = null;
  let isAlgoPlaying = false;
  let algoComparisons = 0;

  // Binary Search State
  let bsLow = 0, bsHigh = algoArray.length - 1, bsMid = -1, bsFound = false;

  // Two Pointers State
  let tpLeft = 0, tpRight = algoArray.length - 1, tpFound = false;

  // Bubble Sort State
  let bubbleArray = [48, 14, 82, 29, 65, 19, 91, 37];
  let bI = 0, bJ = 0, bSwapped = false, bSorted = false;

  function renderAlgoDisplay() {
    if (!algoContainer) return;
    algoContainer.innerHTML = '';

    if (currentAlgo === 'binarySearch') {
      const maxVal = Math.max(...algoArray);
      algoArray.forEach((val, idx) => {
        const node = document.createElement('div');
        node.className = 'algo-elem-node';
        const heightPercent = Math.max(25, (val / maxVal) * 100);
        node.style.height = `${heightPercent}%`;
        node.innerText = val;

        if (idx === bsMid) {
          if (bsFound) node.classList.add('found');
          else node.classList.add('comparing');
        } else if (idx < bsLow || idx > bsHigh) {
          node.classList.add('eliminated');
        }

        // Pointer tags
        if (idx === bsLow && !bsFound) {
          const p = document.createElement('span');
          p.className = 'pointer-tag pointer-low';
          p.innerText = 'L';
          node.appendChild(p);
        }
        if (idx === bsMid) {
          const p = document.createElement('span');
          p.className = 'pointer-tag pointer-mid';
          p.innerText = bsFound ? '✓ FOUND' : 'MID';
          node.appendChild(p);
        }
        if (idx === bsHigh && !bsFound) {
          const p = document.createElement('span');
          p.className = 'pointer-tag pointer-high';
          p.innerText = 'H';
          node.appendChild(p);
        }

        algoContainer.appendChild(node);
      });
    } else if (currentAlgo === 'twoPointers') {
      const maxVal = Math.max(...algoArray);
      algoArray.forEach((val, idx) => {
        const node = document.createElement('div');
        node.className = 'algo-elem-node';
        const heightPercent = Math.max(25, (val / maxVal) * 100);
        node.style.height = `${heightPercent}%`;
        node.innerText = val;

        if (idx === tpLeft || idx === tpRight) {
          if (tpFound) node.classList.add('found');
          else node.classList.add('comparing');
        } else if (idx < tpLeft || idx > tpRight) {
          node.classList.add('eliminated');
        }

        if (idx === tpLeft) {
          const p = document.createElement('span');
          p.className = 'pointer-tag pointer-left';
          p.innerText = 'L';
          node.appendChild(p);
        }
        if (idx === tpRight) {
          const p = document.createElement('span');
          p.className = 'pointer-tag pointer-right';
          p.innerText = 'R';
          node.appendChild(p);
        }

        algoContainer.appendChild(node);
      });
    } else if (currentAlgo === 'bubbleSort') {
      const maxVal = Math.max(...bubbleArray);
      bubbleArray.forEach((val, idx) => {
        const node = document.createElement('div');
        node.className = 'algo-elem-node';
        const heightPercent = Math.max(25, (val / maxVal) * 100);
        node.style.height = `${heightPercent}%`;
        node.innerText = val;

        if (bSorted || idx >= bubbleArray.length - bI) {
          node.classList.add('sorted');
        } else if (idx === bJ || idx === bJ + 1) {
          node.classList.add('comparing');
        }

        algoContainer.appendChild(node);
      });
    }

    if (algoCompCountEl) algoCompCountEl.innerText = `${algoComparisons} Operations`;
  }

  function highlightAlgoCode(lineNum) {
    if (!algoCodeContent) return;
    const lines = algoCodeContent.querySelectorAll('.algo-code-line');
    lines.forEach((l, idx) => {
      if (idx === lineNum) l.classList.add('active-line');
      else l.classList.remove('active-line');
    });
  }

  function stepAlgo() {
    playSfx('step');
    if (currentAlgo === 'binarySearch') {
      if (bsFound || bsLow > bsHigh) {
        if (!bsFound) {
          if (algoStatusMsg) algoStatusMsg.innerHTML = `❌ Target <strong>${targetVal}</strong> not found in array. Search exhausted.`;
        }
        pauseAlgo();
        return;
      }

      algoComparisons++;
      bsMid = Math.floor((bsLow + bsHigh) / 2);
      const midVal = algoArray[bsMid];

      highlightAlgoCode(1);

      if (midVal === targetVal) {
        bsFound = true;
        playSfx('success');
        highlightAlgoCode(2);
        if (algoStatusMsg) algoStatusMsg.innerHTML = `🎯 <strong>SUCCESS!</strong> Found target <strong>${targetVal}</strong> at index <strong>${bsMid}</strong> in ${algoComparisons} comparisons!`;
        pauseAlgo();
      } else if (midVal < targetVal) {
        highlightAlgoCode(3);
        if (algoStatusMsg) algoStatusMsg.innerHTML = `🔍 Compared mid arr[${bsMid}] = <strong>${midVal}</strong> with target <strong>${targetVal}</strong>. Since ${midVal} &lt; ${targetVal}, searching RIGHT half (low = ${bsMid + 1}).`;
        bsLow = bsMid + 1;
      } else {
        highlightAlgoCode(4);
        if (algoStatusMsg) algoStatusMsg.innerHTML = `🔍 Compared mid arr[${bsMid}] = <strong>${midVal}</strong> with target <strong>${targetVal}</strong>. Since ${midVal} &gt; ${targetVal}, searching LEFT half (high = ${bsMid - 1}).`;
        bsHigh = bsMid - 1;
      }
    } else if (currentAlgo === 'twoPointers') {
      if (tpFound || tpLeft >= tpRight) {
        if (!tpFound && algoStatusMsg) algoStatusMsg.innerHTML = `❌ No pair found with sum <strong>${targetVal}</strong>.`;
        pauseAlgo();
        return;
      }

      algoComparisons++;
      const currentSum = algoArray[tpLeft] + algoArray[tpRight];
      highlightAlgoCode(1);

      if (currentSum === targetVal) {
        tpFound = true;
        playSfx('success');
        highlightAlgoCode(2);
        if (algoStatusMsg) algoStatusMsg.innerHTML = `🎯 <strong>PAIR FOUND!</strong> arr[${tpLeft}] (${algoArray[tpLeft]}) + arr[${tpRight}] (${algoArray[tpRight]}) = <strong>${targetVal}</strong>!`;
        pauseAlgo();
      } else if (currentSum < targetVal) {
        highlightAlgoCode(3);
        if (algoStatusMsg) algoStatusMsg.innerHTML = `⚡ Sum (${algoArray[tpLeft]} + ${algoArray[tpRight]} = ${currentSum}) &lt; ${targetVal}. Moving LEFT pointer forward to increase sum.`;
        tpLeft++;
      } else {
        highlightAlgoCode(4);
        if (algoStatusMsg) algoStatusMsg.innerHTML = `⚡ Sum (${algoArray[tpLeft]} + ${algoArray[tpRight]} = ${currentSum}) &gt; ${targetVal}. Moving RIGHT pointer backward to decrease sum.`;
        tpRight--;
      }
    } else if (currentAlgo === 'bubbleSort') {
      if (bSorted) {
        pauseAlgo();
        return;
      }

      if (bI < bubbleArray.length - 1) {
        if (bJ < bubbleArray.length - 1 - bI) {
          algoComparisons++;
          highlightAlgoCode(2);
          if (bubbleArray[bJ] > bubbleArray[bJ + 1]) {
            highlightAlgoCode(3);
            const temp = bubbleArray[bJ];
            bubbleArray[bJ] = bubbleArray[bJ + 1];
            bubbleArray[bJ + 1] = temp;
            bSwapped = true;
            if (algoStatusMsg) algoStatusMsg.innerHTML = `🔄 Swapped arr[${bJ}] (${bubbleArray[bJ + 1]}) &gt; arr[${bJ + 1}] (${bubbleArray[bJ]}).`;
          } else {
            if (algoStatusMsg) algoStatusMsg.innerHTML = `✓ In order: arr[${bJ}] (${bubbleArray[bJ]}) &le; arr[${bJ + 1}] (${bubbleArray[bJ + 1]}).`;
          }
          bJ++;
        } else {
          bJ = 0;
          bI++;
          if (!bSwapped) {
            bSorted = true;
            playSfx('success');
            if (algoStatusMsg) algoStatusMsg.innerHTML = `🎉 Array sorted early! Zero swaps in entire pass.`;
            pauseAlgo();
          }
          bSwapped = false;
        }
      } else {
        bSorted = true;
        playSfx('success');
        if (algoStatusMsg) algoStatusMsg.innerHTML = `🎉 <strong>SORT COMPLETE!</strong> Entire array ordered in ${algoComparisons} comparisons.`;
        pauseAlgo();
      }
    }

    renderAlgoDisplay();
  }

  function playAlgo() {
    if (isAlgoPlaying) {
      pauseAlgo();
    } else {
      isAlgoPlaying = true;
      if (btnPlayAlgo) btnPlayAlgo.innerText = '⏸ Pause';
      algoTimer = setInterval(stepAlgo, 700);
    }
  }

  function pauseAlgo() {
    isAlgoPlaying = false;
    if (algoTimer) clearInterval(algoTimer);
    if (btnPlayAlgo) btnPlayAlgo.innerText = '▶ Auto Play';
  }

  function resetAlgo() {
    pauseAlgo();
    algoComparisons = 0;

    if (currentAlgo === 'binarySearch') {
      algoArray = [12, 19, 25, 34, 42, 55, 68, 77, 85, 93];
      bsLow = 0;
      bsHigh = algoArray.length - 1;
      bsMid = -1;
      bsFound = false;
      targetVal = algoTargetInput ? parseInt(algoTargetInput.value, 10) || 55 : 55;
      if (algoStatusMsg) algoStatusMsg.innerHTML = `Ready. Target = <strong>${targetVal}</strong>. Click 'Step Forward' or 'Auto Play'.`;
    } else if (currentAlgo === 'twoPointers') {
      algoArray = [2, 5, 8, 11, 15, 18, 23, 29];
      tpLeft = 0;
      tpRight = algoArray.length - 1;
      tpFound = false;
      targetVal = algoTargetInput ? parseInt(algoTargetInput.value, 10) || 26 : 26;
      if (algoStatusMsg) algoStatusMsg.innerHTML = `Ready. Target Pair Sum = <strong>${targetVal}</strong>. Pointers at [0] and [${algoArray.length - 1}].`;
    } else if (currentAlgo === 'bubbleSort') {
      bubbleArray = [48, 14, 82, 29, 65, 19, 91, 37];
      bI = 0;
      bJ = 0;
      bSwapped = false;
      bSorted = false;
      if (algoStatusMsg) algoStatusMsg.innerHTML = `Ready. Initial array loaded. Click 'Step Forward' or 'Auto Play' to sort.`;
    }

    highlightAlgoCode(0);
    renderAlgoDisplay();
  }

  function switchAlgorithm(algoKey) {
    currentAlgo = algoKey;
    algoTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-algo') === algoKey);
    });

    if (currentAlgo === 'binarySearch') {
      if (algoComplexityEl) algoComplexityEl.innerText = 'Time: O(log N) · Space: O(1)';
      if (algoTargetInput) { algoTargetInput.value = '55'; algoTargetInput.style.display = 'inline-block'; }
      if (algoCodeContent) {
        algoCodeContent.innerHTML = `
          <div class="algo-code-line active-line">int low = 0, high = arr.length - 1;</div>
          <div class="algo-code-line">int mid = low + (high - low) / 2;</div>
          <div class="algo-code-line">if (arr[mid] == target) return mid;</div>
          <div class="algo-code-line">else if (arr[mid] &lt; target) low = mid + 1;</div>
          <div class="algo-code-line">else high = mid - 1;</div>
        `;
      }
    } else if (currentAlgo === 'twoPointers') {
      if (algoComplexityEl) algoComplexityEl.innerText = 'Time: O(N) · Space: O(1)';
      if (algoTargetInput) { algoTargetInput.value = '26'; algoTargetInput.style.display = 'inline-block'; }
      if (algoCodeContent) {
        algoCodeContent.innerHTML = `
          <div class="algo-code-line active-line">int left = 0, right = arr.length - 1;</div>
          <div class="algo-code-line">int sum = arr[left] + arr[right];</div>
          <div class="algo-code-line">if (sum == target) return new int[]{left, right};</div>
          <div class="algo-code-line">else if (sum &lt; target) left++;</div>
          <div class="algo-code-line">else right--;</div>
        `;
      }
    } else if (currentAlgo === 'bubbleSort') {
      if (algoComplexityEl) algoComplexityEl.innerText = 'Time: O(N²) · Space: O(1)';
      if (algoTargetInput) algoTargetInput.style.display = 'none';
      if (algoCodeContent) {
        algoCodeContent.innerHTML = `
          <div class="algo-code-line active-line">for (int i = 0; i &lt; n - 1; i++) {</div>
          <div class="algo-code-line">&nbsp;&nbsp;for (int j = 0; j &lt; n - 1 - i; j++) {</div>
          <div class="algo-code-line">&nbsp;&nbsp;&nbsp;&nbsp;if (arr[j] &gt; arr[j + 1]) {</div>
          <div class="algo-code-line">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;swap(arr[j], arr[j + 1]);</div>
          <div class="algo-code-line">&nbsp;&nbsp;&nbsp;&nbsp;}</div>
          <div class="algo-code-line">&nbsp;&nbsp;}</div>
          <div class="algo-code-line">}</div>
        `;
      }
    }

    resetAlgo();
  }

  algoTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSfx('click');
      switchAlgorithm(btn.getAttribute('data-algo'));
    });
  });

  if (btnStepAlgo) btnStepAlgo.addEventListener('click', stepAlgo);
  if (btnPlayAlgo) btnPlayAlgo.addEventListener('click', playAlgo);
  if (btnResetAlgo) btnResetAlgo.addEventListener('click', () => { playSfx('click'); resetAlgo(); });

  if (btnRandomAlgo) {
    btnRandomAlgo.addEventListener('click', () => {
      playSfx('click');
      if (currentAlgo === 'binarySearch' || currentAlgo === 'twoPointers') {
        const set = new Set();
        while (set.size < 10) set.add(Math.floor(Math.random() * 90) + 10);
        algoArray = Array.from(set).sort((a, b) => a - b);
        targetVal = algoArray[Math.floor(Math.random() * algoArray.length)];
        if (algoTargetInput) algoTargetInput.value = targetVal;
      } else {
        bubbleArray = Array.from({ length: 8 }, () => Math.floor(Math.random() * 85) + 12);
      }
      resetAlgo();
    });
  }

  if (algoTargetInput) {
    algoTargetInput.addEventListener('change', () => {
      targetVal = parseInt(algoTargetInput.value, 10) || 55;
      resetAlgo();
    });
  }

  // Initialize Algorithm Visualizer with Binary Search
  switchAlgorithm('binarySearch');

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

  let selectedTopic = 'Corporate Java & DSA Training';

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
      const template = `To: ${email}\nSubject: Inquiry: ${selectedTopic}\n\nHi Pradeep,\n\nI came across your profile and would love to connect regarding ${selectedTopic}.\n\nBest regards,\n`;

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
