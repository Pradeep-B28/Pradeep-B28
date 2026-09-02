/* ==========================================================================
   PRADEEP 3D PORTFOLIO - THE ARCHIPELAGO OF PRADEEP (3D TOURIST WORLD & GAME)
   ========================================================================== */

(function () {
  const container = document.getElementById('viz-3d-container');
  if (!container || typeof THREE === 'undefined') return;

  // DOM Elements
  const btnWorld = document.getElementById('btn-mode-world');
  const btnHub = document.getElementById('btn-mode-hub');
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
  scene.fog = new THREE.FogExp2(0x07090e, 0.015);

  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  const initialCamPos = new THREE.Vector3(0, 28, 42);
  const initialTarget = new THREE.Vector3(0, 2, 0);
  camera.position.copy(initialCamPos);
  camera.lookAt(initialTarget);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 75;
  }

  // Lighting System
  const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.8);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(25, 45, 25);
  dirLight.castShadow = true;
  scene.add(dirLight);

  // Colored Point Lights around Archipelago
  const lights = [
    { color: 0x22d3ee, pos: [0, 10, 0] },     // Hub (Cyan)
    { color: 0x3b82f6, pos: [-16, 8, -12] },  // Sentinel (Blue)
    { color: 0xf59e0b, pos: [16, 8, -12] },   // Ledger (Amber)
    { color: 0xa855f7, pos: [0, 12, -24] },   // GIT-viz (Purple)
    { color: 0x10b981, pos: [-22, 8, 8] },    // Rel_Notes (Emerald)
    { color: 0xeab308, pos: [-12, 8, 22] },   // Devstarter (Yellow)
    { color: 0x059669, pos: [12, 8, 22] },    // DSA Forest (Green)
    { color: 0xec4899, pos: [22, 8, 8] }      // Sorting Arena (Pink)
  ];

  lights.forEach(l => {
    const ptLight = new THREE.PointLight(l.color, 2.2, 35);
    ptLight.position.set(...l.pos);
    scene.add(ptLight);
  });

  // State Management
  let currentMode = 'world';
  let isTourActive = false;
  let tourIndex = 0;
  let tourTimer = null;
  let animationTime = 0;

  // Passport Stamps State for 8 Repositories
  const passportState = {
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
      showToastNotification(`🏆 Passport Stamp Unlocked: ${getStampName(key)}!`);
    }
  }

  function getStampName(key) {
    const names = {
      hub: '3D Portfolio Hub (Pradeep-B28)',
      sentinel: 'Sentinel Gatekeeper (Schema-Sentinel)',
      ledger: 'Ledger Architect (Ledger_Expense_Tracker)',
      skyline: 'Skyline Navigator (GIT---viz)',
      relnotes: 'AI Release Scribe (Rel_Notes)',
      devstarter: 'Container Master (Devstarter)',
      mentor: 'Grand Mentor (JAVA-DSA-Roadmap)',
      sorting: 'Algorithm Specialist (JAVA-Sorting-Visualizer)'
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

    if (passportCountEl) passportCountEl.innerText = `${count}/8`;
    if (passportProgressEl) passportProgressEl.style.width = `${(count / 8) * 100}%`;

    if (explorerRankEl) {
      if (count === 0) explorerRankEl.innerText = 'Novice Tourist (0/8 Stamps)';
      else if (count < 4) explorerRankEl.innerText = 'Apprentice Adventurer (' + count + '/8 Stamps)';
      else if (count < 8) explorerRankEl.innerText = 'Senior Code Explorer (' + count + '/8 Stamps)';
      else explorerRankEl.innerText = '👑 Master Architect Explorer (8/8 Complete!)';
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

  // Ocean Water Mesh
  const waterGeo = new THREE.PlaneGeometry(160, 160, 32, 32);
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

  // Common Island Base Material
  const islandMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.7,
    metalness: 0.2
  });

  const pathMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
    wireframe: true,
    transparent: true,
    opacity: 0.35
  });

  const raycastTargets = [];

  // --- 2. LANDMARK 1: CENTRAL PORTFOLIO HUB (Zone 1: X=0, Z=0) ---
  const hubGroup = new THREE.Group();
  hubGroup.position.set(0, 0, 0);
  worldGroup.add(hubGroup);

  const hubBase = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6, 1.2, 32), islandMat);
  hubBase.position.y = 0;
  hubGroup.add(hubBase);

  // Central Hologram Diamond Core
  const diamondGeo = new THREE.OctahedronGeometry(1.8, 0);
  const diamondMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x0891b2,
    emissiveIntensity: 0.8,
    wireframe: true
  });
  const diamondCore = new THREE.Mesh(diamondGeo, diamondMat);
  diamondCore.position.y = 4.5;
  diamondCore.userData = { mode: 'hub', title: 'Pradeep-B28 Portfolio Hub', repo: 'Pradeep-B28', desc: '3D Developer Portfolio & Quest World' };
  hubGroup.add(diamondCore);
  raycastTargets.push(diamondCore);

  // Rotating Ring around Diamond
  const hubRingGeo = new THREE.TorusGeometry(3.2, 0.08, 16, 32);
  const hubRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const hubRing = new THREE.Mesh(hubRingGeo, hubRingMat);
  hubRing.position.y = 4.5;
  hubRing.rotation.x = Math.PI / 3;
  hubGroup.add(hubRing);

  // --- 3. LANDMARK 2: SCHEMA SENTINEL CITADEL (Zone 2: X=-16, Z=-12) ---
  const sentinelGroup = new THREE.Group();
  sentinelGroup.position.set(-16, 0, -12);
  worldGroup.add(sentinelGroup);

  const baseSentinel = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6, 1.2, 6), islandMat);
  baseSentinel.position.y = 0;
  sentinelGroup.add(baseSentinel);

  const fortressGeo = new THREE.CylinderGeometry(2.5, 3.2, 4.5, 6);
  const fortressMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.8 });
  const fortress = new THREE.Mesh(fortressGeo, fortressMat);
  fortress.position.y = 2.8;
  sentinelGroup.add(fortress);

  const dbCoreGeo = new THREE.CylinderGeometry(1.4, 1.4, 3, 16);
  const dbCoreMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, emissive: 0x1d4ed8, emissiveIntensity: 0.6, wireframe: true });
  const dbCore = new THREE.Mesh(dbCoreGeo, dbCoreMat);
  dbCore.position.y = 6.5;
  dbCore.userData = { mode: 'sentinel', title: 'Schema Sentinel Citadel', repo: 'Schema-Sentinel', desc: 'PostgreSQL Pre-Migration AST SQL Risk Engine' };
  sentinelGroup.add(dbCore);
  raycastTargets.push(dbCore);

  const shieldRingGeo = new THREE.TorusGeometry(3.2, 0.08, 16, 32);
  const shieldRingMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
  const shieldRing1 = new THREE.Mesh(shieldRingGeo, shieldRingMat);
  shieldRing1.position.y = 5;
  shieldRing1.rotation.x = Math.PI / 3;
  sentinelGroup.add(shieldRing1);

  const shieldRing2 = new THREE.Mesh(shieldRingGeo, shieldRingMat);
  shieldRing2.position.y = 6.5;
  shieldRing2.rotation.x = -Math.PI / 3;
  sentinelGroup.add(shieldRing2);

  const laserMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.8 });
  const laserBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 10, 8), laserMat);
  laserBeam.position.set(0, 10, 0);
  sentinelGroup.add(laserBeam);

  // --- 4. LANDMARK 3: LEDGER VAULT (Zone 3: X=16, Z=-12) ---
  const ledgerGroup = new THREE.Group();
  ledgerGroup.position.set(16, 0, -12);
  worldGroup.add(ledgerGroup);

  const baseLedger = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6, 1.2, 6), islandMat);
  baseLedger.position.y = 0;
  ledgerGroup.add(baseLedger);

  const ledgerTowerGeo = new THREE.BoxGeometry(3.2, 8.5, 3.2);
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.7 });
  const ledgerTower = new THREE.Mesh(ledgerTowerGeo, glassMat);
  ledgerTower.position.y = 4.8;
  ledgerTower.userData = { mode: 'ledger', title: 'Ledger Vault & Tower', repo: 'Ledger_Expense_Tracker', desc: 'MERN + PWA + Capacitor Enterprise AI Expense Suite' };
  ledgerGroup.add(ledgerTower);
  raycastTargets.push(ledgerTower);

  const coinGroup = new THREE.Group();
  coinGroup.position.y = 10.5;
  const coinGeo = new THREE.IcosahedronGeometry(1.2, 1);
  const coinMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.7, wireframe: true });
  const mainCoin = new THREE.Mesh(coinGeo, coinMat);
  coinGroup.add(mainCoin);
  ledgerGroup.add(coinGroup);

  // --- 5. LANDMARK 4: GIT-VIZ OBSERVATORY (Zone 4: X=0, Z=-24) ---
  const skylineGroup = new THREE.Group();
  skylineGroup.position.set(0, 0, -24);
  worldGroup.add(skylineGroup);

  const baseSkyline = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 7, 1.2, 8), islandMat);
  baseSkyline.position.y = 0;
  skylineGroup.add(baseSkyline);

  const domeGeo = new THREE.SphereGeometry(2.8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, emissive: 0x6d28d9, emissiveIntensity: 0.5, wireframe: true });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.position.y = 2.5;
  dome.userData = { mode: 'skyline', title: 'GIT-viz Skyline Observatory', repo: 'GIT---viz', desc: '3D Profile Skyline & Galaxy Visualizer' };
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
        const bMesh = new THREE.Mesh(bGeo, new THREE.MeshStandardMaterial({ color: buildingColors[lvl] }));
        bMesh.position.set(c * 1.1, 0, r * 1.1);
        buildingGroup.add(bMesh);
      }
    }
  }
  skylineGroup.add(buildingGroup);

  // --- 6. LANDMARK 5: REL_NOTES MONOLITH (Zone 5: X=-22, Z=8) ---
  const notesGroup = new THREE.Group();
  notesGroup.position.set(-22, 0, 8);
  worldGroup.add(notesGroup);

  const baseNotes = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.5, 1.2, 6), islandMat);
  baseNotes.position.y = 0;
  notesGroup.add(baseNotes);

  const monolithGeo = new THREE.BoxGeometry(1.8, 7.5, 1);
  const monolithMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.4, metalness: 0.8 });
  const monolith = new THREE.Mesh(monolithGeo, monolithMat);
  monolith.position.y = 4.3;
  monolith.userData = { mode: 'relnotes', title: 'Rel_Notes AI Monolith', repo: 'Rel_Notes', desc: 'AI Release Notes Generator from Git Commits' };
  notesGroup.add(monolith);
  raycastTargets.push(monolith);

  const crystalGeo = new THREE.OctahedronGeometry(1.2, 0);
  const crystalMat = new THREE.MeshBasicMaterial({ color: 0x34d399, wireframe: true });
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  crystal.position.y = 9.5;
  notesGroup.add(crystal);

  // --- 7. LANDMARK 6: DEVSTARTER CONTAINER DOCK (Zone 6: X=-12, Z=22) ---
  const devstarterGroup = new THREE.Group();
  devstarterGroup.position.set(-12, 0, 22);
  worldGroup.add(devstarterGroup);

  const baseDevstarter = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6, 1.2, 6), islandMat);
  baseDevstarter.position.y = 0;
  devstarterGroup.add(baseDevstarter);

  const crateGroup = new THREE.Group();
  crateGroup.position.y = 1.2;
  const crateColors = [0xeab308, 0x0284c7, 0xef4444, 0x10b981];
  for (let i = 0; i < 4; i++) {
    const crateGeo = new THREE.BoxGeometry(1.8, 1.2, 1.8);
    const crateMat = new THREE.MeshStandardMaterial({ color: crateColors[i], metalness: 0.6, roughness: 0.3 });
    const crate = new THREE.Mesh(crateGeo, crateMat);
    crate.position.set((i % 2 - 0.5) * 2.2, Math.floor(i / 2) * 1.3 + 0.6, (Math.floor(i / 2) - 0.5) * 1.5);
    crateGroup.add(crate);
  }
  devstarterGroup.add(crateGroup);

  const craneArm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 6, 0.4), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
  craneArm.position.set(0, 3.5, 0);
  craneArm.userData = { mode: 'devstarter', title: 'Devstarter Container Dock', repo: 'Devstarter', desc: 'Zero-Config Devcontainer Templates' };
  devstarterGroup.add(craneArm);
  raycastTargets.push(craneArm);

  // --- 8. LANDMARK 7: DSA FOREST & MENTORSHIP AMPHITHEATER (Zone 7: X=12, Z=22) ---
  const dsaGroup = new THREE.Group();
  dsaGroup.position.set(12, 0, 22);
  worldGroup.add(dsaGroup);

  const baseDSA = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 7, 1.2, 8), islandMat);
  baseDSA.position.y = 0;
  dsaGroup.add(baseDSA);

  const stageGeo = new THREE.CylinderGeometry(3.8, 4.2, 1.4, 16);
  const stageMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
  const stage = new THREE.Mesh(stageGeo, stageMat);
  stage.position.y = 1.2;
  stage.userData = { mode: 'dsa', title: 'Mentorship Forest & DSA Stage', repo: 'JAVA-DSA-Roadmap', desc: '6,000+ Students Mentored in Core Java & Algorithms' };
  dsaGroup.add(stage);
  raycastTargets.push(stage);

  const treeNodes = [
    { x: 0, y: 6.5, z: 0 },
    { x: -2.2, y: 4.2, z: 0 },
    { x: 2.2, y: 4.2, z: 0 },
    { x: -3.5, y: 2.2, z: 0 },
    { x: -0.8, y: 2.2, z: 0 },
    { x: 0.8, y: 2.2, z: 0 },
    { x: 3.5, y: 2.2, z: 0 }
  ];

  const nodeGeo = new THREE.SphereGeometry(0.55, 16, 16);
  const treeMeshGroup = new THREE.Group();
  treeMeshGroup.position.y = 2;

  treeNodes.forEach(n => {
    const nMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.3 });
    const nMesh = new THREE.Mesh(nodeGeo, nMat);
    nMesh.position.set(n.x, n.y, n.z);
    treeMeshGroup.add(nMesh);
  });
  dsaGroup.add(treeMeshGroup);

  // --- 9. LANDMARK 8: SORTING VISUALIZER ARENA (Zone 8: X=22, Z=8) ---
  const sortingGroup = new THREE.Group();
  sortingGroup.position.set(22, 0, 8);
  worldGroup.add(sortingGroup);

  const baseSorting = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6, 1.2, 6), islandMat);
  baseSorting.position.y = 0;
  sortingGroup.add(baseSorting);

  const barPillars = [];
  const barHeights = [1.5, 3.5, 5.0, 2.5, 4.2];
  const barColors = [0xec4899, 0xf43f5e, 0x8b5cf6, 0x3b82f6, 0x10b981];

  for (let i = 0; i < 5; i++) {
    const h = barHeights[i];
    const bGeo = new THREE.BoxGeometry(0.7, h, 0.7);
    bGeo.translate(0, h / 2, 0);
    const bMat = new THREE.MeshStandardMaterial({ color: barColors[i], emissive: barColors[i], emissiveIntensity: 0.3 });
    const bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set((i - 2) * 1.0, 0.6, 0);
    bMesh.userData = { mode: 'sorting', title: 'Searching & Sorting Arena', repo: 'JAVA-Searching-Sorting-Visualizer', desc: 'Interactive Algorithm Step Execution Visualizer' };
    sortingGroup.add(bMesh);
    barPillars.push(bMesh);
    if (i === 2) raycastTargets.push(bMesh);
  }

  // --- 10. CONNECTING BRIDGES / PATHWAYS ---
  const bridges = [
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

  // --- CAMERA MOVEMENT & VIEW PRESETS FOR ALL 8 REPOS ---
  const presetViews = {
    world: { pos: new THREE.Vector3(0, 28, 42), target: new THREE.Vector3(0, 2, 0), title: '🏝️ The Archipelago of Pradeep', text: 'Overview of all 8 Flagship Repositories. Click any 3D landmark or run Guided Flyover Tour to explore.' },
    hub: { pos: new THREE.Vector3(0, 10, 14), target: new THREE.Vector3(0, 4, 0), title: '⚡ Central 3D Portfolio Hub', text: 'Official 3D Interactive Portfolio & Tourist Archipelago built with Three.js, WebGL & CSS Glassmorphism.' },
    sentinel: { pos: new THREE.Vector3(-16, 10, -4), target: new THREE.Vector3(-16, 5, -12), title: '🛡️ Schema Sentinel Citadel', text: 'Pre-migration risk analysis engine for PostgreSQL. AST SQL parser, 4-axis risk matrix & automated GitHub Action PR gatekeeper.' },
    ledger: { pos: new THREE.Vector3(16, 10, -4), target: new THREE.Vector3(16, 5, -12), title: '💸 Ledger Vault & Bank Tower', text: 'Market-ready MERN + PWA + Capacitor Android expense suite with 0ms Optimistic UI engine and bank cloud sync.' },
    skyline: { pos: new THREE.Vector3(0, 12, -14), target: new THREE.Vector3(0, 4, -24), title: '🏙️ GIT-viz Skyline Observatory', text: 'Transforms GitHub profiles into 3D city skylines & repo galaxies with WASD drone flight and Web Audio melodic synth.' },
    relnotes: { pos: new THREE.Vector3(-22, 10, 16), target: new THREE.Vector3(-22, 4, 8), title: '📝 Rel_Notes AI Monolith', text: 'AI-powered release notes generator built with TypeScript and Groq API. Structures Git commits into polished releases.' },
    devstarter: { pos: new THREE.Vector3(-12, 10, 30), target: new THREE.Vector3(-12, 4, 22), title: '🐳 Devstarter Container Dock', text: 'Zero-configuration devcontainer templates for Python, Node, Go, Rust, C++, and Java. Instant VS Code launch.' },
    dsa: { pos: new THREE.Vector3(12, 10, 30), target: new THREE.Vector3(12, 4, 22), title: '🌲 Mentorship Forest & DSA Stage', text: '6,000+ Students Mentored across Core Java, JVM internals, multithreading, arrays, graphs & dynamic programming.' },
    sorting: { pos: new THREE.Vector3(22, 10, 16), target: new THREE.Vector3(22, 4, 8), title: '🎞️ Searching & Sorting Arena', text: 'Interactive Java Swing GUI application rendering sorting steps and binary search comparisons frame-by-frame.' }
  };

  let targetCamPos = camera.position.clone();
  let targetLookAt = initialTarget.clone();

  function switchMode(modeKey) {
    if (isTourActive && modeKey !== 'tour') stopGuidedTour();
    currentMode = modeKey;

    // Deactivate all mode buttons
    [btnWorld, btnHub, btnSentinel, btnLedger, btnSkyline, btnRelNotes, btnDevstarter, btnDSA, btnSorting].forEach(b => {
      if (b) b.classList.remove('active');
    });

    const activeBtnMap = {
      world: btnWorld,
      hub: btnHub,
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

    if (statusText) statusText.innerText = `Mode: ${view.title} · Navigated`;

    // Show/Hide SQL Game Panel
    if (modeKey === 'sentinel') {
      if (sqlGamePanel) sqlGamePanel.classList.remove('hidden');
      unlockStamp('sentinel');
    } else {
      if (sqlGamePanel) sqlGamePanel.classList.add('hidden');
    }

    if (modeKey === 'hub') unlockStamp('hub');
    if (modeKey === 'ledger') unlockStamp('ledger');
    if (modeKey === 'skyline') unlockStamp('skyline');
    if (modeKey === 'relnotes') unlockStamp('relnotes');
    if (modeKey === 'devstarter') unlockStamp('devstarter');
    if (modeKey === 'dsa') unlockStamp('mentor');
    if (modeKey === 'sorting') unlockStamp('sorting');
  }

  // --- GUIDED TOUR CONTROLLER ACROSS ALL 8 REPOS ---
  const tourSequence = ['hub', 'sentinel', 'ledger', 'skyline', 'relnotes', 'devstarter', 'dsa', 'sorting'];

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

    unlockStamp(modeKey === 'dsa' ? 'mentor' : modeKey);

    tourIndex = (tourIndex + 1) % tourSequence.length;
    tourTimer = setTimeout(runTourStep, 5000);
  }

  // --- SQL RISK SIMULATOR LOGIC ---
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

    laserMat.color.setHex(data.color);
    unlockStamp('sentinel');
    showToastNotification(`🔍 Schema Sentinel Scan: ${data.risk} RISK Detected!`);
  }

  // --- 3D RAYCASTING & INTERACTIVE HOVER TOOLTIP ---
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onPointerMove(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(raycastTargets);

    if (intersects.length > 0) {
      const targetObj = intersects[0].object;
      const data = targetObj.userData;
      if (data && data.title) {
        tooltipEl.innerHTML = `<strong>${data.title}</strong><br/><span style="color:#94a3b8; font-size:0.75rem;">Repo: ${data.repo}</span><br/><span style="color:#38bdf8; font-size:0.75rem;">${data.desc}</span>`;
        tooltipEl.style.left = `${e.clientX - rect.left + 15}px`;
        tooltipEl.style.top = `${e.clientY - rect.top + 15}px`;
        tooltipEl.classList.remove('hidden');
        renderer.domElement.style.cursor = 'pointer';
        return;
      }
    }

    tooltipEl.classList.add('hidden');
    renderer.domElement.style.cursor = 'default';
  }

  function onPointerClick() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(raycastTargets);
    if (intersects.length > 0) {
      const data = intersects[0].object.userData;
      if (data && data.mode) {
        switchMode(data.mode);
      }
    }
  }

  renderer.domElement.addEventListener('mousemove', onPointerMove);
  renderer.domElement.addEventListener('click', onPointerClick);

  // --- EVENT LISTENERS FOR MODE BUTTONS ---
  if (btnWorld) btnWorld.addEventListener('click', () => switchMode('world'));
  if (btnHub) btnHub.addEventListener('click', () => switchMode('hub'));
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

    // 3D Object Animations
    diamondCore.rotation.y += 0.015;
    hubRing.rotation.z += 0.02;

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

  // Initial Passport Sync
  updatePassportUI();
})();
