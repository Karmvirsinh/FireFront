import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { Matrix4, PerspectiveCamera, Vector3, Color } from 'three';
import { createFixedMap } from '../src/world/createFixedMap.js';
import { createFireSimulation, isHazardous } from '../src/simulation/createFireSimulation.js';
import { createMapView } from '../src/rendering/createMapView.js';
import { createGroundPicker } from '../src/rendering/createGroundPicker.js';
import { createIgnitionControls } from '../src/ui/createIgnitionControls.js';

function element() {
  return Object.assign(new EventTarget(), { style: {}, setAttribute() {},
    classList: { toggle() {}, remove() {} } });
}

test('reported fuel gaps: picking, instance placement, lifecycle presentation and hazard agree', () => {
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
    simulation, () => null, () => {});
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
  try {
    for (const [z, fuelType, fuel, walkable, worldZ] of [
      [41, 'brush', 6, false, 4.75], [43, 'grass', 4, true, 5.75],
    ]) {
      simulation.reset();
      view.syncFire(simulation);
      const index = z * 64 + 32;
      assert.equal(map.cells[index].fuelType, fuelType);
      assert.equal(simulation.cells[index].fuel, fuel);
      assert.equal(simulation.cells[index].walkable, walkable);
      view.group.children[0].getMatrixAt(index, matrix);
      const center = new Vector3().setFromMatrixPosition(matrix);
      assert.deepEqual(center.toArray(), [0.25, 0, worldZ]);
      const screen = center.clone().project(camera);
      assert.equal(picker((screen.x + 1) * 640, (1 - screen.y) * 360), index);
      // Sparse fuel models appear only on even X and Z; these odd-Z cells have no model.
      for (const mesh of view.group.children.slice(1, 3)) {
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
      assert.deepEqual(marker.position.toArray(), [0.25, 0.55, worldZ]);
      simulation.start();
      for (const [state, seconds, hex, hazardous, legend, swatch] of [
        ['burning', 0, 0xff8a20, true, 'Burning · hazardous', 'burning'],
        ['burned-hot', fuel, 0xd33138, true, 'Burned-hot · hazardous', 'hot'],
        ['burned-cool', 5, 0x4e5663, false, 'Burned-cool · no hazard', 'cool'],
      ]) {
        for (let step = 0; step < seconds * 20; step += 1) simulation.advance(0.05);
        view.syncFire(simulation);
        ui.refresh();
        const cell = simulation.cells[index];
        assert.equal(cell.state, state);
        assert.equal(isHazardous(cell), hazardous);
        assert.equal(cell.walkable && !isHazardous(cell), state === 'burned-cool' && walkable);
        assert.equal(elements['fire-status'].textContent, `Cell (32, ${z}): ${state}.`);
        assert.equal(indicator.visible, true);
        assert.equal(marker.visible, false);
        assert.deepEqual(indicator.position.toArray(), [0.25, 0.325, worldZ]);
        assert.equal(indicator.material.color.getHex(), hex);
        view.group.children[0].getColorAt(index, color);
        assert.equal(color.getHex(), hex);
        assert.ok(html.includes(legend));
        assert.ok(css.includes(`.swatch.${swatch} { background: #${hex.toString(16)}; }`));
      }
      assert.equal(simulation.cells[index].fuel, 0);
      assert.equal(simulation.cells[index].hotRemaining, 0);
    }
  } finally {
    ui.dispose();
    view.dispose();
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});
