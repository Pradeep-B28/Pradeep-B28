/* ==========================================================================
   PRADEEP 3D PORTFOLIO - INTERACTIVE 3D DSA SANDBOX VISUALIZER
   ========================================================================== */

(function () {
  const container = document.getElementById('viz-3d-container');
  if (!container || typeof THREE === 'undefined') return;

  // Buttons & Controls
  const btnSort = document.getElementById('btn-mode-sort');
  const btnTree = document.getElementById('btn-mode-tree');
  const btnTrigger = document.getElementById('btn-action-trigger');
  const btnReset = document.getElementById('btn-action-reset');
  const statusText = document.getElementById('viz-status-text');

  // Scene Setup
  const width = container.clientWidth;
  const height = container.clientHeight;

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 12, 28);
  camera.lookAt(0, 4, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // OrbitControls for user rotation
  let controls;
  if (typeof THREE.OrbitControls !== 'undefined') {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
  }

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0x22d3ee, 1.2);
  dirLight.position.set(10, 20, 15);
  scene.add(dirLight);

  const pointLight = new THREE.PointLight(0xa855f7, 1.5, 50);
  pointLight.position.set(-10, 10, 10);
  scene.add(pointLight);

  // Colors
  const COLOR_IDLE = 0x22d3ee;
  const COLOR_COMPARE = 0xa855f7;
  const COLOR_SORTED = 0x10b981;

  let currentMode = 'sort'; // 'sort' or 'tree'
  let isRunning = false;

  // --- 1. 3D ARRAY SORTING SCENE ---
  let sortGroup = new THREE.Group();
  scene.add(sortGroup);

  let arrayValues = [6, 12, 4, 15, 8, 3, 11, 7, 14, 5];
  let barMeshes = [];

  function buildSortScene() {
    clearGroup(sortGroup);
    barMeshes = [];

    const barWidth = 1.2;
    const spacing = 0.6;
    const startX = -((arrayValues.length * (barWidth + spacing)) / 2) + barWidth / 2;

    arrayValues.forEach((val, i) => {
      const geo = new THREE.BoxGeometry(barWidth, val, barWidth);
      const mat = new THREE.MeshStandardMaterial({
        color: COLOR_IDLE,
        roughness: 0.3,
        metalness: 0.2
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(startX + i * (barWidth + spacing), val / 2, 0);
      mesh.userData = { value: val, index: i };

      sortGroup.add(mesh);
      barMeshes.push(mesh);
    });

    // Add 3D Grid Floor
    const gridHelper = new THREE.GridHelper(30, 20, 0x22d3ee, 0x1e293b);
    gridHelper.position.y = 0;
    sortGroup.add(gridHelper);
  }

  // Bubble Sort Async Animation
  async function runSortAnimation() {
    if (isRunning) return;
    isRunning = true;
    statusText.innerText = "Mode: 3D Bubble Sort · Executing steps...";

    const len = barMeshes.length;
    for (let i = 0; i < len; i++) {
      for (let j = 0; j < len - i - 1; j++) {
        if (!isRunning) return;

        // Highlight active bars
        barMeshes[j].material.color.setHex(COLOR_COMPARE);
        barMeshes[j + 1].material.color.setHex(COLOR_COMPARE);
        await sleep(250);

        if (barMeshes[j].userData.value > barMeshes[j + 1].userData.value) {
          // Swap positions
          const x1 = barMeshes[j].position.x;
          const x2 = barMeshes[j + 1].position.x;

          barMeshes[j].position.x = x2;
          barMeshes[j + 1].position.x = x1;

          // Swap references in array
          const temp = barMeshes[j];
          barMeshes[j] = barMeshes[j + 1];
          barMeshes[j + 1] = temp;

          await sleep(250);
        }

        // Reset color
        barMeshes[j].material.color.setHex(COLOR_IDLE);
        barMeshes[j + 1].material.color.setHex(COLOR_IDLE);
      }
      // Set sorted color for last element
      barMeshes[len - i - 1].material.color.setHex(COLOR_SORTED);
    }

    isRunning = false;
    statusText.innerText = "Mode: 3D Bubble Sort · Completed ✓";
  }

  // --- 2. 3D BINARY SEARCH TREE SCENE ---
  let treeGroup = new THREE.Group();
  scene.add(treeGroup);
  treeGroup.visible = false;

  const bstNodesData = [
    { val: 15, x: 0, y: 12, z: 0 },
    { val: 8, x: -7, y: 8, z: 0 },
    { val: 24, x: 7, y: 8, z: 0 },
    { val: 4, x: -10, y: 4, z: 0 },
    { val: 11, x: -4, y: 4, z: 0 },
    { val: 19, x: 4, y: 4, z: 0 },
    { val: 28, x: 10, y: 4, z: 0 }
  ];

  let treeMeshes = [];

  function buildTreeScene() {
    clearGroup(treeGroup);
    treeMeshes = [];

    const sphereGeo = new THREE.SphereGeometry(1.2, 32, 32);

    bstNodesData.forEach(node => {
      const mat = new THREE.MeshStandardMaterial({
        color: COLOR_IDLE,
        roughness: 0.2,
        metalness: 0.5
      });
      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.position.set(node.x, node.y, node.z);
      mesh.userData = node;

      treeGroup.add(mesh);
      treeMeshes.push(mesh);
    });

    // Draw tree branches
    const connections = [
      [0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]
    ];

    const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
    connections.forEach(([pIndex, cIndex]) => {
      const pPos = bstNodesData[pIndex];
      const cPos = bstNodesData[cIndex];
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(pPos.x, pPos.y, pPos.z),
        new THREE.Vector3(cPos.x, cPos.y, cPos.z)
      ]);
      const line = new THREE.Line(geo, lineMat);
      treeGroup.add(line);
    });
  }

  async function runTreeAnimation() {
    if (isRunning) return;
    isRunning = true;
    statusText.innerText = "Mode: 3D BST Search · Searching target value '11'...";

    const searchPath = [0, 1, 4]; // Indices for 15 -> 8 -> 11

    for (let idx of searchPath) {
      if (!isRunning) return;
      treeMeshes[idx].material.color.setHex(COLOR_COMPARE);
      await sleep(500);
    }

    treeMeshes[4].material.color.setHex(COLOR_SORTED);
    isRunning = false;
    statusText.innerText = "Mode: 3D BST Search · Target '11' Located ✓";
  }

  // --- HELPER FUNCTIONS ---
  function clearGroup(group) {
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Mode Switch Handlers
  if (btnSort) {
    btnSort.addEventListener('click', () => {
      currentMode = 'sort';
      isRunning = false;
      btnSort.classList.add('active');
      btnTree.classList.remove('active');
      sortGroup.visible = true;
      treeGroup.visible = false;
      buildSortScene();
      statusText.innerText = "Mode: 3D Bubble Sort · Ready to step";
    });
  }

  if (btnTree) {
    btnTree.addEventListener('click', () => {
      currentMode = 'tree';
      isRunning = false;
      btnTree.classList.add('active');
      btnSort.classList.remove('active');
      sortGroup.visible = false;
      treeGroup.visible = true;
      buildTreeScene();
      statusText.innerText = "Mode: 3D Binary Search Tree · Ready to search";
    });
  }

  if (btnTrigger) {
    btnTrigger.addEventListener('click', () => {
      if (currentMode === 'sort') {
        runSortAnimation();
      } else {
        runTreeAnimation();
      }
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      isRunning = false;
      if (currentMode === 'sort') {
        arrayValues = [6, 12, 4, 15, 8, 3, 11, 7, 14, 5];
        buildSortScene();
        statusText.innerText = "Mode: 3D Bubble Sort · Scene Reset";
      } else {
        buildTreeScene();
        statusText.innerText = "Mode: 3D BST Search · Scene Reset";
      }
    });
  }

  // Initial Load
  buildSortScene();
  buildTreeScene();

  // Render Loop
  function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();

    if (currentMode === 'sort') {
      sortGroup.rotation.y += 0.002;
    } else {
      treeGroup.rotation.y += 0.002;
    }

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
})();
