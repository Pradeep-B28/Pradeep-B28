/**
 * ============================================================================
 * Algorithmic Lattice 3D - Interactive Hero Visualizer
 * ============================================================================
 * Hand-crafted Three.js visualization matching the editorial design system.
 * Renders an isometric rotating polyhedral lattice with concentric geometries,
 * vertex node indicators, and orbital data rings.
 * Supports light/dark theme synchronization, inertia drag, parallax, and zoom.
 * ============================================================================
 */

(function () {
  'use strict';

  // Theme palettes matching design/tokens.json
  const THEME_PALETTES = {
    dark: {
      outerWire: 0x2A313C,
      innerFace: 0x2A8C82,
      innerWire: 0x3A5250,
      accentNodes: 0xE3A03A,
      tealNodes: 0x2A8C82,
      orbitRing: 0x232B36,
      particles: 0x8B949E,
      glowAccent: 0xE3A03A,
      innerOpacity: 0.12
    },
    light: {
      outerWire: 0xCBC4B7,
      innerFace: 0x2A8C82,
      innerWire: 0x82A8A2,
      accentNodes: 0x9A5F0E,
      tealNodes: 0x2A8C82,
      orbitRing: 0xDDD7CC,
      particles: 0x59636E,
      glowAccent: 0x9A5F0E,
      innerOpacity: 0.08
    }
  };

  let scene, camera, renderer;
  let latticeGroup, outerWireMesh, innerMesh, innerWireMesh;
  let nodePointsAccent, nodePointsTeal, orbitRing1, orbitRing2, particleCloud;
  let outerEdgesGeom, innerGeom;
  let animFrameId = null;

  // Interaction State
  let isDragging = false;
  let prevPointerX = 0;
  let prevPointerY = 0;
  let targetRotX = 0.25;
  let targetRotY = 0.45;
  let currentRotX = 0.25;
  let currentRotY = 0.45;
  let targetCamZ = 18;
  let currentCamZ = 18;
  let mouseNormX = 0;
  let mouseNormY = 0;

  function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function initLattice3D() {
    const container = document.getElementById('lattice-3d-container');
    const fallback = document.getElementById('static-fallback');
    if (!container) return;

    if (typeof THREE === 'undefined') {
      setTimeout(initLattice3D, 50);
      return;
    }

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 420;

    // 1. Scene & Camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, currentCamZ);

    // 2. WebGL Renderer
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch (e) {
      console.warn('WebGL not supported, keeping SVG fallback.', e);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0); // transparent background

    // Clean container and attach canvas
    if (fallback) fallback.style.display = 'none';
    container.appendChild(renderer.domElement);

    // 3. Lattice Hierarchy Group
    latticeGroup = new THREE.Group();
    scene.add(latticeGroup);

    const theme = getCurrentTheme();
    const colors = THEME_PALETTES[theme];

    // 4. Outer Geometric Polyhedron (Icosahedron Wireframe)
    const outerRadius = 5.2;
    const outerIcoGeom = new THREE.IcosahedronGeometry(outerRadius, 0);
    outerEdgesGeom = new THREE.EdgesGeometry(outerIcoGeom);
    
    const outerWireMat = new THREE.LineBasicMaterial({
      color: colors.outerWire,
      linewidth: 1,
      transparent: true,
      opacity: 0.95
    });
    outerWireMesh = new THREE.LineSegments(outerEdgesGeom, outerWireMat);
    latticeGroup.add(outerWireMesh);

    // 5. Polyhedron Vertex Nodes
    const outerPositions = outerIcoGeom.attributes.position;
    const vertexCount = outerPositions.count;
    const accentNodePositions = [];
    const tealNodePositions = [];

    for (let i = 0; i < vertexCount; i++) {
      const vx = outerPositions.getX(i);
      const vy = outerPositions.getY(i);
      const vz = outerPositions.getZ(i);
      if (i % 2 === 0) {
        accentNodePositions.push(vx, vy, vz);
      } else {
        tealNodePositions.push(vx, vy, vz);
      }
    }

    // Node spheres using InstancedMesh or Points
    const accentPointsGeom = new THREE.BufferGeometry();
    accentPointsGeom.setAttribute('position', new THREE.Float32BufferAttribute(accentNodePositions, 3));
    const accentPointsMat = new THREE.PointsMaterial({
      color: colors.accentNodes,
      size: 7,
      sizeAttenuation: false
    });
    nodePointsAccent = new THREE.Points(accentPointsGeom, accentPointsMat);
    latticeGroup.add(nodePointsAccent);

    const tealPointsGeom = new THREE.BufferGeometry();
    tealPointsGeom.setAttribute('position', new THREE.Float32BufferAttribute(tealNodePositions, 3));
    const tealPointsMat = new THREE.PointsMaterial({
      color: colors.tealNodes,
      size: 6,
      sizeAttenuation: false
    });
    nodePointsTeal = new THREE.Points(tealPointsGeom, tealPointsMat);
    latticeGroup.add(nodePointsTeal);

    // 6. Concentric Inner Octahedron (Translucent core + wireframe)
    const innerRadius = 3.0;
    innerGeom = new THREE.OctahedronGeometry(innerRadius, 0);
    
    const innerFaceMat = new THREE.MeshBasicMaterial({
      color: colors.innerFace,
      transparent: true,
      opacity: colors.innerOpacity,
      wireframe: false,
      depthWrite: false
    });
    innerMesh = new THREE.Mesh(innerGeom, innerFaceMat);
    latticeGroup.add(innerMesh);

    const innerEdgesGeom = new THREE.EdgesGeometry(innerGeom);
    const innerWireMat = new THREE.LineBasicMaterial({
      color: colors.innerWire,
      transparent: true,
      opacity: 0.8
    });
    innerWireMesh = new THREE.LineSegments(innerEdgesGeom, innerWireMat);
    latticeGroup.add(innerWireMesh);

    // 7. Coordinate Orbital Rings
    const ring1Geom = new THREE.RingGeometry(6.8, 6.84, 64);
    const ring1Edges = new THREE.EdgesGeometry(ring1Geom);
    const ringMat = new THREE.LineBasicMaterial({
      color: colors.orbitRing,
      transparent: true,
      opacity: 0.7
    });
    orbitRing1 = new THREE.LineSegments(ring1Edges, ringMat);
    orbitRing1.rotation.x = Math.PI / 3.2;
    orbitRing1.rotation.y = Math.PI / 6;
    latticeGroup.add(orbitRing1);

    const ring2Geom = new THREE.RingGeometry(7.6, 7.63, 64);
    const ring2Edges = new THREE.EdgesGeometry(ring2Geom);
    orbitRing2 = new THREE.LineSegments(ring2Edges, ringMat);
    orbitRing2.rotation.x = -Math.PI / 4;
    orbitRing2.rotation.z = Math.PI / 5;
    latticeGroup.add(orbitRing2);

    // 8. Subtle Floating Algorithmic Data Dots
    const particleCount = 42;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let p = 0; p < particleCount; p++) {
      const radius = 6.2 + Math.random() * 2.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      particlePositions[p * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[p * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[p * 3 + 2] = radius * Math.cos(phi);
    }
    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: colors.particles,
      size: 3,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.6
    });
    particleCloud = new THREE.Points(particleGeom, particleMat);
    latticeGroup.add(particleCloud);

    // 9. Event Listeners (Drag, Hover Parallax, Zoom, Resize)
    setupEventListeners(container);

    // 10. Start Animation Loop
    animate();
  }

  function setupEventListeners(container) {
    // Pointer Drag
    container.addEventListener('pointerdown', (e) => {
      isDragging = true;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
      container.setPointerCapture(e.pointerId);
    });

    container.addEventListener('pointermove', (e) => {
      // Parallax tracking
      const rect = container.getBoundingClientRect();
      mouseNormX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNormY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      if (!isDragging) return;
      const deltaX = e.clientX - prevPointerX;
      const deltaY = e.clientY - prevPointerY;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;

      targetRotY += deltaX * 0.007;
      targetRotX += deltaY * 0.007;
      // Clamp vertical rotation to avoid pole flip
      targetRotX = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, targetRotX));
    });

    const stopDrag = (e) => {
      if (isDragging) {
        isDragging = false;
        try {
          container.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
    };

    container.addEventListener('pointerup', stopDrag);
    container.addEventListener('pointercancel', stopDrag);

    // Wheel Zoom
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      targetCamZ += e.deltaY * 0.01;
      targetCamZ = Math.max(12, Math.min(26, targetCamZ));
    }, { passive: false });

    // Resize Observer
    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const newW = entry.contentRect.width;
          const newH = entry.contentRect.height;
          if (newW > 0 && newH > 0 && camera && renderer) {
            camera.aspect = newW / newH;
            camera.updateProjectionMatrix();
            renderer.setSize(newW, newH);
          }
        }
      });
      resizeObserver.observe(container);
    }
  }

  // Animation Loop with smooth inertial damping
  function animate() {
    animFrameId = requestAnimationFrame(animate);

    // Subtle constant ambient rotation when not dragging
    if (!isDragging) {
      targetRotY += 0.0016;
      targetRotX += 0.0004;
    }

    // Inertial lerp
    currentRotX += (targetRotX - currentRotX) * 0.08;
    currentRotY += (targetRotY - currentRotY) * 0.08;
    currentCamZ += (targetCamZ - currentCamZ) * 0.1;

    camera.position.z = currentCamZ;

    // Apply rotation to lattice group
    latticeGroup.rotation.x = currentRotX + mouseNormY * 0.1;
    latticeGroup.rotation.y = currentRotY + mouseNormX * 0.1;

    // Inner core counter-rotation
    if (innerMesh && innerWireMesh) {
      innerMesh.rotation.y -= 0.003;
      innerMesh.rotation.z += 0.002;
      innerWireMesh.rotation.y -= 0.003;
      innerWireMesh.rotation.z += 0.002;
    }

    // Orbital ring precessions
    if (orbitRing1) orbitRing1.rotation.z += 0.002;
    if (orbitRing2) orbitRing2.rotation.z -= 0.0015;

    renderer.render(scene, camera);
  }

  // Theme synchronization hook called by app.js
  window.onPortfolioThemeChange = function (newTheme) {
    const colors = THEME_PALETTES[newTheme] || THEME_PALETTES.dark;

    if (outerWireMesh) outerWireMesh.material.color.setHex(colors.outerWire);
    if (nodePointsAccent) nodePointsAccent.material.color.setHex(colors.accentNodes);
    if (nodePointsTeal) nodePointsTeal.material.color.setHex(colors.tealNodes);
    if (innerMesh) {
      innerMesh.material.color.setHex(colors.innerFace);
      innerMesh.material.opacity = colors.innerOpacity;
    }
    if (innerWireMesh) innerWireMesh.material.color.setHex(colors.innerWire);
    if (orbitRing1) orbitRing1.material.color.setHex(colors.orbitRing);
    if (orbitRing2) orbitRing2.material.color.setHex(colors.orbitRing);
    if (particleCloud) particleCloud.material.color.setHex(colors.particles);
  };

  // Expose init function globally
  window.initLattice3D = initLattice3D;
})();
