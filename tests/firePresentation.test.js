import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { Matrix4, PerspectiveCamera, Vector3, Color } from 'three';
import { createFixedMap } from '../src/world/createFixedMap.js';
import { createFireSimulation, isHazardous } from '../src/simulation/createFireSimulation.js';
import { FIRE_CONFIG } from '../src/simulation/fireConfig.js';
import { createMapView } from '../src/rendering/createMapView.js';
import { createGroundPicker } from '../src/rendering/createGroundPicker.js';
import { createIgnitionControls } from '../src/ui/createIgnitionControls.js';

function element() {
  return Object.assign(new EventTarget(), { style: {}, setAttribute() {},
    classList: { toggle() {}, remove() {} } });
}

test('grass, brush and forest: picking, lifecycle presentation, reset and hazard agree', () => {
  // A canvas stand-in only for text textures; exercise real Three.js map objects.
  const originalDocument = globalThis.document;
  globalThis.document = { createElement: () => ({ getContext: () => ({ fillRect() {}, fillText() {} }) }) };
  const map = createFixedMap();
  const view = createMapView(map);
  const simulation = createFireSimulation(map);
  const canvas = element();
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1280, height: 720 });
  const elements = Object.fromEntries(['place-ignition', 'start-fire', 'reset-simulation', 'fire-status']
    .map((id) => [id, element()]));
  const ui = createIgnitionControls(canvas, { querySelector: (id) => elements[id.slice(1)] },
    simulation, () => null, () => {}, new EventTarget());
  const [marker, indicator] = view.group.children.slice(-2);
  const camera = new PerspectiveCamera(45, 1280 / 720, 0.1, 500);
  camera.position.set(0, 40, 30);
  camera.lookAt(0, 0, 1);
  camera.updateMatrixWorld();
  const picker = createGroundPicker(camera, canvas, map);
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  const matrix = new Matrix4();
  const color = new Color();
  const originalDecorations = view.group.children.filter((child) => child.name)
    .map((mesh) => ({ mesh, matrices: mesh.instanceMatrix.array.slice() }));
  try {
    for (const [x, z, fuelType, fuel, walkable, worldX, worldZ] of [
      [33, 27, 'grass', 4, false, 0.75, -2.25],
      [29, 33, 'brush', 6, false, -1.25, 0.75],
      [33, 33, 'forest', 10, false, 0.75, 0.75],
    ]) {
      simulation.reset();
      view.syncFire(simulation);
      for (const { mesh, matrices } of originalDecorations) assert.deepEqual(mesh.instanceMatrix.array, matrices);
      const index = z * 64 + x;
      assert.equal(map.cells[index].fuelType, fuelType);
      assert.equal(simulation.cells[index].fuel, fuel);
      assert.equal(simulation.cells[index].walkable, walkable);
      view.group.children[0].getMatrixAt(index, matrix);
      const center = new Vector3().setFromMatrixPosition(matrix);
      assert.deepEqual(center.toArray(), [worldX, 0, worldZ]);
      const screen = center.clone().project(camera);
      assert.equal(picker((screen.x + 1) * 640, (1 - screen.y) * 360), index);
      // Sparse fuel models appear only on even X and Z; these odd-Z cells have no model.
      for (const mesh of view.group.children.filter((child) => child.name)) {
        for (let i = 0; i < mesh.count; i += 1) {
          mesh.getMatrixAt(i, matrix);
          const position = new Vector3().setFromMatrixPosition(matrix);
          assert.ok(position.x !== center.x || position.z !== center.z);
        }
      }
      assert.equal(simulation.cells[index].state, 'unburned');
      simulation.select(index);
      view.syncFire(simulation);
      assert.equal(marker.visible, true);
      assert.deepEqual(marker.position.toArray(), [worldX, 0.55, worldZ]);
      simulation.start();
      for (const [state, seconds, hex, hazardous, legend, swatch] of [
        ['burning', 0, 0xff8a20, true, 'Burning · hazardous', 'burning'],
        ['burned-hot', fuel / FIRE_CONFIG.fuelPerSecond, 0xd33138, true, 'Burned-hot · hazardous', 'hot'],
        ['burned-cool', FIRE_CONFIG.coolingSeconds, 0x4e5663, false, 'Burned-cool · no direct hazard', 'cool'],
      ]) {
        for (let step = 0; step < seconds * 20; step += 1) simulation.advance(0.05);
        view.syncFire(simulation);
        ui.refresh();
        const cell = simulation.cells[index];
        assert.equal(cell.state, state);
        assert.equal(isHazardous(cell), hazardous);
        assert.equal(cell.walkable && !isHazardous(cell), state === 'burned-cool' && walkable);
        assert.equal(elements['fire-status'].textContent, `Cell (${x}, ${z}): ${state}.`);
        assert.equal(indicator.visible, true);
        assert.equal(marker.visible, false);
        indicator.getMatrixAt(index, matrix);
        assert.ok(new Vector3().setFromMatrixPosition(matrix)
          .distanceTo(new Vector3(worldX, 0.325, worldZ)) < 1e-6);
        indicator.getColorAt(index, color);
        assert.equal(color.getHex(), hex);
        view.group.children[0].getColorAt(index, color);
        assert.equal(color.getHex(), hex);
        assert.ok(html.includes(legend));
        assert.ok(css.includes(`.swatch.${swatch} { background: #${hex.toString(16)}; }`));
      }
      assert.equal(simulation.cells[index].fuel, 0);
      assert.equal(simulation.cells[index].hotRemaining, 0);
      // Every propagated cell gets a state indicator and reset restores them all.
      const affected = simulation.cells.flatMap((cell, i) => cell.state !== 'unburned' ? [i] : []);
      assert.ok(affected.length > 1);
      for (const i of affected) {
        indicator.getColorAt(i, color);
        assert.equal(color.getHex(), { burning: 0xff8a20, 'burned-hot': 0xd33138,
          'burned-cool': 0x4e5663 }[simulation.cells[i].state]);
      }
      simulation.reset();
      view.syncFire(simulation);
      for (const i of affected) {
        indicator.getMatrixAt(i, matrix);
        assert.equal(new Vector3().setFromMatrixScale(matrix).length(), 0);
        view.group.children[0].getColorAt(i, color);
        assert.equal(color.getHex(), { brush: 0x527648, grass: 0x91aa59, forest: 0x345b44 }[map.cells[i].fuelType]);
      }
    }
  } finally {
    ui.dispose();
    view.dispose();
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});

