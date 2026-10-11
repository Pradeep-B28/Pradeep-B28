/* ==========================================================================
   PRADEEP 3D PORTFOLIO - PHOTOREALISTIC ARCHIPELAGO SHOWCASE
   Features: PBR Materials, ACES Tone Mapping, Soft Shadows, Dynamic Beacons,
   Reflective Dark Oceanic Floor, and Interactive Project Navigation
   ========================================================================== */

(function () {
  const container = document.getElementById('viz-3d-container');
  if (!container || typeof THREE === 'undefined') return;

  // DOM Elements
  const btnWorld = document.getElementById('btn-mode-world');
  const btnHub = document.getElementById('btn-mode-hub');
  const btnTheme = document.getElementById('btn-mode-theme');
  const btnSentinel = document.getElementById('btn-mode-sentinel');
  const btnLedger = document.getElementById('btn-mode-ledger');
  const btnSkyline = document.getElementById('btn-mode-skyline');
  const btnRelNotes = document.getElementById('btn-mode-relnotes');
  const btnDevstarter = document.getElementById('btn-mode-devstarter');
  const btnDSA = document.getElementById('btn-mode-dsa');
  const btnSorting = document.getElementById('btn-mode-sorting');
  
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
  scene.fog = new THREE.FogExp2(0x06090f, 0.016);

  const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
  const initialCamPos = new THREE.Vector3(0, 26, 40);
  const initialTarget = new THREE.Vector3(0, 2, 0);
  camera.position.copy(initialCamPos);
  camera.lookAt(initialTarget);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Photorealistic Tone Mapping
  if (THREE.ACESFilmicToneMapping) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
  }
  container.appendChild(renderer.domElement);

  // Floating HTML Tooltip for 3D Raycasting
  const tooltipEl = document.createElement('div');
  tooltipEl.className = 'viz-3d-tooltip hidden';
  tooltipEl.style.position = 'absolute';
  tooltipEl.style.pointerEvents = 'none';
  tooltipEl.style.zIndex = '30';
  container.appendChild(tooltipEl);

  // OrbitControls
  let controls;
  if (typeof THREE.OrbitControls !== 'undefined') {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 6;
    controls.maxDistance = 80;
  }

  // --- Photorealistic Lighting System ---
  const ambientLight = new THREE.AmbientLight(0x0c1527, 1.4);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
  dirLight.position.set(30, 50, 30);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 10;
  dirLight.shadow.camera.far = 120;
  dirLight.shadow.camera.left = -35;
  dirLight.shadow.camera.right = 35;
  dirLight.shadow.camera.top = 35;
  dirLight.shadow.camera.bottom = -35;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);

  // Colored Point Lights around Archipelago
  const lights = [
    { color: 0x22d3ee, pos: [0, 10, 0], intensity: 2.5 },     // Hub (Cyan)
    { color: 0x3b82f6, pos: [-16, 9, -12], intensity: 2.2 },  // Sentinel (Blue)
    { color: 0xf59e0b, pos: [16, 9, -12], intensity: 2.2 },   // Ledger (Amber)
    { color: 0xa855f7, pos: [0, 12, -24], intensity: 2.4 },   // GIT-viz (Purple)
    { color: 0x10b981, pos: [-22, 9, 8], intensity: 2.0 },    // Rel_Notes (Emerald)
    { color: 0xeab308, pos: [-12, 9, 22], intensity: 2.0 },   // Devstarter (Yellow)
    { color: 0x059669, pos: [12, 9, 22], intensity: 2.0 },    // DSA Forest (Green)
    { color: 0x8b5cf6, pos: [0, 9, 16], intensity: 2.2 },     // Theme Suite (Violet)
    { color: 0xec4899, pos: [22, 9, 8], intensity: 2.2 }      // Sorting Arena (Pink)
  ];

  lights.forEach(l => {
    const ptLight = new THREE.PointLight(l.color, l.intensity, 36);
    ptLight.position.set(...l.pos);
    scene.add(ptLight);
  });

  // State Management
  let currentMode = 'world';
  let isTourActive = false;
  let tourIndex = 0;
  let tourTimer = null;
  let animationTime = 0;

  // Passport Stamps State for 9 Repositories
  const passportState = {
    theme: false,
    hub: false,
    sentinel: false,
    ledger: false,
    skyline: false,
    relnotes: false,
    devstarter: false,
    mentor: false,
    sorting: false
  };

  function unlockStamp(key) {
    if (!passportState[key]) {
      passportState[key] = true;
      updatePassportUI();
      showToastNotification(`🏆 Architecture Badge Unlocked: ${getStampName(key)}!`);
    }
  }

  function getStampName(key) {
    const names = {
      theme: '3D Theme Architect (Portfolio)',
      hub: 'Portfolio Hub (Pradeep-B28)',
      sentinel: 'Sentinel Gatekeeper (Schema-Sentinel)',
      ledger: 'Ledger Architect (Ledger_Expense_Tracker)',
      skyline: 'Skyline Navigator (GIT_3D_Portfolio)',
      relnotes: 'AI Release Scribe (Rel_Notes)',
      devstarter: 'Container Master (Devstarter)',
      mentor: 'Grand Mentor (JAVA-DSA-Roadmap)',
      sorting: 'Algorithm Specialist (JAVA-Sorting-Visualizer)'
    };
    return names[key] || 'Architecture Badge';
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
          if (statusEl) statusEl.innerText = 'UNLOCKED ✨';
        }
      }
    });

    if (passportCountEl) passportCountEl.innerText = `${count}/9`;
    if (passportProgressEl) passportProgressEl.style.width = `${(count / 9) * 100}%`;

    if (explorerRankEl) {
      if (count === 0) explorerRankEl.innerText = 'Apprentice Explorer (0/9 Badges)';
      else if (count < 4) explorerRankEl.innerText = `Senior Adventurer (${count}/9 Badges)`;
      else if (count < 9) explorerRankEl.innerText = `Lead Code Explorer (${count}/9 Badges)`;
      else explorerRankEl.innerText = '👑 Master Architect Explorer (9/9 Complete!)';
    }
  }

  function showToastNotification(msg) {
    let toast = document.getElementById('viz-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'viz-toast';
      toast.className = 'viz-toast';
      container.appendChild(toast);
    }
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3200);
  }

  // --- 1. PROCEDURAL ARCHIPELAGO WORLD CONTAINER ---
  const worldGroup = new THREE.Group();
  scene.add(worldGroup);

  // Photorealistic Reflective Dark Oceanic Grid Floor
  const waterGeo = new THREE.CylinderGeometry(46, 46, 0.4, 64);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x050a14,
    roughness: 0.15,
    metalness: 0.85,
    transparent: true,
    opacity: 0.94
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = -0.4;
  waterMesh.receiveShadow = true;
  worldGroup.add(waterMesh);

  // Concentric Neon Grid Rings on Floor
  [12, 22, 32, 42].forEach(radius => {
    const ringGeo = new THREE.RingGeometry(radius - 0.05, radius + 0.05, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.18;
    worldGroup.add(ring);
  });

  // Floating Atmospheric Stardust Motes
  const moteGeo = new THREE.BufferGeometry();
  const moteCount = 180;
  const motePos = new Float32Array(moteCount * 3);
  for (let i = 0; i < moteCount * 3; i += 3) {
    motePos[i] = (Math.random() - 0.5) * 60;
    motePos[i + 1] = Math.random() * 18 + 0.5;
    motePos[i + 2] = (Math.random() - 0.5) * 60;
  }
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  const moteMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.22, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending });
  const motes = new THREE.Points(moteGeo, moteMat);
  worldGroup.add(motes);

  // Common Island Base Material (Dark Slate PBR)
  const islandMat = new THREE.MeshStandardMaterial({
    color: 0x0d1525,
    roughness: 0.35,
    metalness: 0.6
  });

  const pathMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.3
  });

  const raycastTargets = [];

  // Helper: Beacon Spire
  function createBeaconSpire(colorHex, height = 18) {
    const beamGeo = new THREE.CylinderGeometry(0.04, 0.04, height, 8);
    beamGeo.translate(0, height / 2, 0);
    const beamMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.45 });
    return new THREE.Mesh(beamGeo, beamMat);
  }

  // --- 2. LANDMARK 1: CENTRAL PORTFOLIO HUB (Zone 1: X=0, Z=0) ---
  const hubGroup = new THREE.Group();
  hubGroup.position.set(0, 0, 0);
  worldGroup.add(hubGroup);

  const hubBase = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6.2, 1.2, 32), islandMat);
  hubBase.position.y = 0;
  hubBase.castShadow = true;
  hubBase.receiveShadow = true;
  hubGroup.add(hubBase);
  hubGroup.add(createBeaconSpire(0x22d3ee, 22));

  // Central Hologram Diamond Core
  const diamondGeo = new THREE.OctahedronGeometry(1.8, 0);
  const diamondMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x0891b2,
    emissiveIntensity: 0.9,
    metalness: 0.8,
    roughness: 0.1
  });
  const diamondCore = new THREE.Mesh(diamondGeo, diamondMat);
  diamondCore.position.y = 4.5;
  diamondCore.castShadow = true;
  diamondCore.userData = { mode: 'hub', title: 'Pradeep-B28 Portfolio Hub', repo: 'Pradeep-B28', desc: 'Official 3D Developer Portfolio & Web Showcase' };
  hubGroup.add(diamondCore);
  raycastTargets.push(diamondCore);

  const hubRingGeo = new THREE.TorusGeometry(3.2, 0.08, 16, 32);
  const hubRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const hubRing = new THREE.Mesh(hubRingGeo, hubRingMat);
  hubRing.position.y = 4.5;
  hubRing.rotation.x = Math.PI / 3;
  hubGroup.add(hubRing);

  // --- LANDMARK 1B: PORTFOLIO 3D THEME SUITE (Zone 9: X=0, Z=16) ---
  const themeGroup = new THREE.Group();
  themeGroup.position.set(0, 0, 16);
  worldGroup.add(themeGroup);

  const baseTheme = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.8, 1.2, 8), islandMat);
  baseTheme.position.y = 0;
  baseTheme.castShadow = true;
  baseTheme.receiveShadow = true;
  themeGroup.add(baseTheme);
  themeGroup.add(createBeaconSpire(0x8b5cf6, 18));

  const themePrismGeo = new THREE.IcosahedronGeometry(1.9, 0);
  const themePrismMat = new THREE.MeshStandardMaterial({
    color: 0x8b5cf6,
    emissive: 0x6d28d9,
    emissiveIntensity: 0.8,
    metalness: 0.7,
    roughness: 0.2
  });
  const themePrism = new THREE.Mesh(themePrismGeo, themePrismMat);
  themePrism.position.y = 4.5;
  themePrism.castShadow = true;
  themePrism.userData = { mode: 'theme', title: 'Portfolio: 3D Theme Suite', repo: 'Portfolio', desc: '6 Distinct Visual Themes (Film Studio, Galaxy, Retro Arcade, Bank Vault)' };
  themeGroup.add(themePrism);
  raycastTargets.push(themePrism);

  const themeRingGeo = new THREE.TorusGeometry(3.0, 0.08, 16, 32);
  const themeRingMat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
  const themeRing = new THREE.Mesh(themeRingGeo, themeRingMat);
  themeRing.position.y = 4.5;
  themeRing.rotation.x = Math.PI / 4;
  themeGroup.add(themeRing);

  // --- 3. LANDMARK 2: SCHEMA SENTINEL CITADEL (Zone 2: X=-16, Z=-12) ---
  const sentinelGroup = new THREE.Group();
  sentinelGroup.position.set(-16, 0, -12);
  worldGroup.add(sentinelGroup);

  const baseSentinel = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6, 1.2, 8), islandMat);
  baseSentinel.position.y = 0;
  baseSentinel.castShadow = true;
  baseSentinel.receiveShadow = true;
  sentinelGroup.add(baseSentinel);
  sentinelGroup.add(createBeaconSpire(0x3b82f6, 18));

  const fortressGeo = new THREE.BoxGeometry(4.2, 2.5, 4.2);
  const fortressMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.85, roughness: 0.2 });
  const fortress = new THREE.Mesh(fortressGeo, fortressMat);
  fortress.position.y = 2.0;
  fortress.castShadow = true;
  sentinelGroup.add(fortress);

  const dbCoreGeo = new THREE.CylinderGeometry(1.4, 1.4, 3, 16);
  const dbCoreMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, emissive: 0x1d4ed8, emissiveIntensity: 0.7, metalness: 0.8, roughness: 0.2 });
  const dbCore = new THREE.Mesh(dbCoreGeo, dbCoreMat);
  dbCore.position.y = 6.2;
  dbCore.castShadow = true;
  dbCore.userData = { mode: 'sentinel', title: 'Schema Sentinel Citadel', repo: 'Schema-Sentinel', desc: 'PostgreSQL Pre-Migration AST SQL Risk Engine' };
  sentinelGroup.add(dbCore);
  raycastTargets.push(dbCore);

  const shieldRingGeo = new THREE.TorusGeometry(3.2, 0.08, 16, 32);
  const shieldRingMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
  const shieldRing1 = new THREE.Mesh(shieldRingGeo, shieldRingMat);
  shieldRing1.position.y = 5.5;
  shieldRing1.rotation.x = Math.PI / 3;
  sentinelGroup.add(shieldRing1);

  const shieldRing2 = new THREE.Mesh(shieldRingGeo, shieldRingMat);
  shieldRing2.position.y = 6.8;
  shieldRing2.rotation.x = -Math.PI / 3;
  sentinelGroup.add(shieldRing2);

  // --- 4. LANDMARK 3: LEDGER VAULT (Zone 3: X=16, Z=-12) ---
  const ledgerGroup = new THREE.Group();
  ledgerGroup.position.set(16, 0, -12);
  worldGroup.add(ledgerGroup);

  const baseLedger = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.8, 1.2, 6), islandMat);
  baseLedger.position.y = 0;
  baseLedger.castShadow = true;
  baseLedger.receiveShadow = true;
  ledgerGroup.add(baseLedger);
  ledgerGroup.add(createBeaconSpire(0xf59e0b, 18));

  const ledgerTowerGeo = new THREE.BoxGeometry(3.2, 8.5, 3.2);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xf59e0b, metalness: 0.7, roughness: 0.15, transmission: 0.5, transparent: true, opacity: 0.85 });
  const ledgerTower = new THREE.Mesh(ledgerTowerGeo, glassMat);
  ledgerTower.position.y = 4.8;
  ledgerTower.castShadow = true;
  ledgerTower.userData = { mode: 'ledger', title: 'Ledger Vault & Tower', repo: 'Ledger_Expense_Tracker', desc: 'MERN + PWA + Capacitor Enterprise AI Expense Suite' };
  ledgerGroup.add(ledgerTower);
  raycastTargets.push(ledgerTower);

  const coinGroup = new THREE.Group();
  coinGroup.position.y = 10.5;
  const coinGeo = new THREE.IcosahedronGeometry(1.2, 1);
  const coinMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.8, metalness: 0.9, roughness: 0.1 });
  const mainCoin = new THREE.Mesh(coinGeo, coinMat);
  coinGroup.add(mainCoin);
  ledgerGroup.add(coinGroup);

  // --- 5. LANDMARK 4: GIT-VIZ OBSERVATORY (Zone 4: X=0, Z=-24) ---
  const skylineGroup = new THREE.Group();
  skylineGroup.position.set(0, 0, -24);
  worldGroup.add(skylineGroup);

  const baseSkyline = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.8, 1.2, 8), islandMat);
  baseSkyline.position.y = 0;
  baseSkyline.castShadow = true;
  baseSkyline.receiveShadow = true;
  skylineGroup.add(baseSkyline);
  skylineGroup.add(createBeaconSpire(0xa855f7, 20));

  const domeGeo = new THREE.SphereGeometry(2.8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, emissive: 0x6d28d9, emissiveIntensity: 0.6, metalness: 0.8, roughness: 0.2 });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.position.y = 2.5;
  dome.castShadow = true;
  dome.userData = { mode: 'skyline', title: 'GIT-viz Skyline Observatory', repo: 'GIT_3D_Portfolio', desc: 'Real-Time 3D GitHub Profile & Repository Analytics Visualizer' };
  skylineGroup.add(dome);
  raycastTargets.push(dome);

  const buildingGroup = new THREE.Group();
  buildingGroup.position.y = 0.6;
  const buildingColors = [0x1e293b, 0x0e4429, 0x006d32, 0x26a641, 0x39d353];
  for (let c = -2; c <= 2; c++) {
    for (let r = -2; r <= 2; r++) {
      if (Math.abs(c) === 2 || Math.abs(r) === 2) {
        const lvl = Math.floor(Math.random() * 5);
        const h = lvl === 0 ? 0.4 : lvl * 1.4 + 1;
        const bGeo = new THREE.BoxGeometry(0.7, h, 0.7);
        bGeo.translate(0, h / 2, 0);
        const bMesh = new THREE.Mesh(bGeo, new THREE.MeshStandardMaterial({ color: buildingColors[lvl], metalness: 0.6, roughness: 0.3 }));
        bMesh.position.set(c * 1.1, 0, r * 1.1);
        bMesh.castShadow = true;
        buildingGroup.add(bMesh);
      }
    }
  }
  skylineGroup.add(buildingGroup);

  // --- 6. LANDMARK 5: REL_NOTES MONOLITH (Zone 5: X=-22, Z=8) ---
  const notesGroup = new THREE.Group();
  notesGroup.position.set(-22, 0, 8);
  worldGroup.add(notesGroup);

  const baseNotes = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.8, 1.2, 6), islandMat);
  baseNotes.position.y = 0;
  baseNotes.castShadow = true;
  baseNotes.receiveShadow = true;
  notesGroup.add(baseNotes);
  notesGroup.add(createBeaconSpire(0x10b981, 18));

  const monolithGeo = new THREE.BoxGeometry(2.4, 7.5, 1.2);
  const monolithMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.7, metalness: 0.85, roughness: 0.2 });
  const monolith = new THREE.Mesh(monolithGeo, monolithMat);
  monolith.position.y = 4.2;
  monolith.castShadow = true;
  monolith.userData = { mode: 'relnotes', title: 'Rel_Notes AI Monolith', repo: 'Rel_Notes', desc: 'AI-Powered Semantic Release Notes & Changelog Generator' };
  notesGroup.add(monolith);
  raycastTargets.push(monolith);

  // Floating crystal above monolith
  const crystalGeo = new THREE.OctahedronGeometry(0.9, 0);
  const crystalMat = new THREE.MeshBasicMaterial({ color: 0x6ee7b7 });
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  crystal.position.y = 9.5;
  notesGroup.add(crystal);

  // --- 7. LANDMARK 6: DEVSTARTER CONTAINER DOCK (Zone 6: X=-12, Z=22) ---
  const dockGroup = new THREE.Group();
  dockGroup.position.set(-12, 0, 22);
  worldGroup.add(dockGroup);

  const baseDock = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.8, 1.2, 8), islandMat);
  baseDock.position.y = 0;
  baseDock.castShadow = true;
  baseDock.receiveShadow = true;
  dockGroup.add(baseDock);
  dockGroup.add(createBeaconSpire(0xeab308, 18));

  const containerColors = [0x3b82f6, 0xef4444, 0x10b981, 0xf59e0b];
  const dockCrates = new THREE.Group();
  dockCrates.position.y = 1.0;
  for (let i = 0; i < 4; i++) {
    const crateGeo = new THREE.BoxGeometry(1.6, 1.4, 3.0);
    const crateMat = new THREE.MeshStandardMaterial({ color: containerColors[i % 4], metalness: 0.7, roughness: 0.3 });
    const crate = new THREE.Mesh(crateGeo, crateMat);
    crate.position.set((i % 2 - 0.5) * 2.0, Math.floor(i / 2) * 1.5 + 0.8, (i % 2) * 0.5);
    crate.castShadow = true;
    dockCrates.add(crate);
  }
  dockCrates.userData = { mode: 'devstarter', title: 'Devstarter Container Dock', repo: 'Devstarter', desc: 'Zero-Config Multi-Language Docker Devcontainers' };
  dockGroup.add(dockCrates);
  raycastTargets.push(dockCrates);

  // --- 8. LANDMARK 7: DSA MENTORSHIP FOREST (Zone 7: X=12, Z=22) ---
  const dsaGroup = new THREE.Group();
  dsaGroup.position.set(12, 0, 22);
  worldGroup.add(dsaGroup);

  const baseDSA = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6.2, 1.2, 8), islandMat);
  baseDSA.position.y = 0;
  baseDSA.castShadow = true;
  baseDSA.receiveShadow = true;
  dsaGroup.add(baseDSA);
  dsaGroup.add(createBeaconSpire(0x059669, 18));

  const treeMeshGroup = new THREE.Group();
  treeMeshGroup.position.y = 0.8;
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2;
    const rad = 2.4;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.6, 8), new THREE.MeshStandardMaterial({ color: 0x475569 }));
    trunk.position.set(Math.cos(angle) * rad, 0.8, Math.sin(angle) * rad);
    trunk.castShadow = true;
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 8), new THREE.MeshStandardMaterial({ color: 0x059669, emissive: 0x047857, emissiveIntensity: 0.4 }));
    crown.position.set(Math.cos(angle) * rad, 2.4, Math.sin(angle) * rad);
    crown.castShadow = true;
    treeMeshGroup.add(trunk);
    treeMeshGroup.add(crown);
  }
  const mainStage = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 1.0, 16), new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.8, roughness: 0.2 }));
  mainStage.position.y = 1.0;
  mainStage.castShadow = true;
  mainStage.userData = { mode: 'dsa', title: 'DSA & Mentorship Forest', repo: 'JAVA-DSA-Roadmap', desc: '7,500+ Engineers Mentored in Core Java & Algorithms' };
  dsaGroup.add(mainStage);
  dsaGroup.add(treeMeshGroup);
  raycastTargets.push(mainStage);

  // --- 9. LANDMARK 8: SORTING ARENA (Zone 8: X=22, Z=8) ---
  const sortGroup = new THREE.Group();
  sortGroup.position.set(22, 0, 8);
  worldGroup.add(sortGroup);

  const baseSort = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.8, 1.2, 8), islandMat);
  baseSort.position.y = 0;
  baseSort.castShadow = true;
  baseSort.receiveShadow = true;
  sortGroup.add(baseSort);
  sortGroup.add(createBeaconSpire(0xec4899, 18));

  const barPillars = [];
  const barGroup = new THREE.Group();
  barGroup.position.y = 0.8;
  for (let i = 0; i < 9; i++) {
    const h = 1.2 + i * 0.55;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.45, h, 0.45), new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xbe185d, emissiveIntensity: 0.5, metalness: 0.7, roughness: 0.2 }));
    bar.position.set((i - 4) * 0.7, h / 2, 0);
    bar.castShadow = true;
    barGroup.add(bar);
    barPillars.push(bar);
  }
  barGroup.userData = { mode: 'sorting', title: 'Searching & Sorting Arena', repo: 'JAVA-Searching-Sorting-Visualizer', desc: 'Interactive Algorithm Visualizer & Sorting Simulator' };
  sortGroup.add(barGroup);
  raycastTargets.push(barGroup);

  // --- 10. CONNECTING ENERGY BRIDGES ---
  const bridges = [
    [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 16)],
    [new THREE.Vector3(0, 0, 0), new THREE.Vector3(-16, 0, -12)],
    [new THREE.Vector3(0, 0, 0), new THREE.Vector3(16, 0, -12)],
    [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -24)],
    [new THREE.Vector3(0, 0, 0), new THREE.Vector3(-22, 0, 8)],
    [new THREE.Vector3(0, 0, 0), new THREE.Vector3(-12, 0, 22)],
    [new THREE.Vector3(0, 0, 0), new THREE.Vector3(12, 0, 22)],
    [new THREE.Vector3(0, 0, 0), new THREE.Vector3(22, 0, 8)]
  ];

  bridges.forEach(([start, end]) => {
    const points = [start, end];
    const bGeo = new THREE.BufferGeometry().setFromPoints(points);
    const bridgeLine = new THREE.Line(bGeo, pathMat);
    worldGroup.add(bridgeLine);
  });

  // --- CAMERA MOVEMENT & VIEW PRESETS FOR ALL 9 REPOS ---
  const presetViews = {
    world: { pos: new THREE.Vector3(0, 26, 40), target: new THREE.Vector3(0, 2, 0), title: 'Archipelago Overview', text: 'Panoramic overview of all 9 engineering systems. Click any 3D landmark or run Guided Flyover Tour to inspect.' },
    hub: { pos: new THREE.Vector3(0, 10, 14), target: new THREE.Vector3(0, 4, 0), title: 'Central 3D Portfolio Hub', text: 'Official 3D interactive portfolio & developer showcase built with Three.js WebGL & glassmorphism.' },
    theme: { pos: new THREE.Vector3(0, 10, 26), target: new THREE.Vector3(0, 4, 16), title: '3D Theme Suite Gallery', text: 'Interactive 3D WebGL developer portfolio suite featuring 6 distinct visual themes (React 18, Three.js, WebGL shaders).' },
    sentinel: { pos: new THREE.Vector3(-16, 10, -4), target: new THREE.Vector3(-16, 5, -12), title: 'Schema Sentinel Citadel', text: 'Pre-migration risk analysis engine for PostgreSQL. AST SQL parser, 4-axis risk matrix & automated GitHub Action PR gatekeeper.' },
    ledger: { pos: new THREE.Vector3(16, 10, -4), target: new THREE.Vector3(16, 5, -12), title: 'Ledger Vault & Bank Tower', text: 'Market-ready MERN + PWA + Capacitor Android expense suite with 0ms Optimistic UI engine and bank cloud sync.' },
    skyline: { pos: new THREE.Vector3(0, 12, -14), target: new THREE.Vector3(0, 4, -24), title: 'GIT-viz Skyline Observatory', text: 'Transforms GitHub profiles into 3D city skylines & repo galaxies with WASD drone flight and Web Audio melodic synth.' },
    relnotes: { pos: new THREE.Vector3(-22, 10, 16), target: new THREE.Vector3(-22, 4, 8), title: 'Rel_Notes AI Monolith', text: 'AI-powered release notes generator built with TypeScript and Groq API. Structures Git commits into polished releases.' },
    devstarter: { pos: new THREE.Vector3(-12, 10, 30), target: new THREE.Vector3(-12, 4, 22), title: 'Devstarter Container Dock', text: 'Zero-configuration devcontainer templates for Python, Node, Go, Rust, C++, and Java. Instant VS Code launch.' },
    dsa: { pos: new THREE.Vector3(12, 10, 30), target: new THREE.Vector3(12, 4, 22), title: 'Mentorship Forest & DSA Stage', text: '7,500+ Engineers Mentored across Core Java, JVM internals, multithreading, arrays, graphs & dynamic programming.' },
    sorting: { pos: new THREE.Vector3(22, 10, 16), target: new THREE.Vector3(22, 4, 8), title: 'Searching & Sorting Arena', text: 'Interactive algorithm visualization application rendering sorting steps and binary search comparisons frame-by-frame.' }
  };

  let targetCamPos = camera.position.clone();
  let targetLookAt = initialTarget.clone();

  function switchMode(modeKey) {
    if (isTourActive && modeKey !== 'tour') stopGuidedTour();
    currentMode = modeKey;

    [btnWorld, btnHub, btnTheme, btnSentinel, btnLedger, btnSkyline, btnRelNotes, btnDevstarter, btnDSA, btnSorting].forEach(b => {
      if (b) b.classList.remove('active');
    });

    const activeBtnMap = {
      world: btnWorld,
      hub: btnHub,
      theme: btnTheme,
      sentinel: btnSentinel,
      ledger: btnLedger,
      skyline: btnSkyline,
      relnotes: btnRelNotes,
      devstarter: btnDevstarter,
      dsa: btnDSA,
      sorting: btnSorting
    };
    if (activeBtnMap[modeKey]) activeBtnMap[modeKey].classList.add('active');

    const view = presetViews[modeKey] || presetViews.world;
    targetCamPos.copy(view.pos);
    targetLookAt.copy(view.target);

    if (statusText) statusText.innerText = `Navigation: ${view.title} • Active`;

    // Show/Hide SQL Game Panel
    if (modeKey === 'sentinel') {
      if (sqlGamePanel) sqlGamePanel.classList.remove('hidden');
      unlockStamp('sentinel');
    } else {
      if (sqlGamePanel) sqlGamePanel.classList.add('hidden');
    }

    if (modeKey === 'hub') unlockStamp('hub');
    if (modeKey === 'theme') unlockStamp('theme');
    if (modeKey === 'ledger') unlockStamp('ledger');
    if (modeKey === 'skyline') unlockStamp('skyline');
    if (modeKey === 'relnotes') unlockStamp('relnotes');
    if (modeKey === 'devstarter') unlockStamp('devstarter');
    if (modeKey === 'dsa') unlockStamp('mentor');
    if (modeKey === 'sorting') unlockStamp('sorting');
  }

  // --- GUIDED FLYOVER TOUR ---
  const tourOrder = ['world', 'hub', 'sentinel', 'ledger', 'skyline', 'relnotes', 'devstarter', 'dsa', 'sorting', 'theme'];

  function startGuidedTour() {
    isTourActive = true;
    tourIndex = 0;
    if (btnGuidedTour) {
      btnGuidedTour.classList.add('active');
      btnGuidedTour.innerText = '⏹ Exit Flyover Tour';
    }
    if (tourCaptionBox) tourCaptionBox.classList.remove('hidden');
    nextTourStep();
  }

  function stopGuidedTour() {
    isTourActive = false;
    clearTimeout(tourTimer);
    if (btnGuidedTour) {
      btnGuidedTour.classList.remove('active');
      btnGuidedTour.innerText = '▶ Start Flyover Tour';
    }
    if (tourCaptionBox) tourCaptionBox.classList.add('hidden');
  }

  function nextTourStep() {
    if (!isTourActive) return;
    const modeKey = tourOrder[tourIndex];
    switchMode(modeKey);

    const view = presetViews[modeKey];
    if (tourCaptionTitle && tourCaptionText && view) {
      tourCaptionTitle.innerText = view.title;
      tourCaptionText.innerText = view.text;
    }

    tourIndex = (tourIndex + 1) % tourOrder.length;
    tourTimer = setTimeout(nextTourStep, 5000);
  }

  // --- SQL GAME PANEL LOGIC (SCHEMA SENTINEL SIMULATOR) ---
  const sqlPresets = {
    drop_column: {
      sql: 'ALTER TABLE users DROP COLUMN email;',
      lock: 'ACCESS EXCLUSIVE (High)',
      integrity: 'Critical (Data Loss)',
      compat: 'Breaking Change',
      perf: 'Table Rewrite Blocked',
      risk: 'CRITICAL',
      badgeClass: 'risk-critical',
      rec: 'Zero downtime deployment requires deprecating column in code first, then dropping in subsequent release.'
    },
    add_not_null: {
      sql: 'ALTER TABLE orders ADD COLUMN amount numeric NOT NULL;',
      lock: 'ACCESS EXCLUSIVE (High)',
      integrity: 'High (Constraint Violation)',
      compat: 'Breaking Change',
      perf: 'Full Table Scan & Rewrite',
      risk: 'HIGH',
      badgeClass: 'risk-high',
      rec: 'Add column as NULLABLE, backfill rows in batches, then add NOT NULL with VALIDATE CONSTRAINT.'
    },
    create_index: {
      sql: 'CREATE INDEX idx_orders_customer ON orders (customer_id);',
      lock: 'SHARE LOCK (Medium)',
      integrity: 'Safe',
      compat: 'Backwards Compatible',
      perf: 'Writes Blocked on Large Table',
      risk: 'MEDIUM',
      badgeClass: 'risk-medium',
      rec: 'Always use CREATE INDEX CONCURRENTLY in production to avoid blocking writes.'
    },
    concurrent_index: {
      sql: 'CREATE INDEX CONCURRENTLY idx_users_active ON users (status);',
      lock: 'SHARE UPDATE EXCLUSIVE (Minimal)',
      integrity: 'Safe',
      compat: 'Non-breaking',
      perf: 'Zero Write Blocking',
      risk: 'LOW (PRODUCTION SAFE)',
      badgeClass: 'risk-low',
      rec: 'Safe for production. Reads and writes continue uninterrupted during background build.'
    }
  };

  function runSQLAnalysis() {
    const val = sqlPresetSelect ? sqlPresetSelect.value : 'drop_column';
    const data = sqlPresets[val] || sqlPresets.drop_column;

    if (sqlRiskBadge) {
      sqlRiskBadge.innerText = data.risk;
      sqlRiskBadge.className = `risk-badge ${data.badgeClass}`;
    }
    if (mLock) mLock.innerText = data.lock;
    if (mIntegrity) mIntegrity.innerText = data.integrity;
    if (mCompat) mCompat.innerText = data.compat;
    if (mPerf) mPerf.innerText = data.perf;
    if (sqlRec) sqlRec.innerText = data.rec;

    unlockStamp('sentinel');
  }

  // --- RAYCASTING & INTERACTION ---
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onPointerMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(raycastTargets, true);

    if (intersects.length > 0) {
      let targetObj = intersects[0].object;
      while (targetObj && !targetObj.userData.title && targetObj.parent) {
        targetObj = targetObj.parent;
      }

      if (targetObj && targetObj.userData && targetObj.userData.title) {
        tooltipEl.innerHTML = `<strong>${targetObj.userData.title}</strong><br/><span>${targetObj.userData.desc}</span>`;
        tooltipEl.style.left = `${event.clientX - rect.left + 15}px`;
        tooltipEl.style.top = `${event.clientY - rect.top + 15}px`;
        tooltipEl.classList.remove('hidden');
        renderer.domElement.style.cursor = 'pointer';
        return;
      }
    }

    tooltipEl.classList.add('hidden');
    renderer.domElement.style.cursor = 'default';
  }

  function onPointerClick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(raycastTargets, true);

    if (intersects.length > 0) {
      let targetObj = intersects[0].object;
      while (targetObj && !targetObj.userData.mode && targetObj.parent) {
        targetObj = targetObj.parent;
      }
      if (targetObj && targetObj.userData && targetObj.userData.mode) {
        switchMode(targetObj.userData.mode);
      }
    }
  }

  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('click', onPointerClick);

  // --- EVENT LISTENERS FOR MODE BUTTONS ---
  if (btnWorld) btnWorld.addEventListener('click', () => switchMode('world'));
  if (btnHub) btnHub.addEventListener('click', () => switchMode('hub'));
  if (btnTheme) btnTheme.addEventListener('click', () => switchMode('theme'));
  if (btnSentinel) btnSentinel.addEventListener('click', () => switchMode('sentinel'));
  if (btnLedger) btnLedger.addEventListener('click', () => switchMode('ledger'));
  if (btnSkyline) btnSkyline.addEventListener('click', () => switchMode('skyline'));
  if (btnRelNotes) btnRelNotes.addEventListener('click', () => switchMode('relnotes'));
  if (btnDevstarter) btnDevstarter.addEventListener('click', () => switchMode('devstarter'));
  if (btnDSA) btnDSA.addEventListener('click', () => switchMode('dsa'));
  if (btnSorting) btnSorting.addEventListener('click', () => switchMode('sorting'));

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

    camera.position.lerp(targetCamPos, 0.04);
    if (controls) {
      controls.target.lerp(targetLookAt, 0.04);
      controls.update();
    } else {
      camera.lookAt(targetLookAt);
    }

    // 3D Object Harmonic Rotations & Levitation
    diamondCore.rotation.y += 0.015;
    hubRing.rotation.z += 0.02;

    themePrism.rotation.y += 0.012;
    themePrism.rotation.x += 0.008;
    themeRing.rotation.z += 0.018;

    dbCore.rotation.y += 0.01;
    shieldRing1.rotation.z += 0.015;
    shieldRing2.rotation.z -= 0.015;

    coinGroup.rotation.y += 0.02;
    coinGroup.position.y = 10.5 + Math.sin(animationTime * 2) * 0.4;

    dome.rotation.y += 0.005;
    buildingGroup.rotation.y += 0.003;

    monolith.rotation.y += 0.004;
    crystal.rotation.y += 0.02;
    crystal.position.y = 9.5 + Math.sin(animationTime * 2.5) * 0.3;

    treeMeshGroup.rotation.y += 0.008;

    // Sorting Bar Animations
    barPillars.forEach((bar, idx) => {
      const scaleY = 1 + Math.sin(animationTime * 3 + idx * 0.8) * 0.25;
      bar.scale.set(1, Math.max(0.3, scaleY), 1);
    });

    // Motes subtle vertical drift
    motes.rotation.y += 0.0005;

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

  // Initial Badge Sync
  updatePassportUI();
})();
