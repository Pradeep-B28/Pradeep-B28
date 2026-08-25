/* ==========================================================================
   PRADEEP 3D PORTFOLIO - THE ARCHIPELAGO OF PRADEEP (3D TOURIST WORLD & GAME)
   ========================================================================== */

(function () {
  const container = document.getElementById('viz-3d-container');
  if (!container || typeof THREE === 'undefined') return;

  // DOM Elements
  const btnWorld = document.getElementById('btn-mode-world');
  const btnSentinel = document.getElementById('btn-mode-sentinel');
  const btnLedger = document.getElementById('btn-mode-ledger');
  const btnSkyline = document.getElementById('btn-mode-skyline');
  const btnDSA = document.getElementById('btn-mode-dsa');
  const btnGuidedTour = document.getElementById('btn-guided-tour');
  const btnPassportToggle = document.getElementById('btn-passport-toggle');
  const passportModal = document.getElementById('passport-modal');
  const passportCloseBtn = document.getElementById('passport-modal-close');
  const passportCountEl = document.getElementById('passport-count');
  const explorerRankEl = document.getElementById('explorer-rank');
  const passportProgressEl = document.getElementById('passport-progress');
  const statusText = document.getElementById('viz-status-text');

  // Guided Tour Caption Elements
  const tourCaptionBox = document.getElementById('tour-caption-box');
  const tourCaptionTitle = document.getElementById('tour-caption-title');
  const tourCaptionText = document.getElementById('tour-caption-text');

  // SQL Game Panel Elements
  const sqlGamePanel = document.getElementById('sql-game-panel');
  const sqlPresetSelect = document.getElementById('sql-preset-select');
  const btnAnalyzeSQL = document.getElementById('btn-analyze-sql');
  const sqlRiskBadge = document.getElementById('sql-risk-badge');
  const mLock = document.getElementById('m-lock');
  const mIntegrity = document.getElementById('m-integrity');
  const mCompat = document.getElementById('m-compat');
  const mPerf = document.getElementById('m-perf');
  const sqlRec = document.getElementById('sql-recommendation');

  // Scene, Camera, Renderer
  const width = container.clientWidth;
  const height = container.clientHeight;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07090e, 0.018);

  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  const initialCamPos = new THREE.Vector3(0, 24, 34);
  const initialTarget = new THREE.Vector3(0, 2, 0);
  camera.position.copy(initialCamPos);
  camera.lookAt(initialTarget);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // OrbitControls
  let controls;
  if (typeof THREE.OrbitControls !== 'undefined') {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Stay above ground
    controls.minDistance = 5;
    controls.maxDistance = 60;
  }

  // Lighting System
  const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.7);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
  dirLight.position.set(20, 40, 20);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const cyanPointLight = new THREE.PointLight(0x22d3ee, 2.5, 40);
  cyanPointLight.position.set(-16, 8, -10);
  scene.add(cyanPointLight);

  const goldPointLight = new THREE.PointLight(0xf59e0b, 2.5, 40);
  goldPointLight.position.set(16, 8, -10);
  scene.add(goldPointLight);

  const purplePointLight = new THREE.PointLight(0xa855f7, 2.5, 40);
  purplePointLight.position.set(0, 12, -22);
  scene.add(purplePointLight);

  const greenPointLight = new THREE.PointLight(0x10b981, 2.5, 40);
  greenPointLight.position.set(16, 8, 12);
  scene.add(greenPointLight);

  // State Management
  let currentMode = 'world'; // 'world', 'sentinel', 'ledger', 'skyline', 'dsa'
  let isTourActive = false;
  let tourIndex = 0;
  let tourTimer = null;
  let animationTime = 0;

  // Passport Stamps State
  const passportState = {
    sentinel: false,
    ledger: false,
    skyline: false,
    relnotes: false,
    mentor: false
  };

  function unlockStamp(key) {
    if (!passportState[key]) {
      passportState[key] = true;
      updatePassportUI();
      showToastNotification(`🏆 Passport Stamp Unlocked: ${getStampName(key)}!`);
    }
  }

  function getStampName(key) {
    const names = {
      sentinel: 'Sentinel Gatekeeper',
      ledger: 'Ledger Architect',
      skyline: 'Skyline Navigator',
      relnotes: 'AI Release Scribe',
      mentor: 'Grand Mentor (6,000+ Students)'
    };
    return names[key] || 'Explorer Badge';
  }

  function updatePassportUI() {
    let count = 0;
    Object.keys(passportState).forEach(k => {
      if (passportState[k]) {
        count++;
        const card = document.getElementById(`stamp-${k}`);
        if (card) {
          card.classList.remove('locked');
          card.classList.add('unlocked');
          const statusEl = card.querySelector('.stamp-status');
          if (statusEl) statusEl.innerText = 'UNLOCKED ✓';
        }
      }
    });

    if (passportCountEl) passportCountEl.innerText = `${count}/5`;
    if (passportProgressEl) passportProgressEl.style.width = `${(count / 5) * 100}%`;

    if (explorerRankEl) {
      if (count === 0) explorerRankEl.innerText = 'Novice Tourist (0/5 Stamps)';
      else if (count < 3) explorerRankEl.innerText = 'Apprentice Adventurer (' + count + '/5 Stamps)';
      else if (count < 5) explorerRankEl.innerText = 'Senior Code Explorer (' + count + '/5 Stamps)';
      else explorerRankEl.innerText = '👑 Master Architect Explorer (5/5 Complete!)';
    }
  }

  function showToastNotification(text) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification glass-panel';
    toast.innerText = text;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  // --- 1. OCEAN WATER & ISLAND TERRAIN BASE ---
  const worldGroup = new THREE.Group();
  scene.add(worldGroup);

  // Water Mesh
  const waterGeo = new THREE.PlaneGeometry(140, 140, 32, 32);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x071527,
    roughness: 0.1,
    metalness: 0.8,
    transparent: true,
    opacity: 0.85
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = -0.5;
  worldGroup.add(waterMesh);

  // Central Platform Islands
  const islandMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.7,
    metalness: 0.2
  });

  const pathMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
    wireframe: true,
    transparent: true,
    opacity: 0.3
  });

  // Central Plaza
  const plazaGeo = new THREE.CylinderGeometry(5, 5.5, 1, 32);
  const plaza = new THREE.Mesh(plazaGeo, islandMat);
  plaza.position.set(0, 0, 0);
  worldGroup.add(plaza);

  // Floating Particles Ecosystem
  const particleCount = 200;
  const particleGeo = new THREE.BufferGeometry();
  const particlePos = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i += 3) {
    particlePos[i] = (Math.random() - 0.5) * 80;
    particlePos[i + 1] = Math.random() * 25;
    particlePos[i + 2] = (Math.random() - 0.5) * 80;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0x38bdf8,
    size: 0.3,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  worldGroup.add(particles);

  // --- 2. LANDMARK 1: SCHEMA SENTINEL CITADEL (Zone 1: X=-16, Z=-10) ---
  const sentinelGroup = new THREE.Group();
  sentinelGroup.position.set(-16, 0, -10);
  worldGroup.add(sentinelGroup);

  // Island Base
  const base1 = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.5, 1.2, 6), islandMat);
  base1.position.y = 0;
  sentinelGroup.add(base1);

  // Neon Citadel Pillars
  const fortressGeo = new THREE.CylinderGeometry(2.5, 3.2, 5, 6);
  const fortressMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.2,
    metalness: 0.8
  });
  const fortress = new THREE.Mesh(fortressGeo, fortressMat);
  fortress.position.y = 3;
  sentinelGroup.add(fortress);

  // Database Core Ring
  const coreGeo = new THREE.CylinderGeometry(1.4, 1.4, 3, 16);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb,
    emissive: 0x1d4ed8,
    emissiveIntensity: 0.6,
    wireframe: true
  });
  const dbCore = new THREE.Mesh(coreGeo, coreMat);
  dbCore.position.y = 7;
  sentinelGroup.add(dbCore);

  // Rotating Shield Rings
  const ringGeo = new THREE.TorusGeometry(3.5, 0.1, 16, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
  const shieldRing1 = new THREE.Mesh(ringGeo, ringMat);
  shieldRing1.position.y = 5;
  shieldRing1.rotation.x = Math.PI / 3;
  sentinelGroup.add(shieldRing1);

  const shieldRing2 = new THREE.Mesh(ringGeo, ringMat);
  shieldRing2.position.y = 7;
  shieldRing2.rotation.x = -Math.PI / 3;
  sentinelGroup.add(shieldRing2);

  // Laser Beams
  const laserMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.8 });
  const laserGeo = new THREE.CylinderGeometry(0.05, 0.05, 12, 8);
  const laserBeam = new THREE.Mesh(laserGeo, laserMat);
  laserBeam.position.set(0, 11, 0);
  sentinelGroup.add(laserBeam);

  // --- 3. LANDMARK 2: LEDGER VAULT (Zone 2: X=16, Z=-10) ---
  const ledgerGroup = new THREE.Group();
  ledgerGroup.position.set(16, 0, -10);
  worldGroup.add(ledgerGroup);

  const base2 = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.5, 1.2, 6), islandMat);
  base2.position.y = 0;
  ledgerGroup.add(base2);

  // Glass Skyscraper
  const towerGeo = new THREE.BoxGeometry(3.5, 9, 3.5);
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.7
  });
  const ledgerTower = new THREE.Mesh(towerGeo, glassMat);
  ledgerTower.position.y = 5.1;
  ledgerGroup.add(ledgerTower);

  // Floating Coins Nodes
  const coinGroup = new THREE.Group();
  coinGroup.position.y = 11;
  const coinGeo = new THREE.IcosahedronGeometry(1.2, 1);
  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.7,
    wireframe: true
  });
  const mainCoin = new THREE.Mesh(coinGeo, coinMat);
  coinGroup.add(mainCoin);
  ledgerGroup.add(coinGroup);

  // --- 4. LANDMARK 3: GIT-VIZ OBSERVATORY (Zone 3: X=0, Z=-22) ---
  const skylineGroup = new THREE.Group();
  skylineGroup.position.set(0, 0, -22);
  worldGroup.add(skylineGroup);

  const base3 = new THREE.Mesh(new THREE.CylinderGeometry(7, 7.5, 1.2, 8), islandMat);
  base3.position.y = 0;
  skylineGroup.add(base3);

  // Observatory Dome
  const domeGeo = new THREE.SphereGeometry(3, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMat = new THREE.MeshStandardMaterial({
    color: 0x7c3aed,
    emissive: 0x6d28d9,
    emissiveIntensity: 0.5,
    wireframe: true
  });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.position.y = 2.5;
  skylineGroup.add(dome);

  // Contribution Buildings
  const buildingGroup = new THREE.Group();
  buildingGroup.position.y = 0.6;
  const buildingColors = [0x1e293b, 0x0e4429, 0x006d32, 0x26a641, 0x39d353];
  for (let c = -2; c <= 2; c++) {
    for (let r = -2; r <= 2; r++) {
      if (Math.abs(c) === 2 || Math.abs(r) === 2) {
        const lvl = Math.floor(Math.random() * 5);
        const h = lvl === 0 ? 0.4 : lvl * 1.5 + 1;
        const bGeo = new THREE.BoxGeometry(0.8, h, 0.8);
        bGeo.translate(0, h / 2, 0);
        const bMat = new THREE.MeshStandardMaterial({ color: buildingColors[lvl] });
        const bMesh = new THREE.Mesh(bGeo, bMat);
        bMesh.position.set(c * 1.2, 0, r * 1.2);
        buildingGroup.add(bMesh);
      }
    }
  }
  skylineGroup.add(buildingGroup);

  // --- 5. LANDMARK 4: REL_NOTES MONOLITH (Zone 4: X=-16, Z=12) ---
  const notesGroup = new THREE.Group();
  notesGroup.position.set(-16, 0, 12);
  worldGroup.add(notesGroup);

  const base4 = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6, 1.2, 6), islandMat);
  base4.position.y = 0;
  notesGroup.add(base4);

  // AI Monolith
  const monoGeo = new THREE.BoxGeometry(2, 8, 1);
  const monoMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 0.4,
    metalness: 0.8
  });
  const monolith = new THREE.Mesh(monoGeo, monoMat);
  monolith.position.y = 4.6;
  notesGroup.add(monolith);

  // Floating Groq AI Crystal
  const crystalGeo = new THREE.OctahedronGeometry(1.2, 0);
  const crystalMat = new THREE.MeshBasicMaterial({ color: 0x34d399, wireframe: true });
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  crystal.position.y = 10;
  notesGroup.add(crystal);

  // --- 6. LANDMARK 5: DSA FOREST & MENTORSHIP AMPHITHEATER (Zone 5: X=16, Z=12) ---
  const dsaGroup = new THREE.Group();
  dsaGroup.position.set(16, 0, 12);
  worldGroup.add(dsaGroup);

  const base5 = new THREE.Mesh(new THREE.CylinderGeometry(7, 7.5, 1.2, 8), islandMat);
  base5.position.y = 0;
  dsaGroup.add(base5);

  // Amphitheater Stage (6,000+ Students Mentored)
  const stageGeo = new THREE.CylinderGeometry(4, 4.5, 1.5, 16);
  const stageMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
  const stage = new THREE.Mesh(stageGeo, stageMat);
  stage.position.y = 1.2;
  dsaGroup.add(stage);

  // Binary Trees Nodes
  const treeNodes = [
    { x: 0, y: 7, z: 0 },
    { x: -2.5, y: 4.5, z: 0 },
    { x: 2.5, y: 4.5, z: 0 },
    { x: -4, y: 2.5, z: 0 },
    { x: -1, y: 2.5, z: 0 },
    { x: 1, y: 2.5, z: 0 },
    { x: 4, y: 2.5, z: 0 }
  ];

  const nodeGeo = new THREE.SphereGeometry(0.6, 16, 16);
  const treeMeshGroup = new THREE.Group();
  treeMeshGroup.position.y = 2;

  treeNodes.forEach(n => {
    const nMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.3 });
    const nMesh = new THREE.Mesh(nodeGeo, nMat);
    nMesh.position.set(n.x, n.y, n.z);
    treeMeshGroup.add(nMesh);
  });
  dsaGroup.add(treeMeshGroup);

  // Connecting Bridges / Pathways
  const bridges = [
    [new THREE.Vector3(0, 0, 0), new THREE.Vector3(-16, 0, -10)],
    [new THREE.Vector3(0, 0, 0), new THREE.Vector3(16, 0, -10)],
    [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -22)],
    [new THREE.Vector3(0, 0, 0), new THREE.Vector3(-16, 0, 12)],
    [new THREE.Vector3(0, 0, 0), new THREE.Vector3(16, 0, 12)]
  ];

  bridges.forEach(([start, end]) => {
    const points = [start, end];
    const bGeo = new THREE.BufferGeometry().setFromPoints(points);
    const bridgeLine = new THREE.Line(bGeo, pathMat);
    worldGroup.add(bridgeLine);
  });

  // --- CAMERA MOVEMENT & NAVIGATION CONTROLLER ---
  const presetViews = {
    world: { pos: new THREE.Vector3(0, 24, 34), target: new THREE.Vector3(0, 2, 0), title: '🏝️ The Archipelago of Pradeep', text: 'Overview of all 5 Flagship Landmark Zones. Click any landmark or run Guided Flyover Tour to explore.' },
    sentinel: { pos: new THREE.Vector3(-16, 10, -2), target: new THREE.Vector3(-16, 5, -10), title: '🏰 Schema Sentinel Citadel', text: 'Pre-migration risk analysis engine for PostgreSQL. AST SQL parser, 4-axis risk matrix & automated GitHub Action PR gatekeeper.' },
    ledger: { pos: new THREE.Vector3(16, 10, -2), target: new THREE.Vector3(16, 5, -10), title: '💸 Ledger Vault & Bank Tower', text: 'Market-ready MERN + PWA + Capacitor Android expense suite with 0ms Optimistic UI engine and bank cloud sync.' },
    skyline: { pos: new THREE.Vector3(0, 12, -12), target: new THREE.Vector3(0, 4, -22), title: '🏙️ GIT-viz Skyline Observatory', text: 'Transforms GitHub profiles into 3D city skylines & repo galaxies with WASD drone flight and Web Audio melodic synth.' },
    relnotes: { pos: new THREE.Vector3(-16, 10, 20), target: new THREE.Vector3(-16, 4, 12), title: '📝 Rel_Notes AI Monolith', text: 'AI-powered release notes generator built with TypeScript and Groq API. Structures Git commits into polished releases.' },
    dsa: { pos: new THREE.Vector3(16, 10, 22), target: new THREE.Vector3(16, 4, 12), title: '🌲 Mentorship Forest & DSA Stage', text: '6,000+ Students Mentored across Core Java, JVM internals, multithreading, arrays, graphs & dynamic programming.' }
  };

  let targetCamPos = camera.position.clone();
  let targetLookAt = initialTarget.clone();

  function switchMode(modeKey) {
    if (isTourActive && modeKey !== 'tour') stopGuidedTour();
    currentMode = modeKey;

    // Deactivate all mode buttons
    [btnWorld, btnSentinel, btnLedger, btnSkyline, btnDSA].forEach(b => {
      if (b) b.classList.remove('active');
    });

    const activeBtnMap = {
      world: btnWorld,
      sentinel: btnSentinel,
      ledger: btnLedger,
      skyline: btnSkyline,
      dsa: btnDSA
    };
    if (activeBtnMap[modeKey]) activeBtnMap[modeKey].classList.add('active');

    const view = presetViews[modeKey] || presetViews.world;
    targetCamPos.copy(view.pos);
    targetLookAt.copy(view.target);

    if (statusText) statusText.innerText = `Mode: ${view.title} · Navigated`;

    // Show/Hide SQL Game Panel
    if (modeKey === 'sentinel') {
      if (sqlGamePanel) sqlGamePanel.classList.remove('hidden');
      unlockStamp('sentinel');
    } else {
      if (sqlGamePanel) sqlGamePanel.classList.add('hidden');
    }

    if (modeKey === 'ledger') unlockStamp('ledger');
    if (modeKey === 'skyline') unlockStamp('skyline');
    if (modeKey === 'dsa') unlockStamp('mentor');
  }

  // --- GUIDED TOUR CONTROLLER ---
  const tourSequence = ['sentinel', 'ledger', 'skyline', 'relnotes', 'dsa'];

  function startGuidedTour() {
    isTourActive = true;
    tourIndex = 0;
    if (btnGuidedTour) btnGuidedTour.innerText = '⏹️ Stop Tour';
    if (tourCaptionBox) tourCaptionBox.classList.remove('hidden');
    runTourStep();
  }

  function stopGuidedTour() {
    isTourActive = false;
    if (tourTimer) clearTimeout(tourTimer);
    if (btnGuidedTour) btnGuidedTour.innerText = '🚁 Guided Flyover Tour';
    if (tourCaptionBox) tourCaptionBox.classList.add('hidden');
  }

  function runTourStep() {
    if (!isTourActive) return;
    const modeKey = tourSequence[tourIndex];
    const view = presetViews[modeKey];

    targetCamPos.copy(view.pos);
    targetLookAt.copy(view.target);

    if (tourCaptionTitle) tourCaptionTitle.innerText = view.title;
    if (tourCaptionText) tourCaptionText.innerText = view.text;

    // Unlock corresponding stamp
    if (modeKey === 'sentinel') unlockStamp('sentinel');
    if (modeKey === 'ledger') unlockStamp('ledger');
    if (modeKey === 'skyline') unlockStamp('skyline');
    if (modeKey === 'relnotes') unlockStamp('relnotes');
    if (modeKey === 'dsa') unlockStamp('mentor');

    tourIndex = (tourIndex + 1) % tourSequence.length;
    tourTimer = setTimeout(runTourStep, 6000);
  }

  // --- SQL RISK SIMULATOR PUZZLE LOGIC ---
  const sampleSQLs = {
    safe_add_column: { query: 'SELECT * FROM users;', risk: 'LOW', lock: 1, integrity: 1, compat: 1, perf: 1, color: 0x10b981, rec: '✅ Safe standard query — no schema lock or risk.' },
    high_drop_table: { query: 'DROP TABLE users CASCADE;', risk: 'HIGH', lock: 6, integrity: 10, compat: 10, perf: 4, color: 0xef4444, rec: '❌ DROP TABLE is irreversible! Rename & backup first before dropping.' },
    high_add_not_null: { query: 'ALTER TABLE orders ADD COLUMN status INT NOT NULL;', risk: 'HIGH', lock: 8, integrity: 9, compat: 7, perf: 5, color: 0xef4444, rec: '❌ Adding NOT NULL column without DEFAULT will abort on existing rows.' },
    high_alter_type: { query: 'ALTER TABLE transactions ALTER COLUMN amount TYPE DECIMAL(15,2);', risk: 'HIGH', lock: 9, integrity: 8, compat: 8, perf: 6, color: 0xef4444, rec: '❌ Data type conversion triggers a full table rewrite lock on large tables.' },
    med_create_index: { query: 'CREATE INDEX idx_user_email ON users(email);', risk: 'MEDIUM', lock: 6, integrity: 1, compat: 1, perf: 5, color: 0xf59e0b, rec: '🟡 Lock risk on write traffic. Use CREATE INDEX CONCURRENTLY for zero-downtime.' },
    low_add_default: { query: 'ALTER TABLE users ADD COLUMN is_active BOOL DEFAULT true;', risk: 'LOW', lock: 2, integrity: 1, compat: 1, perf: 2, color: 0x10b981, rec: '✅ Adding column with DEFAULT is fast & safe in modern PostgreSQL.' }
  };

  function runSQLAnalysis() {
    const key = sqlPresetSelect ? sqlPresetSelect.value : 'safe_add_column';
    const data = sampleSQLs[key] || sampleSQLs.safe_add_column;

    if (mLock) mLock.innerText = `${data.lock}/10`;
    if (mIntegrity) mIntegrity.innerText = `${data.integrity}/10`;
    if (mCompat) mCompat.innerText = `${data.compat}/10`;
    if (mPerf) mPerf.innerText = `${data.perf}/10`;
    if (sqlRec) sqlRec.innerText = `💡 Recommendation: ${data.rec}`;

    if (sqlRiskBadge) {
      sqlRiskBadge.className = 'badge ';
      if (data.risk === 'HIGH') {
        sqlRiskBadge.classList.add('badge-risk-high');
        sqlRiskBadge.innerText = '🔴 HIGH RISK';
      } else if (data.risk === 'MEDIUM') {
        sqlRiskBadge.classList.add('badge-risk-med');
        sqlRiskBadge.innerText = '🟡 MEDIUM RISK';
      } else {
        sqlRiskBadge.classList.add('badge-risk-low');
        sqlRiskBadge.innerText = '🟢 LOW RISK';
      }
    }

    // Animate Sentinel Citadel 3D Laser Color
    laserMat.color.setHex(data.color);

    unlockStamp('sentinel');
    showToastNotification(`🔍 Schema Sentinel Scan: ${data.risk} RISK Detected!`);
  }

  // --- EVENT LISTENERS ---
  if (btnWorld) btnWorld.addEventListener('click', () => switchMode('world'));
  if (btnSentinel) btnSentinel.addEventListener('click', () => switchMode('sentinel'));
  if (btnLedger) btnLedger.addEventListener('click', () => switchMode('ledger'));
  if (btnSkyline) btnSkyline.addEventListener('click', () => switchMode('skyline'));
  if (btnDSA) btnDSA.addEventListener('click', () => switchMode('dsa'));

  if (btnGuidedTour) {
    btnGuidedTour.addEventListener('click', () => {
      if (isTourActive) stopGuidedTour();
      else startGuidedTour();
    });
  }

  if (btnAnalyzeSQL) btnAnalyzeSQL.addEventListener('click', runSQLAnalysis);
  if (sqlPresetSelect) sqlPresetSelect.addEventListener('change', runSQLAnalysis);

  if (btnPassportToggle) {
    btnPassportToggle.addEventListener('click', () => {
      if (passportModal) passportModal.classList.remove('hidden');
    });
  }

  if (passportCloseBtn) {
    passportCloseBtn.addEventListener('click', () => {
      if (passportModal) passportModal.classList.add('hidden');
    });
  }

  if (passportModal) {
    passportModal.addEventListener('click', (e) => {
      if (e.target === passportModal) passportModal.classList.add('hidden');
    });
  }

  // --- RENDER & ANIMATION LOOP ---
  function animate() {
    requestAnimationFrame(animate);
    animationTime += 0.015;

    // Smooth Camera Interpolation
    camera.position.lerp(targetCamPos, 0.04);
    if (controls) {
      controls.target.lerp(targetLookAt, 0.04);
      controls.update();
    } else {
      camera.lookAt(targetLookAt);
    }

    // 3D Object Rotations
    dbCore.rotation.y += 0.01;
    shieldRing1.rotation.z += 0.015;
    shieldRing2.rotation.z -= 0.015;

    coinGroup.rotation.y += 0.02;
    coinGroup.position.y = 11 + Math.sin(animationTime * 2) * 0.4;

    dome.rotation.y += 0.005;
    buildingGroup.rotation.y += 0.003;

    monolith.rotation.y += 0.004;
    crystal.rotation.y += 0.02;
    crystal.position.y = 10 + Math.sin(animationTime * 2.5) * 0.3;

    treeMeshGroup.rotation.y += 0.008;

    renderer.render(scene, camera);
  }

  animate();

  // Resize Handler
  window.addEventListener('resize', () => {
    const newW = container.clientWidth;
    const newH = container.clientHeight;
    camera.aspect = newW / newH;
    camera.updateProjectionMatrix();
    renderer.setSize(newW, newH);
  });

  // Initial Passport UI Sync
  updatePassportUI();
})();
