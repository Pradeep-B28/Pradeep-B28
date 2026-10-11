/* ==========================================================================
   PRADEEP 3D PORTFOLIO - PHOTOREALISTIC THREE.JS BACKGROUND SCENE
   Features: PBR Physical Glass Polyhedra, Neural Data Mesh, ACES Tone Mapping,
   Volumetric Dust Particles, and Ultra-Smooth Mouse Parallax
   ========================================================================== */

(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // Scene, Camera, Renderer Setup
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07090e, 0.018);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 32);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Cinematic ACES Filmic Tone Mapping for Photorealistic Depth & Contrast
  if (THREE.ACESFilmicToneMapping) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
  }

  // --- Realistic Lighting System ---
  const ambientLight = new THREE.AmbientLight(0x0b1329, 1.2);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.6);
  dirLight1.position.set(20, 30, 25);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0x22d3ee, 1.0);
  dirLight2.position.set(-25, -15, -10);
  scene.add(dirLight2);

  const accentPoint = new THREE.PointLight(0xa855f7, 2.0, 70);
  accentPoint.position.set(0, 10, 15);
  scene.add(accentPoint);

  const cyanPoint = new THREE.PointLight(0x06b6d4, 1.8, 60);
  cyanPoint.position.set(-15, -10, 10);
  scene.add(cyanPoint);

  // --- 1. Volumetric Particle Starfield ---
  const particleCount = 450;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    particlePositions[i] = (Math.random() - 0.5) * 90;
    particlePositions[i + 1] = (Math.random() - 0.5) * 90;
    particlePositions[i + 2] = (Math.random() - 0.5) * 90;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: 0x38bdf8,
    size: 0.28,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending
  });

  const particleSystem = new THREE.Points(particleGeo, particleMat);
  scene.add(particleSystem);

  // --- 2. Neural Architecture Data Graph (Nodes & Laser Edges) ---
  const nodeGroup = new THREE.Group();
  const nodeCount = 30;
  const nodePositions = [];
  const nodeGeom = new THREE.SphereGeometry(0.35, 24, 24);

  const nodeMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x0891b2,
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.8
  });

  for (let i = 0; i < nodeCount; i++) {
    const mesh = new THREE.Mesh(nodeGeom, nodeMat);
    const x = (Math.random() - 0.5) * 44;
    const y = (Math.random() - 0.5) * 32;
    const z = (Math.random() - 0.5) * 22;

    mesh.position.set(x, y, z);
    nodeGroup.add(mesh);
    nodePositions.push(new THREE.Vector3(x, y, z));
  }

  // Connecting laser lines between nearby nodes
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x818cf8,
    transparent: true,
    opacity: 0.28
  });

  for (let i = 0; i < nodePositions.length; i++) {
    for (let j = i + 1; j < nodePositions.length; j++) {
      const dist = nodePositions[i].distanceTo(nodePositions[j]);
      if (dist < 11.5) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([nodePositions[i], nodePositions[j]]);
        const line = new THREE.Line(lineGeo, lineMat);
        nodeGroup.add(line);
      }
    }
  }

  scene.add(nodeGroup);

  // --- 3. Photorealistic Floating PBR Glass Polyhedra ---
  const crystalGroup = new THREE.Group();
  const crystalGeometries = [
    new THREE.IcosahedronGeometry(1.6, 0),
    new THREE.OctahedronGeometry(1.4, 0),
    new THREE.DodecahedronGeometry(1.5, 0),
    new THREE.BoxGeometry(1.8, 1.8, 1.8),
    new THREE.TorusGeometry(1.2, 0.4, 16, 32)
  ];

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    emissive: 0x0e7490,
    emissiveIntensity: 0.15,
    roughness: 0.12,
    metalness: 0.1,
    transmission: 0.7,
    transparent: true,
    opacity: 0.82,
    reflectivity: 0.9,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1
  });

  const wireframeMat = new THREE.MeshBasicMaterial({
    color: 0xa855f7,
    wireframe: true,
    transparent: true,
    opacity: 0.22
  });

  const crystalCount = 12;
  const crystals = [];

  for (let i = 0; i < crystalCount; i++) {
    const geo = crystalGeometries[i % crystalGeometries.length];
    const mesh = new THREE.Mesh(geo, glassMat);

    // Inner wireframe accent for high-tech holographic realism
    const innerWire = new THREE.Mesh(geo, wireframeMat);
    innerWire.scale.set(1.02, 1.02, 1.02);
    mesh.add(innerWire);

    mesh.position.set(
      (Math.random() - 0.5) * 52,
      (Math.random() - 0.5) * 36,
      (Math.random() - 0.5) * 26
    );

    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

    const rotSpeed = {
      x: (Math.random() - 0.5) * 0.003,
      y: (Math.random() - 0.5) * 0.003,
      floatSpeed: 0.001 + Math.random() * 0.0015,
      floatOffset: Math.random() * Math.PI * 2,
      baseY: mesh.position.y
    };

    crystals.push({ mesh, rotSpeed });
    crystalGroup.add(mesh);
  }

  scene.add(crystalGroup);

  // --- Smooth Parallax Tracking ---
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 4;
    mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 4;
  });

  // --- Main Animation Loop ---
  let clock = 0;
  function animate() {
    requestAnimationFrame(animate);
    clock += 0.016;

    // Smooth lerp for mouse parallax
    mouse.x += (mouse.targetX - mouse.x) * 0.04;
    mouse.y += (mouse.targetY - mouse.y) * 0.04;

    camera.position.x = mouse.x;
    camera.position.y = mouse.y;
    camera.lookAt(0, 0, 0);

    // Constant slow cinematic rotation
    particleSystem.rotation.y += 0.0003;
    nodeGroup.rotation.y += 0.0004;
    nodeGroup.rotation.x += 0.00015;

    // Harmonic levitation and rotation for glass polyhedra
    crystals.forEach(({ mesh, rotSpeed }) => {
      mesh.rotation.x += rotSpeed.x;
      mesh.rotation.y += rotSpeed.y;
      mesh.position.y = rotSpeed.baseY + Math.sin(clock * rotSpeed.floatSpeed * 60 + rotSpeed.floatOffset) * 0.8;
    });

    renderer.render(scene, camera);
  }

  animate();

  // Resize Handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
