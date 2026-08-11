/* ==========================================================================
   PRADEEP 3D PORTFOLIO - THREE.JS BACKGROUND SCENE
   ========================================================================== */

(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // Scene, Camera, Renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Mouse Interactivity
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  const windowHalfX = window.innerWidth / 2;
  const windowHalfY = window.innerHeight / 2;

  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - windowHalfX) * 0.001;
    mouseY = (e.clientY - windowHalfY) * 0.001;
  });

  // 1. PARTICLES DUST
  const particleCount = 400;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleScales = new Float32Array(particleCount);

  for (let i = 0; i < particleCount * 3; i += 3) {
    particlePositions[i] = (Math.random() - 0.5) * 80;
    particlePositions[i + 1] = (Math.random() - 0.5) * 80;
    particlePositions[i + 2] = (Math.random() - 0.5) * 80;
    particleScales[i / 3] = Math.random() * 2;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: 0x22d3ee,
    size: 0.25,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });

  const particleSystem = new THREE.Points(particleGeo, particleMat);
  scene.add(particleSystem);

  // 2. 3D GRAPH NODES & EDGES (Representing Data Structures)
  const nodeGroup = new THREE.Group();
  const nodeCount = 28;
  const nodePositions = [];
  const nodeGeom = new THREE.SphereGeometry(0.4, 16, 16);
  const nodeMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });

  for (let i = 0; i < nodeCount; i++) {
    const mesh = new THREE.Mesh(nodeGeom, nodeMat);
    const x = (Math.random() - 0.5) * 40;
    const y = (Math.random() - 0.5) * 30;
    const z = (Math.random() - 0.5) * 20;

    mesh.position.set(x, y, z);
    nodeGroup.add(mesh);
    nodePositions.push(new THREE.Vector3(x, y, z));
  }

  // Draw connecting edges between close nodes
  const lineMat = new THREE.LineBasicMaterial({
    color: 0xa855f7,
    transparent: true,
    opacity: 0.25
  });

  for (let i = 0; i < nodePositions.length; i++) {
    for (let j = i + 1; j < nodePositions.length; j++) {
      const dist = nodePositions[i].distanceTo(nodePositions[j]);
      if (dist < 12) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([nodePositions[i], nodePositions[j]]);
        const line = new THREE.Line(lineGeo, lineMat);
        nodeGroup.add(line);
      }
    }
  }

  scene.add(nodeGroup);

  // 3. FLOATING 3D GLASS CUBES (Algorithms Memory Blocks)
  const cubeGroup = new THREE.Group();
  const cubeCount = 10;
  const cubeGeom = new THREE.BoxGeometry(2, 2, 2);

  for (let i = 0; i < cubeCount; i++) {
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });

    const cube = new THREE.Mesh(cubeGeom, wireMat);
    cube.position.set(
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 35,
      (Math.random() - 0.5) * 25
    );
    cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    cube.userData = {
      rotX: (Math.random() - 0.5) * 0.01,
      rotY: (Math.random() - 0.5) * 0.01
    };

    cubeGroup.add(cube);
  }

  scene.add(cubeGroup);

  // ANIMATION LOOP
  function animate() {
    requestAnimationFrame(animate);

    targetX += (mouseX - targetX) * 0.05;
    targetY += (mouseY - targetY) * 0.05;

    // Slow rotations
    particleSystem.rotation.y += 0.0008;
    nodeGroup.rotation.y += 0.001;
    nodeGroup.rotation.x = targetY * 0.5;
    nodeGroup.rotation.y += targetX * 0.5;

    cubeGroup.children.forEach(cube => {
      cube.rotation.x += cube.userData.rotX;
      cube.rotation.y += cube.userData.rotY;
    });

    camera.position.x += (targetX * 5 - camera.position.x) * 0.05;
    camera.position.y += (-targetY * 5 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

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
