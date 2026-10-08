import * as THREE from 'three';

const COLORS = {
  obstacle: 0x8c9698, vegetation: 0x527648, route: 0xe0c58e,
  start: 0x478ecb, safe: 0x55b69b,
};
const FIRE_COLORS = { burning: 0xff8a20, 'burned-hot': 0xd33138, 'burned-cool': 0x4e5663 };
const FUEL_COLORS = { brush: 0x527648, grass: 0x91aa59 };

// Full-cell ground coverage follows fuel data, including walkable crossings.
// Sparse decorative models do not define the ignitable area.
function groundColor(cell) {
  return FUEL_COLORS[cell.fuelType] ?? COLORS[cell.terrain];
}

export function createMapView(map) {
  const group = new THREE.Group();
  const resources = [];
  const transform = new THREE.Object3D();
  const color = new THREE.Color();
  function positionFor(x, z, y = 0) {
    return [(x + 0.5 - map.width / 2) * map.cellSize, y,
      (z + 0.5 - map.height / 2) * map.cellSize];
  }
  function instances(geometry, material, positions) {
    resources.push(geometry, material);
    const mesh = new THREE.InstancedMesh(geometry, material, positions.length);
    positions.forEach((position, index) => {
      transform.position.set(...position);
      transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
    return mesh;
  }

  const tileGeometry = new THREE.PlaneGeometry(map.cellSize, map.cellSize);
  tileGeometry.rotateX(-Math.PI / 2);
  const tiles = instances(tileGeometry, new THREE.MeshStandardMaterial(),
    map.cells.map((_, i) => positionFor(i % map.width, Math.floor(i / map.width))));
  const brush = [];
  const grass = [];
  const rocks = [];
  const decorationByCell = new Map();
  const brushCells = [];
  const grassCells = [];
  map.cells.forEach((cell, index) => {
    const x = index % map.width;
    const z = Math.floor(index / map.width);
    color.setHex(groundColor(cell));
    tiles.setColorAt(index, color);
    if (cell.fuelType === 'brush' && x % 2 === 0 && z % 2 === 0) {
      brush.push(positionFor(x, z, 0.25));
      brushCells.push(index);
    }
    if (cell.fuelType === 'grass' && x % 2 === 0 && z % 2 === 0) {
      grass.push(positionFor(x, z, 0.06));
      grassCells.push(index);
    }
    // Sparse visual rocks; all gray cells are blocked, even between rock meshes.
    if (cell.terrain === 'obstacle' && x >= 6 && x <= 57 && z >= 18 && z <= 49
      && x % 4 === 0 && z % 4 === 0) rocks.push(positionFor(x, z, 0.12));
  });
  tiles.instanceColor.needsUpdate = true;
  const brushMesh = instances(new THREE.ConeGeometry(0.3, 0.5, 5),
    new THREE.MeshStandardMaterial({ color: 0x2f5638 }), brush);
  const grassMesh = instances(new THREE.BoxGeometry(0.18, 0.12, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x72934c }), grass);
  for (const [mesh, cells] of [[brushMesh, brushCells], [grassMesh, grassCells]]) {
    cells.forEach((cellIndex, instanceIndex) => {
      const matrix = new THREE.Matrix4();
      mesh.getMatrixAt(instanceIndex, matrix);
      decorationByCell.set(cellIndex, { mesh, instanceIndex, matrix });
    });
  }
  instances(new THREE.DodecahedronGeometry(0.22, 0),
    new THREE.MeshStandardMaterial({ color: 0x687276 }), rocks);

  function label(text, x, z, width) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#233529';
    ctx.font = 'bold 76px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(...positionFor(x, z, 0.7));
    sprite.scale.set(width, width / 4, 1);
    sprite.renderOrder = 1;
    group.add(sprite);
    resources.push(texture, material);
  }
  label('START', map.start.x, map.start.z, 5.5);
  label('SAFE', map.safeZone.x, map.safeZone.z, 5.5);
  label('ROUTE A', 21, 23, 6);
  label('ROUTE B', 21, 43, 6);

  const markerGeometry = new THREE.RingGeometry(map.cellSize * 0.52, map.cellSize * 0.85, 24);
  markerGeometry.rotateX(-Math.PI / 2);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xb349df, side: THREE.DoubleSide });
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);
  marker.visible = false;
  group.add(marker);
  const indicatorGeometry = new THREE.BoxGeometry(map.cellSize * 0.8, 0.65, map.cellSize * 0.8);
  const indicatorMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  // One shared batch for every fuel cell; zero-scale instances are initially hidden.
  const indicator = new THREE.InstancedMesh(indicatorGeometry, indicatorMaterial, map.cells.length);
  const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let index = 0; index < map.cells.length; index += 1) {
    indicator.setMatrixAt(index, hidden);
    indicator.setColorAt(index, color.setHex(0xffffff));
  }
  // Active instance positions change after construction; avoid stale cached bounds.
  indicator.frustumCulled = false;
  indicator.visible = false;
  group.add(indicator);
  resources.push(markerGeometry, markerMaterial, indicatorGeometry, indicatorMaterial);

  function syncFire(simulation) {
    for (const index of simulation.takeChanges()) {
      const cell = simulation.cells[index];
      tiles.setColorAt(index, color.setHex(FIRE_COLORS[cell.state] ?? groundColor(map.cells[index])));
      tiles.instanceColor.addUpdateRange(index * 3, 3);
      tiles.instanceColor.needsUpdate = true;
      const x = index % map.width;
      const z = Math.floor(index / map.width);
      const active = cell.state !== 'unburned';
      indicator.setMatrixAt(index, active
        ? new THREE.Matrix4().makeTranslation(...positionFor(x, z, 0.325)) : hidden);
      indicator.setColorAt(index, color.setHex(FIRE_COLORS[cell.state] ?? 0xffffff));
      indicator.instanceMatrix.addUpdateRange(index * 16, 16);
      indicator.instanceMatrix.needsUpdate = true;
      indicator.instanceColor.addUpdateRange(index * 3, 3);
      indicator.instanceColor.needsUpdate = true;
      const decoration = decorationByCell.get(index);
      if (decoration) {
        const matrix = decoration.matrix.clone();
        if (cell.fuel === 0) matrix.scale(new THREE.Vector3(0, 0, 0));
        decoration.mesh.setMatrixAt(decoration.instanceIndex, matrix);
        decoration.mesh.instanceMatrix.addUpdateRange(decoration.instanceIndex * 16, 16);
        decoration.mesh.instanceMatrix.needsUpdate = true;
      }
    }
    marker.visible = simulation.selected !== null && !simulation.started;
    indicator.visible = simulation.selected !== null && simulation.started;
    if (simulation.selected !== null) {
      const x = simulation.selected % map.width;
      const z = Math.floor(simulation.selected / map.width);
      marker.position.set(...positionFor(x, z, 0.55));
    }
  }

  return {
    group,
    syncFire,
    dispose() {
      group.children.forEach((child) => { if (child.isInstancedMesh) child.dispose(); });
      resources.forEach((resource) => resource.dispose());
    },
  };
}