test('ground coverage, shrubs and trees agree with fuel classification; roads have no decorations', () => {
  const originalDocument = globalThis.document;
  globalThis.document = { createElement: () => ({ getContext: () => ({ fillRect() {}, fillText() {} }) }) };
  const map = createFixedMap();
  const original = structuredClone(map);
  const view = createMapView(map);
  const tiles = view.group.children[0];
  const simulation = createFireSimulation(map);
  const color = new Color();
  const matrix = new Matrix4();
  const terrainColors = { obstacle: 0x8c9698, route: 0xe0c58e, start: 0x478ecb, safe: 0x55b69b };
  try {
    assert.equal(tiles.count, 64 * 64);
    // Each tile covers its entire logical cell, including undecorated cells.
    assert.equal(tiles.geometry.parameters.width, map.cellSize);
    assert.equal(tiles.geometry.parameters.height, map.cellSize);
    map.cells.forEach((cell, index) => {
      tiles.getColorAt(index, color);
      const expected = { brush: 0x527648, grass: 0x91aa59, forest: 0x345b44 }[cell.fuelType]
        ?? terrainColors[cell.terrain];
      assert.equal(color.getHex(), expected, `ground color at cell ${index}`);
      assert.equal(simulation.eligible(index), cell.fuelType !== 'none');
      tiles.getMatrixAt(index, matrix);
      assert.deepEqual(new Vector3().setFromMatrixPosition(matrix).toArray(),
        [(index % 64 + 0.5 - 32) * map.cellSize, 0,
          (Math.floor(index / 64) + 0.5 - 32) * map.cellSize]);
    });
    for (const [x, z, hex] of [[32, 24, 0xe0c58e], [32, 25, 0x91aa59],
      [32, 42, 0x91aa59], [32, 43, 0xe0c58e], [26, 32, 0x8c9698],
      [27, 32, 0x527648], [31, 32, 0x345b44], [37, 32, 0x8c9698]]) {
        tiles.getColorAt(z * 64 + x, color);
        assert.equal(color.getHex(), hex, `road/fuel boundary (${x}, ${z})`);
    }
    for (const [name, fuelType, geometry] of [['brush', 'brush', 'DodecahedronGeometry'],
      ['grass', 'grass', 'BoxGeometry'], ['forest-trunks', 'forest', 'CylinderGeometry'],
      ['forest-crowns', 'forest', 'ConeGeometry']]) {
      const mesh = view.group.getObjectByName(name);
      assert.ok(mesh.count > 0);
      assert.equal(mesh.geometry.type, geometry);
      for (let i = 0; i < mesh.count; i += 1) {
        mesh.getMatrixAt(i, matrix);
        const position = new Vector3().setFromMatrixPosition(matrix);
        const x = Math.floor(position.x / map.cellSize + 32);
        const z = Math.floor(position.z / map.cellSize + 32);
        assert.equal(map.cells[z * 64 + x].fuelType, fuelType);
        assert.notEqual(map.cells[z * 64 + x].terrain, 'route');
      }
    }
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
    assert.ok(html.includes('Ground color shows fuel coverage.'));
    assert.ok(html.includes('Models do not mark fuel boundaries.'));
    assert.ok(css.includes('.swatch.grass { background: #91aa59; }'));
    assert.ok(css.includes('.swatch.forest { background: #345b44; }'));
    assert.deepEqual(map, original);
  } finally {
    view.dispose();
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});
