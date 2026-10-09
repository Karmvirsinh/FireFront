import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Rendering only: no clocks, fuel consumption, or random numbers enter the simulation.
export function createFireView(map, { treeCells, treeHeight }) {
  const group = new THREE.Group();
  const burning = new Set();
  const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
  const transform = new THREE.Object3D();
  const resources = [];
  let wasReduced = true;
  const treeIndices = [...treeCells];
  const treeSlots = new Map(treeIndices.map((cell, slot) => [cell, slot]));
  function batch(name, geometry, color, cells = null) {
    const material = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.InstancedMesh(geometry, material, cells?.length ?? map.cells.length);
    if (cells) mesh.userData.cells = cells;
    mesh.name = name;
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < mesh.count; i += 1) mesh.setMatrixAt(i, hidden);
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
    resources.push(geometry, material);
    return mesh;
  }
  function tongues(parts) {
    const pieces = parts.map(([x, z, height, radius]) => {
      const geometry = new THREE.ConeGeometry(radius, height, 5);
      geometry.translate(x, height / 2 + 0.015, z);
      return geometry;
    });
    const merged = mergeGeometries(pieces);
    pieces.forEach((geometry) => geometry.dispose());
    return merged;
  }
  // Restore the original compact, fuller cluster for grass, brush and floor fuel.
  const flameGeometry = tongues([[0, 0, 0.32, 0.115],
    [-0.12, 0.04, 0.20, 0.065], [0.12, -0.04, 0.23, 0.065]]);
  const flames = batch('fire-flames', flameGeometry, 0xff8a20);
  const coreGeometry = new THREE.ConeGeometry(0.065, 0.19, 5);
  coreGeometry.translate(0, 0.11, 0.025);
  const cores = batch('fire-cores', coreGeometry, 0xffe19a);
  // A separate surrounding cluster reaches the crown at actual tree models only.
  // Open gaps preserve the standing silhouette; all tongues stay inside the cell.
  const treeFlames = batch('tree-flames', tongues([
    [0, 0.13, treeHeight * 1.05 - 0.015, 0.11],
    [-0.11, -0.08, treeHeight * 0.95 - 0.015, 0.12],
    [0.11, -0.08, treeHeight * 0.85 - 0.015, 0.12],
  ]), 0xff8a20, treeIndices);
  const treeCores = batch('tree-cores', tongues([
    [0, 0.16, treeHeight * 0.8, 0.06],
    [-0.13, -0.09, treeHeight * 0.65, 0.055],
    [0.13, -0.09, treeHeight * 0.6, 0.055],
  ]), 0xffd76a, treeIndices);
  const strips = [-0.07, 0.07].map((z) => {
    const geometry = new THREE.BoxGeometry(map.cellSize * 0.65, 0.012, 0.025);
    geometry.translate(0, 0.018, z);
    return geometry;
  });
  const emberGeometry = mergeGeometries(strips);
  strips.forEach((geometry) => geometry.dispose());
  const embers = batch('fire-embers', emberGeometry, 0xd33138);
  function write(mesh, index, active, scale = 1) {
    const slot = mesh.userData.cells ? treeSlots.get(index) : index;
    if (slot === undefined) return;
    transform.position.set((index % map.width + 0.5 - map.width / 2) * map.cellSize, 0,
      (Math.floor(index / map.width) + 0.5 - map.height / 2) * map.cellSize);
    transform.scale.set(1, scale, 1);
    transform.updateMatrix();
    mesh.setMatrixAt(slot, active ? transform.matrix : hidden);
    mesh.instanceMatrix.addUpdateRange(slot * 16, 16);
    mesh.instanceMatrix.needsUpdate = true;
  }
  return {
    group,
    sync(index, state) {
      if (state === 'burning') burning.add(index);
      else burning.delete(index);
      const tree = treeCells.has(index);
      write(flames, index, state === 'burning' && !tree);
      write(cores, index, state === 'burning' && !tree);
      write(treeFlames, index, state === 'burning' && tree);
      write(treeCores, index, state === 'burning' && tree);
      write(embers, index, state === 'burned-hot');
    },
    animate(seconds, reducedMotion) {
      if (reducedMotion && wasReduced) return;
      for (const index of burning) {
        // Stable per-cell phase; render-time flicker never advances simulation time.
        const scale = reducedMotion ? 1 : 1 + 0.08 * Math.sin(seconds * 7 + index * 2.4);
        const pair = treeCells.has(index) ? [treeFlames, treeCores] : [flames, cores];
        for (const mesh of pair) write(mesh, index, true, scale);
      }
      wasReduced = reducedMotion;
    },
    dispose() {
      group.children.forEach((mesh) => mesh.dispose());
      resources.forEach((resource) => resource.dispose());
    },
  };
}
