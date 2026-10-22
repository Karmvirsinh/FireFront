import * as THREE from 'three';
import { createFireView } from './createFireView.js';
import { getMapRendering } from '../world/mapContract.js';

const COLORS = {
  obstacle: 0x8c9698, vegetation: 0x527648, route: 0xe0c58e,
  start: 0x478ecb, safe: 0x55b69b,
};
const FIRE_COLORS = { burning: 0x67482f, 'burned-hot': 0x332a29, 'burned-cool': 0x4e5663 };
const FUEL_COLORS = { brush: 0x527648, grass: 0x91aa59, forest: 0x345b44 };

// Full-cell ground coverage follows fuel data independently of terrain.
// Sparse decorative models do not define the ignitable area.
function groundColor(cell) {
  return FUEL_COLORS[cell.fuelType] ?? COLORS[cell.terrain];
}

export function createMapView(map) {
  const { labels, decorationBounds } = getMapRendering(map);
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
  // Visual base ends below y=0; the authoritative playable plane stays unchanged.
  for (const [height, y, hex] of [[0.18, -0.10, 0x735338], [0.50, -0.44, 0x4b5145]]) {
    const geometry = new THREE.BoxGeometry(map.width * map.cellSize, height, map.height * map.cellSize);
    // The ground tiles already cover the base. Hidden upper caps only compete
    // with them in the depth buffer at distant views (soil is just 0.01 below).
    // Retain the sides/bottom, without changing ground height or camera limits.
    const normals = geometry.getAttribute('normal');
    const indices = [];
    for (let i = 0; i < geometry.index.count; i += 3) {
      const a = geometry.index.getX(i);
      if (normals.getY(a) > 0.5) continue;
      indices.push(a, geometry.index.getX(i + 1), geometry.index.getX(i + 2));
    }
    geometry.setIndex(indices);
    geometry.clearGroups(); // One material for the retained faces.
    const material = new THREE.MeshStandardMaterial({ color: hex });
    const base = new THREE.Mesh(geometry, material);
    base.name = 'terrain-base';
    base.position.y = y;
    group.add(base);
    resources.push(geometry, material);
  }
  const brush = [];
  const grass = [];
  const forest = [];
  const rocks = [];
  const decorationByCell = new Map();
  const brushCells = [];
  const grassCells = [];
  const forestCells = [];
  map.cells.forEach((cell, index) => {
    const x = index % map.width;
    const z = Math.floor(index / map.width);
    color.setHex(groundColor(cell));
    tiles.setColorAt(index, color);
    if (cell.fuelType === 'brush' && x % 2 === 0 && z % 2 === 0) {
      brush.push(positionFor(x, z, 0.16));
      brushCells.push(index);
    }
    if (cell.fuelType === 'grass' && x % 2 === 0 && z % 2 === 0) {
      grass.push(positionFor(x, z, 0.06));
      grassCells.push(index);
    }
    if (cell.fuelType === 'forest' && x % 2 === 0 && z % 2 === 0) {
      forest.push(positionFor(x, z, 0));
      forestCells.push(index);
    }
    // Sparse visual rocks; all gray cells are blocked, even between rock meshes.
    if (cell.terrain === 'obstacle' && x >= decorationBounds.x0 && x <= decorationBounds.x1
      && z >= decorationBounds.z0 && z <= decorationBounds.z1
      && x % 4 === 0 && z % 4 === 0) rocks.push(positionFor(x, z, 0.12));
  });
  tiles.instanceColor.needsUpdate = true;
  const shrubGeometry = new THREE.DodecahedronGeometry(0.23, 0);
  shrubGeometry.scale(1, 0.65, 1);
  const brushMesh = instances(shrubGeometry,
    new THREE.MeshStandardMaterial({ color: 0x2f5638 }), brush);
  const grassMesh = instances(new THREE.BoxGeometry(0.18, 0.12, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x72934c }), grass);
  const trunkGeometry = new THREE.CylinderGeometry(0.045, 0.06, 0.4, 5);
  trunkGeometry.translate(0, 0.2, 0);
  const crownGeometry = new THREE.ConeGeometry(0.28, 0.75, 6);
  crownGeometry.translate(0, 0.7, 0);
  const trunks = instances(trunkGeometry, new THREE.MeshStandardMaterial({ color: 0x71523b }), forest);
  const crowns = instances(crownGeometry, new THREE.MeshStandardMaterial({ color: 0x244631 }), forest);
  for (const [mesh, cells, name] of [[brushMesh, brushCells, 'brush'], [grassMesh, grassCells, 'grass'],
    [trunks, forestCells, 'forest-trunks'], [crowns, forestCells, 'forest-crowns']]) {
    mesh.name = name;
    mesh.userData.fuelDecoration = true;
    cells.forEach((cellIndex, instanceIndex) => {
      const matrix = new THREE.Matrix4();
      mesh.getMatrixAt(instanceIndex, matrix);
      mesh.setColorAt(instanceIndex, color.setHex(0xffffff));
      if (!decorationByCell.has(cellIndex)) decorationByCell.set(cellIndex, []);
      decorationByCell.get(cellIndex).push({ mesh, instanceIndex, matrix });
    });
  }
  instances(new THREE.DodecahedronGeometry(0.22, 0),
    new THREE.MeshStandardMaterial({ color: 0x687276 }), rocks);

  function label(text, x, z, width) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#233c2c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f4e5bd';
    ctx.font = 'bold 88px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false });
    const sprite = new THREE.Sprite(material);
    sprite.name = 'map-label';
    sprite.userData.text = text;
    sprite.position.set(...positionFor(x, z, 0.35));
    sprite.scale.set(width, width / 4, 1);
    sprite.renderOrder = 1;
    group.add(sprite);
    resources.push(texture, material);
  }
  for (const item of labels) label(item.text, item.x, item.z, item.width);

  // Hollow square marks the exact logical cell, unlike the tapered active flames.
  function outline(size, thickness, hex) {
    const shape = new THREE.Shape();
    const half = size / 2;
    shape.moveTo(-half, -half); shape.lineTo(half, -half);
    shape.lineTo(half, half); shape.lineTo(-half, half); shape.closePath();
    const hole = new THREE.Path();
    const inner = half - thickness;
    hole.moveTo(-inner, -inner); hole.lineTo(-inner, inner);
    hole.lineTo(inner, inner); hole.lineTo(inner, -inner); hole.closePath();
    shape.holes.push(hole);
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({ color: hex, side: THREE.DoubleSide,
      depthTest: false, depthWrite: false });
    resources.push(geometry, material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = 2;
    return mesh;
  }
  const marker = outline(map.cellSize, 0.045, 0x302619);
  marker.name = 'ignition-selection';
  const amber = outline(map.cellSize - 0.02, 0.04, 0xffbf54);
  amber.position.y = 0.002;
  marker.add(amber);
  marker.visible = false;
  group.add(marker);
  crownGeometry.computeBoundingBox();
  const fireView = createFireView(map, {
    treeCells: new Set(forestCells), treeHeight: crownGeometry.boundingBox.max.y,
  });
  group.add(fireView.group);

  function syncFire(simulation) {
    for (const index of simulation.takeChanges()) {
      const cell = simulation.cells[index];
      tiles.setColorAt(index, color.setHex(FIRE_COLORS[cell.state] ?? groundColor(map.cells[index])));
      tiles.instanceColor.addUpdateRange(index * 3, 3);
      tiles.instanceColor.needsUpdate = true;
      fireView.sync(index, cell.state);
      for (const decoration of decorationByCell.get(index) ?? []) {
        const matrix = decoration.matrix.clone();
        const tree = decoration.mesh.name.startsWith('forest-');
        const exhausted = cell.state === 'burned-hot' || cell.state === 'burned-cool';
        // Standing trees darken during burning; exhaustion alone reveals the stump.
        if (tree && exhausted) {
          matrix.scale(decoration.mesh.name === 'forest-trunks'
            ? new THREE.Vector3(0.8, 0.35, 0.8) : new THREE.Vector3(0, 0, 0));
        } else if (!tree) {
          if (cell.fuel === 0) matrix.scale(new THREE.Vector3(0, 0, 0));
          else if (cell.state === 'burning') matrix.scale(new THREE.Vector3(0.65, 0.45, 0.65));
        }
        decoration.mesh.setColorAt(decoration.instanceIndex,
          color.setHex(tree && exhausted ? 0x302b29 : cell.state === 'burning' ? 0x89613f : 0xffffff));
        decoration.mesh.instanceColor.addUpdateRange(decoration.instanceIndex * 3, 3);
        decoration.mesh.instanceColor.needsUpdate = true;
        decoration.mesh.setMatrixAt(decoration.instanceIndex, matrix);
        decoration.mesh.instanceMatrix.addUpdateRange(decoration.instanceIndex * 16, 16);
        decoration.mesh.instanceMatrix.needsUpdate = true;
      }
    }
    marker.visible = simulation.selected !== null && !simulation.started;
    if (simulation.selected !== null) {
      const x = simulation.selected % map.width;
      const z = Math.floor(simulation.selected / map.width);
      marker.position.set(...positionFor(x, z, 0.025));
    }
  }

  return {
    group,
    syncFire,
    animate: fireView.animate,
    dispose() {
      fireView.dispose();
      group.children.forEach((child) => { if (child.isInstancedMesh) child.dispose(); });
      resources.forEach((resource) => resource.dispose());
    },
  };
}
