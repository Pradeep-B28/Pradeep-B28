/**
 * hero-graph.js - "Shortest path to my work"
 * Interactive Three.js algorithm visualization scene.
 * ~90 softly glowing nodes in shallow 3D depth connected by faint edges.
 * Cursor acts as source node; A* algorithm finds and lights up shortest path in amber (#FFB224)
 * to the nearest project node. Hovering shows project tooltip; clicking scrolls to project.
 * On touch / idle: auto-animates a new path every 3 seconds.
 */

import * as THREE from 'three';

export function initHeroGraph(container, projects) {
  if (!container) return;

  const fallback = document.getElementById('hero-fallback');
  const tooltip = document.getElementById('hero-tooltip');

  // Check prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (fallback) fallback.style.display = 'block';
    return;
  }

  // Check WebGL availability
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

  let width = container.clientWidth || window.innerWidth;
  let height = container.clientHeight || window.innerHeight;

  // Scene & Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 0, 48);

  // WebGL Renderer
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);

  // Hide fallback
  if (fallback) fallback.style.display = 'none';
  container.appendChild(renderer.domElement);

  // 1. Build Graph Nodes (~90 nodes, shallow 3D depth)
  const nodeCount = 92;
  const nodes = [];
  const projectNodes = [];

  // Filter projects to attach to nodes (up to 12 projects)
  const featuredAndLabProjects = projects.slice(0, 14);

  // Project node indices
  const projectIndices = [8, 15, 23, 31, 42, 50, 58, 67, 74, 82, 88, 91];

  let projIdx = 0;
  for (let i = 0; i < nodeCount; i++) {
    // Distribute towards the right and center to leave room for left hero text
    const isProject = projectIndices.includes(i) && projIdx < featuredAndLabProjects.length;
    let px, py, pz;

    if (isProject) {
      // Place project nodes nicely across right and middle-right
      const u = (projIdx / (projectIndices.length - 1));
      px = 4 + (Math.sin(u * Math.PI * 2) * 16) + (Math.random() * 6);
      py = -12 + (u * 26) + ((Math.random() - 0.5) * 4);
      pz = (Math.random() - 0.5) * 4;
    } else {
      // General nodes distributed across shallow space
      px = -28 + Math.random() * 62;
      py = -18 + Math.random() * 36;
      pz = -7 + Math.random() * 14;
    }

    const pos = new THREE.Vector3(px, py, pz);
    const nodeData = {
      index: i,
      position: pos,
      isProject: isProject,
      project: isProject ? featuredAndLabProjects[projIdx++] : null
    };

    nodes.push(nodeData);
    if (isProject) {
      projectNodes.push(nodeData);
    }
  }

  // 2. Build Adjacency Graph (Distance threshold + k-nearest)
  const adjacency = Array.from({ length: nodeCount }, () => []);

  for (let i = 0; i < nodeCount; i++) {
    const distances = [];
    for (let j = 0; j < nodeCount; j++) {
      if (i === j) continue;
      const d = nodes[i].position.distanceTo(nodes[j].position);
      distances.push({ index: j, dist: d });
    }
    distances.sort((a, b) => a.dist - b.dist);

    // Connect 3 nearest neighbors unconditionally
    for (let k = 0; k < 3; k++) {
      const neighbor = distances[k];
      if (!adjacency[i].some(e => e.to === neighbor.index)) {
        adjacency[i].push({ to: neighbor.index, weight: neighbor.dist });
        adjacency[neighbor.index].push({ to: i, weight: neighbor.dist });
      }
    }

    // Connect others within distance 10.5
    for (let k = 3; k < distances.length; k++) {
      const neighbor = distances[k];
      if (neighbor.dist <= 10.5) {
        if (!adjacency[i].some(e => e.to === neighbor.index)) {
          adjacency[i].push({ to: neighbor.index, weight: neighbor.dist });
          adjacency[neighbor.index].push({ to: i, weight: neighbor.dist });
        }
      }
    }
  }

  // 3. Render Static Edges
  const edgePositions = [];
  const edgeSet = new Set();
  for (let i = 0; i < nodeCount; i++) {
    for (const e of adjacency[i]) {
      const key = i < e.to ? `${i}-${e.to}` : `${e.to}-${i}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edgePositions.push(
          nodes[i].position.x, nodes[i].position.y, nodes[i].position.z,
          nodes[e.to].position.x, nodes[e.to].position.y, nodes[e.to].position.z
        );
      }
    }
  }

  const staticEdgesGeom = new THREE.BufferGeometry();
  staticEdgesGeom.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
  const staticEdgesMat = new THREE.LineBasicMaterial({
    color: 0x1F242C,
    transparent: true,
    opacity: 0.65,
    depthWrite: false
  });
  const staticEdgesLine = new THREE.LineSegments(staticEdgesGeom, staticEdgesMat);
  scene.add(staticEdgesLine);

  // 4. Render Normal Nodes
  const normalPositions = [];
  nodes.filter(n => !n.isProject).forEach(n => {
    normalPositions.push(n.position.x, n.position.y, n.position.z);
  });
  const normalGeom = new THREE.BufferGeometry();
  normalGeom.setAttribute('position', new THREE.Float32BufferAttribute(normalPositions, 3));
  const normalMat = new THREE.PointsMaterial({
    color: 0x3A4250,
    size: 4.5,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8
  });
  const normalPoints = new THREE.Points(normalGeom, normalMat);
  scene.add(normalPoints);

  // 5. Render Project Nodes (Interactive Spheres with Raycasting)
  const projectMeshGroup = new THREE.Group();
  const sphereGeom = new THREE.SphereGeometry(0.72, 16, 16);
  const ringGeom = new THREE.RingGeometry(0.9, 1.15, 24);

  const projectMat = new THREE.MeshBasicMaterial({
    color: 0x828A98,
    transparent: true,
    opacity: 0.95
  });

  const projectRingMat = new THREE.MeshBasicMaterial({
    color: 0xFFB224,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide
  });

  const projectMeshes = [];
  projectNodes.forEach(pn => {
    const mesh = new THREE.Mesh(sphereGeom, projectMat.clone());
    mesh.position.copy(pn.position);
    mesh.userData = { node: pn };

    const ring = new THREE.Mesh(ringGeom, projectRingMat);
    ring.position.copy(pn.position);
    projectMeshGroup.add(ring);

    projectMeshGroup.add(mesh);
    projectMeshes.push(mesh);
  });
  scene.add(projectMeshGroup);

  // 6. Active A* Path Render Objects
  const maxPathPoints = 40;
  const pathPositions = new Float32Array(maxPathPoints * 3);
  const pathGeom = new THREE.BufferGeometry();
  pathGeom.setAttribute('position', new THREE.BufferAttribute(pathPositions, 3));
  const pathMat = new THREE.LineBasicMaterial({
    color: 0xFFB224,
    linewidth: 2,
    transparent: true,
    opacity: 0.95,
    depthWrite: false
  });
  const pathLine = new THREE.Line(pathGeom, pathMat);
  scene.add(pathLine);

  // Cursor indicator node
  const cursorNodeGeom = new THREE.SphereGeometry(0.8, 16, 16);
  const cursorNodeMat = new THREE.MeshBasicMaterial({
    color: 0xFFB224,
    transparent: true,
    opacity: 0.9
  });
  const cursorMesh = new THREE.Mesh(cursorNodeGeom, cursorNodeMat);
  cursorMesh.visible = false;
  scene.add(cursorMesh);

  // 7. A* Pathfinding Algorithm Implementation
  function findShortestPath(startId, targetId) {
    if (startId === targetId) return [startId];

    const openSet = new Set([startId]);
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    const heuristic = (a, b) => nodes[a].position.distanceTo(nodes[b].position);

    for (let i = 0; i < nodeCount; i++) {
      gScore.set(i, Infinity);
      fScore.set(i, Infinity);
    }
    gScore.set(startId, 0);
    fScore.set(startId, heuristic(startId, targetId));

    while (openSet.size > 0) {
      let current = null;
      let lowestF = Infinity;
      for (const id of openSet) {
        const f = fScore.get(id);
        if (f < lowestF) {
          lowestF = f;
          current = id;
        }
      }

      if (current === targetId) {
        const path = [current];
        while (cameFrom.has(current)) {
          current = cameFrom.get(current);
          path.unshift(current);
        }
        return path;
      }

      openSet.delete(current);
      const neighbors = adjacency[current] || [];
      for (const edge of neighbors) {
        const neighbor = edge.to;
        const tentativeG = gScore.get(current) + edge.weight;
        if (tentativeG < gScore.get(neighbor)) {
          cameFrom.set(neighbor, current);
          gScore.set(neighbor, tentativeG);
          fScore.set(neighbor, tentativeG + heuristic(neighbor, targetId));
          openSet.add(neighbor);
        }
      }
    }
    return [startId, targetId];
  }

  // 8. Interaction State
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(-999, -999);
  const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const planeIntersect = new THREE.Vector3();

  let activePath = [];
  let hoveredMesh = null;
  let lastInteractionTime = Date.now();
  let isAutoAnimating = false;
  let autoAnimStep = 0;

  function updatePathDisplay(pathIndices) {
    activePath = pathIndices;
    if (!pathIndices || pathIndices.length === 0) {
      pathGeom.setDrawRange(0, 0);
      cursorMesh.visible = false;
      return;
    }

    const posAttr = pathGeom.attributes.position;
    const len = Math.min(pathIndices.length, maxPathPoints);
    for (let i = 0; i < len; i++) {
      const p = nodes[pathIndices[i]].position;
      posAttr.setXYZ(i, p.x, p.y, p.z);
    }
    posAttr.needsUpdate = true;
    pathGeom.setDrawRange(0, len);

    // Show cursor node at start of path
    cursorMesh.position.copy(nodes[pathIndices[0]].position);
    cursorMesh.visible = true;

    // Reset project mesh colors, highlight target
    projectMeshes.forEach(m => {
      m.material.color.setHex(0x828A98);
      m.scale.set(1, 1, 1);
    });
    const targetIdx = pathIndices[pathIndices.length - 1];
    const targetMesh = projectMeshes.find(m => m.userData.node.index === targetIdx);
    if (targetMesh) {
      targetMesh.material.color.setHex(0xFFB224);
      targetMesh.scale.set(1.4, 1.4, 1.4);
    }
  }

  // 9. Pointer Events
  function onPointerMove(e) {
    lastInteractionTime = Date.now();
    isAutoAnimating = false;

    const rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast onto Z=0 plane to find cursor 3D world coordinate
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(planeZ, planeIntersect);

    // Find node closest to cursor
    let closestNodeIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < nodeCount; i++) {
      const d = planeIntersect.distanceTo(nodes[i].position);
      if (d < minDist) {
        minDist = d;
        closestNodeIdx = i;
      }
    }

    // Check if hovering a project node
    const intersects = raycaster.intersectObjects(projectMeshes);
    if (intersects.length > 0) {
      hoveredMesh = intersects[0].object;
      const proj = hoveredMesh.userData.node.project;
      container.style.cursor = 'pointer';

      if (tooltip && proj) {
        tooltip.innerHTML = `<strong>${proj.title}</strong> · <span>Click to inspect</span>`;
        tooltip.style.left = `${e.clientX + 14}px`;
        tooltip.style.top = `${e.clientY + 14}px`;
        tooltip.classList.add('visible');
      }

      // Path straight to hovered project
      const path = findShortestPath(closestNodeIdx, hoveredMesh.userData.node.index);
      updatePathDisplay(path);
      return;
    } else {
      if (hoveredMesh) {
        hoveredMesh = null;
        container.style.cursor = 'default';
        if (tooltip) tooltip.classList.remove('visible');
      }
    }

    // Find nearest project node from cursor
    let nearestProjIdx = projectNodes[0].index;
    let minProjDist = Infinity;
    for (const pn of projectNodes) {
      const d = planeIntersect.distanceTo(pn.position);
      if (d < minProjDist) {
        minProjDist = d;
        nearestProjIdx = pn.index;
      }
    }

    // Compute A* path
    const path = findShortestPath(closestNodeIdx, nearestProjIdx);
    updatePathDisplay(path);
  }

  function onPointerClick(e) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(projectMeshes);
    if (intersects.length > 0) {
      const proj = intersects[0].object.userData.node.project;
      if (proj) {
        const targetElement = document.getElementById(`project-${proj.id}`) || document.getElementById('work');
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
          targetElement.classList.add('card-pulse-highlight');
          setTimeout(() => targetElement.classList.remove('card-pulse-highlight'), 1800);
        }
      }
    }
  }

  function onPointerLeave() {
    if (tooltip) tooltip.classList.remove('visible');
    container.style.cursor = 'default';
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  container.addEventListener('click', onPointerClick);
  container.addEventListener('pointerleave', onPointerLeave);

  // 10. Auto-Animation for touch devices & idle state
  function triggerAutoAnimation() {
    if (projectNodes.length < 2) return;
    const randomStart = Math.floor(Math.random() * nodeCount);
    const randomTarget = projectNodes[Math.floor(Math.random() * projectNodes.length)].index;
    const path = findShortestPath(randomStart, randomTarget);
    updatePathDisplay(path);
  }

  // Trigger initial path immediately
  setTimeout(triggerAutoAnimation, 300);

  const autoInterval = setInterval(() => {
    // If no interaction for 3 seconds, auto-animate
    if (Date.now() - lastInteractionTime > 3000) {
      isAutoAnimating = true;
      triggerAutoAnimation();
    }
  }, 3200);

  // 11. Resize Observer
  const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      const newW = entry.contentRect.width;
      const newH = entry.contentRect.height;
      if (newW > 0 && newH > 0) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      }
    }
  });
  resizeObserver.observe(container);

  // 12. Animation Loop with Pause Guardrails
  let isRunning = true;
  let animId = null;

  function animate(time) {
    if (!isRunning) return;
    animId = requestAnimationFrame(animate);

    // Subtle drift rotation of scene
    scene.rotation.y = Math.sin(time * 0.0003) * 0.05;
    scene.rotation.x = Math.cos(time * 0.0003) * 0.03;

    // Pulse target node and ring
    const scalePulse = 1 + Math.sin(time * 0.004) * 0.12;
    projectMeshGroup.children.forEach((child, i) => {
      if (child.geometry === ringGeom) {
        child.rotation.z += 0.005;
      }
    });

    renderer.render(scene, camera);
  }
  animId = requestAnimationFrame(animate);

  // IntersectionObserver to pause when hero is off-screen
  const intersectionObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        if (!isRunning) {
          isRunning = true;
          animId = requestAnimationFrame(animate);
        }
      } else {
        isRunning = false;
        if (animId) cancelAnimationFrame(animId);
      }
    }
  }, { threshold: 0.05 });
  intersectionObserver.observe(container);

  // Page visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isRunning = false;
      if (animId) cancelAnimationFrame(animId);
    } else {
      if (!isRunning) {
        isRunning = true;
        animId = requestAnimationFrame(animate);
      }
    }
  });
}
