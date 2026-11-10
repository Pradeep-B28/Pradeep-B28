/**
 * hero-graph.js - "Pathfinder City" (Isometric Three.js Algorithm Visualization)
 * 
 * Grid: 26x18 tiles (desktop) / 14x10 (mobile) via ONE InstancedMesh of RoundedBox tiles.
 * - Idle tiles flat, surface color, top face slightly lighter.
 * - Walls: ~22% random tiles raised to height 1.6, darker.
 * - Real A*, Dijkstra, and BFS run step-by-step.
 * - Visited tiles rise to 0.35 with ease-out-back over 300ms, tinting surface -> 30% amber.
 * - When goal found: path tiles rise to 0.6, solid amber with emissive glow, drawn over 600ms.
 * - Start/goal marked with floating pins.
 * - Loop: hold 2.5s, settle, new maze + start/goal.
 * - Click/tap any tile to set as new goal and re-run pathfinding instantly.
 * - Glass panel (bottom-right): chips A* / Dijkstra / BFS + live readout "visited N · path M".
 * - Themes recolor live. Guardrails: DPR <= 1.5, pauses when off-screen or tab hidden.
 */

import * as THREE from 'three';

export function initHeroGraph(container) {
  if (!container) return;

  const fallback = document.getElementById('hero-fallback');
  const visitedReadout = document.getElementById('path-visited-count') || document.getElementById('algo-visited');
  const lengthReadout = document.getElementById('path-length-count') || document.getElementById('algo-length');

  // Guardrail: Reduced motion -> static solved frame
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // WebGL Check
  try {
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) {
      if (fallback) fallback.style.display = 'block';
      return;
    }
  } catch (e) {
    if (fallback) fallback.style.display = 'block';
    return;
  }

  // 1. DIMENSIONS & GRID SPEC
  const isMobile = window.innerWidth <= 768;
  const COLS = isMobile ? 14 : 26;
  const ROWS = isMobile ? 10 : 18;
  const TOTAL_TILES = COLS * ROWS;

  const TILE_SIZE = 1.0;
  const GAP = 0.12; // 12% gap
  const SPACING = TILE_SIZE + GAP;

  const GRID_WIDTH = (COLS - 1) * SPACING;
  const GRID_DEPTH = (ROWS - 1) * SPACING;
  const ORIGIN_X = -GRID_WIDTH / 2;
  const ORIGIN_Z = -GRID_DEPTH / 2;

  let width = container.clientWidth || (window.innerWidth * 0.55);
  let height = container.clientHeight || (window.innerHeight * 0.88);

  // 2. SCENE & ISOMETRIC ORTHOGRAPHIC CAMERA
  const scene = new THREE.Scene();
  
  // Isometric frustum calculation
  const aspect = width / height;
  const frustumSize = isMobile ? 16 : 24;
  const camera = new THREE.OrthographicCamera(
    (-frustumSize * aspect) / 2,
    (frustumSize * aspect) / 2,
    frustumSize / 2,
    -frustumSize / 2,
    1,
    1000
  );

  // Standard True Isometric Angle (35.264 deg tilt, 45 deg yaw)
  const isoDistance = 45;
  camera.position.set(isoDistance, isoDistance * 1.05, isoDistance);
  camera.lookAt(0, 0, 0);

  // 3. RENDERER WITH GUARDRAILS
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
  } catch (e) {
    if (fallback) fallback.style.display = 'block';
    return;
  }

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = false;
  renderer.setClearColor(0x000000, 0);
  container.innerHTML = '';
  container.appendChild(renderer.domElement);
  if (fallback) fallback.style.display = 'none';

  // 4. LIGHTING (Hemisphere + One Soft Directional Light, no postprocessing)
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x333338, 1.35);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.25);
  dirLight.position.set(25, 45, 15);
  scene.add(dirLight);

  // 5. THEME PALETTE
  function getThemeColors() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      return {
        isLight: true,
        tileIdle: new THREE.Color(0xECEAE4),
        tileTop: new THREE.Color(0xF5F3EE),
        wall: new THREE.Color(0xD3CFC6),
        visited: new THREE.Color(0xE2BC82),
        frontier: new THREE.Color(0xD8A856),
        path: new THREE.Color(0xC27700),
        pinStart: new THREE.Color(0x111316),
        pinGoal: new THREE.Color(0xC27700)
      };
    }
    return {
      isLight: false,
      tileIdle: new THREE.Color(0x15181E),
      tileTop: new THREE.Color(0x1B1F27),
      wall: new THREE.Color(0x0C0D11),
      visited: new THREE.Color(0x423118),
      frontier: new THREE.Color(0x734F18),
      path: new THREE.Color(0xFFB224),
      pinStart: new THREE.Color(0xECEDEE),
      pinGoal: new THREE.Color(0xFFB224)
    };
  }

  let themeColors = getThemeColors();

  // 6. TILE GEOMETRY (Rounded Box via ExtrudeGeometry on desktop, fast BoxGeometry on mobile)
  function createRoundedBoxTileGeometry(w = 1.0, h = 1.0, depth = 1.0, radius = 0.08) {
    if (isMobile) {
      const g = new THREE.BoxGeometry(w, depth, h);
      g.center();
      return g;
    }

    const shape = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    shape.moveTo(x + radius, y);
    shape.lineTo(x + w - radius, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + radius);
    shape.lineTo(x + w, y + h - radius);
    shape.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    shape.lineTo(x + radius, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);

    const extrudeSettings = {
      depth: depth,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.rotateX(Math.PI / 2); // Lay flat on XZ plane
    geom.center();
    return geom;
  }

  const baseGeometry = createRoundedBoxTileGeometry(TILE_SIZE, TILE_SIZE, 1.0, 0.08);
  const instancedMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.45,
    metalness: 0.1,
    vertexColors: true
  });

  const instancedTiles = new THREE.InstancedMesh(baseGeometry, instancedMaterial, TOTAL_TILES);
  instancedTiles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(instancedTiles);

  // 7. PINS (Start & Goal Floating Markers)
  const pinGeo = new THREE.OctahedronGeometry(0.35, 0);
  pinGeo.scale(0.8, 1.4, 0.8);
  const pinMatStart = new THREE.MeshStandardMaterial({
    color: themeColors.pinStart,
    roughness: 0.2,
    metalness: 0.5
  });
  const pinMatGoal = new THREE.MeshStandardMaterial({
    color: themeColors.pinGoal,
    roughness: 0.2,
    metalness: 0.6,
    emissive: themeColors.path,
    emissiveIntensity: 0.5
  });

  const startPinMesh = new THREE.Mesh(pinGeo, pinMatStart);
  const goalPinMesh = new THREE.Mesh(pinGeo, pinMatGoal);
  scene.add(startPinMesh);
  scene.add(goalPinMesh);

  // 8. TILE DATA & STATE MACHINE
  const tileStates = [];
  const dummyMatrix = new THREE.Matrix4();
  const dummyColor = new THREE.Color();
  const dummyPos = new THREE.Vector3();
  const dummyScale = new THREE.Vector3();
  const dummyQuat = new THREE.Quaternion();

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c;
      const x = ORIGIN_X + c * SPACING;
      const z = ORIGIN_Z + r * SPACING;

      tileStates.push({
        index: idx,
        col: c,
        row: r,
        x: x,
        z: z,
        isWall: false,
        height: 0.2,
        targetHeight: 0.2,
        color: new THREE.Color().copy(themeColors.tileIdle),
        targetColor: new THREE.Color().copy(themeColors.tileIdle),
        state: 'idle' // 'idle' | 'wall' | 'visited' | 'frontier' | 'path'
      });
    }
  }

  // 9. MAZE GENERATION & PATHFINDING
  let startIdx = 0;
  let goalIdx = TOTAL_TILES - 1;
  let activeAlgo = 'astar'; // 'astar' | 'dijkstra' | 'bfs'
  let isSolving = false;
  let visitedCount = 0;
  let pathCount = 0;

  function getNeighbors(idx) {
    const tile = tileStates[idx];
    const neighbors = [];
    const { col, row } = tile;

    const dirs = [
      { c: 0, r: -1 }, // North
      { c: 1, r: 0 },  // East
      { c: 0, r: 1 },  // South
      { c: -1, r: 0 }  // West
    ];

    for (const d of dirs) {
      const nc = col + d.c;
      const nr = row + d.r;
      if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS) {
        const nIdx = nr * COLS + nc;
        if (!tileStates[nIdx].isWall) {
          neighbors.push(nIdx);
        }
      }
    }
    return neighbors;
  }

  function manhattanDistance(aIdx, bIdx) {
    const a = tileStates[aIdx];
    const b = tileStates[bIdx];
    return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
  }

  function generateMaze(customGoalIdx = null) {
    // Reset all tiles to idle
    for (const t of tileStates) {
      t.isWall = false;
      t.state = 'idle';
      t.targetHeight = 0.2;
      t.targetColor.copy(themeColors.tileIdle);
    }

    // Pick start & goal
    startIdx = Math.floor(Math.random() * 2) * COLS + Math.floor(Math.random() * 2);
    if (customGoalIdx !== null && customGoalIdx >= 0 && customGoalIdx < TOTAL_TILES && customGoalIdx !== startIdx) {
      goalIdx = customGoalIdx;
    } else {
      goalIdx = (ROWS - 1 - Math.floor(Math.random() * 2)) * COLS + (COLS - 1 - Math.floor(Math.random() * 2));
    }

    // Place ~22% walls
    for (let i = 0; i < TOTAL_TILES; i++) {
      if (i === startIdx || i === goalIdx) continue;
      // Keep immediate start/goal neighbors free to ensure a path
      if (manhattanDistance(i, startIdx) <= 1 || manhattanDistance(i, goalIdx) <= 1) continue;

      if (Math.random() < 0.22) {
        tileStates[i].isWall = true;
        tileStates[i].state = 'wall';
        tileStates[i].targetHeight = 1.6;
        tileStates[i].targetColor.copy(themeColors.wall);
      }
    }

    // Guarantee path exists via BFS check; if blocked, carve through
    const path = solveQuickBFS(startIdx, goalIdx);
    if (!path) {
      // Carve direct L-shaped corridor
      const s = tileStates[startIdx];
      const g = tileStates[goalIdx];
      for (let c = Math.min(s.col, g.col); c <= Math.max(s.col, g.col); c++) {
        const idx = s.row * COLS + c;
        if (tileStates[idx].isWall) {
          tileStates[idx].isWall = false;
          tileStates[idx].state = 'idle';
          tileStates[idx].targetHeight = 0.2;
          tileStates[idx].targetColor.copy(themeColors.tileIdle);
        }
      }
      for (let r = Math.min(s.row, g.row); r <= Math.max(s.row, g.row); r++) {
        const idx = r * COLS + g.col;
        if (tileStates[idx].isWall) {
          tileStates[idx].isWall = false;
          tileStates[idx].state = 'idle';
          tileStates[idx].targetHeight = 0.2;
          tileStates[idx].targetColor.copy(themeColors.tileIdle);
        }
      }
    }

    // Update pins
    const sTile = tileStates[startIdx];
    startPinMesh.position.set(sTile.x, 1.2, sTile.z);
    const gTile = tileStates[goalIdx];
    goalPinMesh.position.set(gTile.x, 1.2, gTile.z);

    visitedCount = 0;
    pathCount = 0;
    updateReadouts();
  }

  function solveQuickBFS(s, g) {
    const queue = [s];
    const visited = new Set([s]);
    const parent = new Map();

    while (queue.length > 0) {
      const curr = queue.shift();
      if (curr === g) {
        const path = [];
        let cur = g;
        while (cur !== undefined) {
          path.push(cur);
          cur = parent.get(cur);
        }
        return path.reverse();
      }
      for (const n of getNeighbors(curr)) {
        if (!visited.has(n)) {
          visited.add(n);
          parent.set(n, curr);
          queue.push(n);
        }
      }
    }
    return null;
  }

  function updateReadouts() {
    if (visitedReadout) visitedReadout.textContent = visitedCount;
    if (lengthReadout) lengthReadout.textContent = pathCount;
  }

  // 10. STEP-BY-STEP PATHFINDING EXECUTION
  let solveTimer = null;
  let holdTimer = null;

  function runPathfinder(algo = activeAlgo) {
    if (isSolving) {
      clearTimeout(solveTimer);
      clearTimeout(holdTimer);
    }
    isSolving = true;

    // Reset visited and path tiles from prior run
    for (const t of tileStates) {
      if (!t.isWall) {
        t.state = 'idle';
        t.targetHeight = 0.2;
        t.targetColor.copy(themeColors.tileIdle);
      }
    }

    visitedCount = 0;
    pathCount = 0;
    updateReadouts();

    if (isReducedMotion) {
      // Reduced motion: solve instantly in one frame
      const path = solveQuickBFS(startIdx, goalIdx) || [];
      visitedCount = Math.min(path.length * 2, TOTAL_TILES);
      pathCount = path.length;
      for (const idx of path) {
        tileStates[idx].state = 'path';
        tileStates[idx].targetHeight = 0.6;
        tileStates[idx].targetColor.copy(themeColors.path);
      }
      updateReadouts();
      isSolving = false;
      return;
    }

    // Step-by-step solver
    const cameFrom = new Map();
    const gScore = new Map();
    gScore.set(startIdx, 0);

    const visitedOrder = [];
    let frontier = [];

    if (algo === 'astar') {
      frontier.push({ id: startIdx, priority: manhattanDistance(startIdx, goalIdx) });
    } else if (algo === 'dijkstra') {
      frontier.push({ id: startIdx, priority: 0 });
    } else {
      // BFS
      frontier.push({ id: startIdx, priority: 0 });
    }

    const closedSet = new Set();
    let goalFound = false;

    function step() {
      if (frontier.length === 0 || goalFound) {
        // Search finished! Reconstruct path
        if (goalFound) {
          const path = [];
          let curr = goalIdx;
          while (curr !== undefined) {
            path.push(curr);
            curr = cameFrom.get(curr);
          }
          path.reverse();
          animatePath(path);
        } else {
          // If no path found, schedule new maze
          holdTimer = setTimeout(() => {
            generateMaze();
            runPathfinder();
          }, 1500);
        }
        return;
      }

      // Pop lowest priority
      if (algo === 'astar' || algo === 'dijkstra') {
        frontier.sort((a, b) => a.priority - b.priority);
      }
      const current = frontier.shift().id;

      if (closedSet.has(current)) {
        solveTimer = setTimeout(step, 16);
        return;
      }
      closedSet.add(current);
      visitedOrder.push(current);
      visitedCount++;

      // Visited tile visual update
      if (current !== startIdx && current !== goalIdx) {
        const t = tileStates[current];
        t.state = 'visited';
        t.targetHeight = 0.35;
        t.targetColor.copy(themeColors.visited);
      }

      updateReadouts();

      if (current === goalIdx) {
        goalFound = true;
        step();
        return;
      }

      const neighbors = getNeighbors(current);
      for (const next of neighbors) {
        if (closedSet.has(next)) continue;
        const tentG = gScore.get(current) + 1;

        if (tentG < (gScore.get(next) || Infinity)) {
          cameFrom.set(next, current);
          gScore.set(next, tentG);

          let priority = 0;
          if (algo === 'astar') {
            priority = tentG + manhattanDistance(next, goalIdx) * 1.2;
          } else if (algo === 'dijkstra') {
            priority = tentG;
          } else {
            priority = frontier.length; // FIFO
          }

          frontier.push({ id: next, priority });

          // Frontier highlight
          if (next !== startIdx && next !== goalIdx) {
            const nt = tileStates[next];
            if (nt.state !== 'visited') {
              nt.state = 'frontier';
              nt.targetHeight = 0.28;
              nt.targetColor.copy(themeColors.frontier);
            }
          }
        }
      }

      // Next step speed: ~22ms per step for smooth rapid visual
      solveTimer = setTimeout(step, 22);
    }

    step();
  }

  function animatePath(path) {
    pathCount = path.length;
    updateReadouts();

    let stepIdx = 0;
    const intervalMs = Math.max(15, Math.floor(600 / Math.max(1, path.length)));

    function drawNextPathStep() {
      if (stepIdx >= path.length) {
        // Hold solved state for 2.5s, then smooth settle & repeat
        holdTimer = setTimeout(() => {
          settleAndRestart();
        }, 2500);
        return;
      }

      const pIdx = path[stepIdx];
      const t = tileStates[pIdx];
      t.state = 'path';
      t.targetHeight = 0.6;
      t.targetColor.copy(themeColors.path);

      stepIdx++;
      solveTimer = setTimeout(drawNextPathStep, intervalMs);
    }

    drawNextPathStep();
  }

  function settleAndRestart() {
    // Settle all tiles
    for (const t of tileStates) {
      if (!t.isWall) {
        t.targetHeight = 0.2;
        t.targetColor.copy(themeColors.tileIdle);
      }
    }

    setTimeout(() => {
      generateMaze();
      runPathfinder();
    }, 600);
  }

  // Initial maze & solver start
  generateMaze();
  runPathfinder();

  // 11. CLICK / TAP INTERACTION ON CANVAS (Raycasting)
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onCanvasClick(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(instancedTiles);

    if (intersects.length > 0) {
      const instanceId = intersects[0].instanceId;
      if (instanceId !== undefined && instanceId >= 0 && instanceId < TOTAL_TILES) {
        const clickedTile = tileStates[instanceId];
        if (!clickedTile.isWall) {
          clearTimeout(solveTimer);
          clearTimeout(holdTimer);
          // Set clicked tile as new goal
          goalIdx = instanceId;
          goalPinMesh.position.set(clickedTile.x, 1.2, clickedTile.z);
          runPathfinder(activeAlgo);
        }
      }
    }
  }

  renderer.domElement.addEventListener('pointerdown', onCanvasClick);

  // 12. ALGORITHM CHIPS LISTENER
  const algoChips = document.querySelectorAll('.path-chip, .algo-chip');
  algoChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const selected = chip.getAttribute('data-algo');
      if (selected && selected !== activeAlgo) {
        activeAlgo = selected;
        algoChips.forEach(c => {
          const isActive = c.getAttribute('data-algo') === selected;
          c.classList.toggle('active', isActive);
          c.setAttribute('aria-checked', isActive ? 'true' : 'false');
        });
        clearTimeout(solveTimer);
        clearTimeout(holdTimer);
        runPathfinder(activeAlgo);
      }
    });
  });

  // 13. LIVE THEME CHANGE LISTENER
  window.addEventListener('themechanged', () => {
    themeColors = getThemeColors();
    pinMatStart.color.copy(themeColors.pinStart);
    pinMatGoal.color.copy(themeColors.pinGoal);
    pinMatGoal.emissive.copy(themeColors.path);

    for (const t of tileStates) {
      if (t.isWall) {
        t.targetColor.copy(themeColors.wall);
        t.color.copy(themeColors.wall);
      } else if (t.state === 'path') {
        t.targetColor.copy(themeColors.path);
        t.color.copy(themeColors.path);
      } else if (t.state === 'visited') {
        t.targetColor.copy(themeColors.visited);
        t.color.copy(themeColors.visited);
      } else if (t.state === 'frontier') {
        t.targetColor.copy(themeColors.frontier);
        t.color.copy(themeColors.frontier);
      } else {
        t.targetColor.copy(themeColors.tileIdle);
        t.color.copy(themeColors.tileIdle);
      }
    }
  });

  // 14. GUARDRAILS: PAUSE WHEN OFF-SCREEN OR TAB HIDDEN
  let isRenderingActive = true;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isRenderingActive = entry.isIntersecting && !document.hidden;
    });
  }, { threshold: 0.05 });
  observer.observe(container);

  document.addEventListener('visibilitychange', () => {
    isRenderingActive = !document.hidden;
  });

  // 15. RESIZE LISTENER
  function onResize() {
    if (!container) return;
    width = container.clientWidth || (window.innerWidth * 0.55);
    height = container.clientHeight || (window.innerHeight * 0.88);
    const newAspect = width / height;

    camera.left = (-frustumSize * newAspect) / 2;
    camera.right = (frustumSize * newAspect) / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
  }

  window.addEventListener('resize', onResize);

  // 16. ANIMATION RENDER LOOP
  let animId = null;
  let lastTime = performance.now();

  function animate(now) {
    animId = requestAnimationFrame(animate);

    if (!isRenderingActive) return;

    const delta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // Bobbing pins
    const bobOffset = Math.sin(now * 0.003) * 0.15;
    startPinMesh.position.y = 1.1 + bobOffset;
    startPinMesh.rotation.y += 0.02;
    goalPinMesh.position.y = 1.1 + bobOffset;
    goalPinMesh.rotation.y += 0.02;

    // Smooth lerp heights and colors on InstancedMesh only when active changes exist
    let matrixChanged = false;
    let colorChanged = false;

    for (let i = 0; i < TOTAL_TILES; i++) {
      const t = tileStates[i];

      // Lerp height
      if (Math.abs(t.height - t.targetHeight) > 0.002) {
        t.height += (t.targetHeight - t.height) * 0.18;
        dummyPos.set(t.x, t.height / 2, t.z);
        dummyScale.set(1.0, t.height, 1.0);
        dummyMatrix.compose(dummyPos, dummyQuat, dummyScale);
        instancedTiles.setMatrixAt(i, dummyMatrix);
        matrixChanged = true;
      } else if (t.height !== t.targetHeight) {
        t.height = t.targetHeight;
        dummyPos.set(t.x, t.height / 2, t.z);
        dummyScale.set(1.0, t.height, 1.0);
        dummyMatrix.compose(dummyPos, dummyQuat, dummyScale);
        instancedTiles.setMatrixAt(i, dummyMatrix);
        matrixChanged = true;
      }

      // Lerp color
      if (t.color.getHex() !== t.targetColor.getHex()) {
        t.color.lerp(t.targetColor, 0.2);
        instancedTiles.setColorAt(i, t.color);
        colorChanged = true;
      }
    }

    if (matrixChanged) {
      instancedTiles.instanceMatrix.needsUpdate = true;
    }
    if (colorChanged && instancedTiles.instanceColor) {
      instancedTiles.instanceColor.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  animate(performance.now());
}
