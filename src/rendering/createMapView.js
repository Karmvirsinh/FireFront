import * as THREE from 'three';

const COLORS = {
  obstacle: 0x8c9698, vegetation: 0x527648, route: 0xe0c58e,
  start: 0x478ecb, safe: 0x55b69b,
};

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
  map.cells.forEach((cell, index) => {
    const x = index % map.width;
    const z = Math.floor(index / map.width);
    color.setHex(COLORS[cell.terrain]);
    tiles.setColorAt(index, color);
    if (cell.fuelType === 'brush' && x % 2 === 0 && z % 2 === 0) {
      brush.push(positionFor(x, z, 0.25));
    }
    if (cell.fuelType === 'grass' && x % 2 === 0 && z % 2 === 0) {
      grass.push(positionFor(x, z, 0.06));
    }
    // Sparse visual rocks; all gray cells are blocked, even between rock meshes.
    if (cell.terrain === 'obstacle' && x >= 6 && x <= 57 && z >= 18 && z <= 49
      && x % 4 === 0 && z % 4 === 0) rocks.push(positionFor(x, z, 0.12));
  });
  tiles.instanceColor.needsUpdate = true;
  instances(new THREE.ConeGeometry(0.3, 0.5, 5),
    new THREE.MeshStandardMaterial({ color: 0x2f5638 }), brush);
  instances(new THREE.BoxGeometry(0.18, 0.12, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x72934c }), grass);
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

  return {
    group,
    dispose() {
      group.children.forEach((child) => { if (child.isInstancedMesh) child.dispose(); });
      resources.forEach((resource) => resource.dispose());
    },
  };
}
