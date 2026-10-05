import assert from 'node:assert/strict';
import test from 'node:test';
import { PerspectiveCamera, Vector3 } from 'three';
import { createGroundPicker } from '../src/rendering/createGroundPicker.js';
import { createFixedMap } from '../src/world/createFixedMap.js';
import { createFireSimulation } from '../src/simulation/createFireSimulation.js';
import { createIgnitionControls } from '../src/ui/createIgnitionControls.js';

test('ground raycasting resolves grid cells after zoom, pan, orbit and resizing', () => {
  const map = createFixedMap();
  const camera = new PerspectiveCamera(45, 1280 / 720, 0.1, 500);
  let rect = { left: 10, top: 20, width: 1280, height: 720 };
  const picker = createGroundPicker(camera, { getBoundingClientRect: () => rect }, map);
  for (const [position, target, size] of [
    [[0, 40, 30], [0, 0, 1], [1280, 720]],
    [[8, 18, 12], [3, 0, 2], [1280, 720]],
    [[-32, 44, 12], [-2, 0, -1], [360, 640]],
  ]) {
    [rect.width, rect.height] = size;
    camera.aspect = rect.width / rect.height;
    camera.position.set(...position);
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    for (const [x, z] of [[31, 32], [30, 23], [32, 44]]) {
      const point = new Vector3((x + 0.5 - 32) * 0.5, 0, (z + 0.5 - 32) * 0.5).project(camera);
      const index = picker(rect.left + (point.x + 1) / 2 * rect.width,
        rect.top + (1 - point.y) / 2 * rect.height);
      assert.equal(index, z * 64 + x);
    }
  }
  assert.equal(picker(-1, -1), null);
});

function element() {
  const target = new EventTarget();
  target.style = {};
  target.attributes = {};
  target.setAttribute = (key, value) => { target.attributes[key] = value; };
  const classes = new Set();
  target.classList = { toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name),
    remove: (name) => classes.delete(name), contains: (name) => classes.has(name) };
  return target;
}
function emit(target, type, props = {}) {
  const event = new Event(type);
  Object.assign(event, props);
  target.dispatchEvent(event);
}
test('toggle, panel isolation, gesture guards, start lock, reset and cleanup', () => {
  const canvas = element();
  const elements = Object.fromEntries(['place-ignition', 'start-fire', 'reset-simulation', 'fire-status']
    .map((name) => [name, element()]));
  const panel = { querySelector: (selector) => elements[selector.slice(1)] };
  const simulation = createFireSimulation(createFixedMap());
  let picked = 32 * 64 + 31;
  let pickCount = 0;
  const ui = createIgnitionControls(canvas, panel, simulation, () => { pickCount += 1; return picked; }, () => {});
  const properties = { button: 0, buttons: 1, isPrimary: true, pointerType: 'mouse',
    pointerId: 1, clientX: 500, clientY: 300 };
  function click(props = {}) {
    emit(canvas, 'pointerdown', { ...properties, ...props });
    emit(canvas, 'pointerup', { ...properties, ...props });
  }
  click();
  assert.equal(pickCount, 0);
  assert.equal(elements['start-fire'].disabled, true);
  emit(elements['place-ignition'], 'click');
  assert.equal(canvas.classList.contains('placing-ignition'), true);
  assert.equal(canvas.style.cursor, 'crosshair');
  for (const props of [{ button: 1, buttons: 4 }, { button: 2, buttons: 2 },
    { ctrlKey: true }, { pointerType: 'touch' }]) click(props);
  emit(canvas, 'pointerdown', properties);
  emit(canvas, 'pointermove', { ...properties, clientX: 530 });
  emit(canvas, 'pointerup', properties);
  emit(canvas, 'pointerdown', properties);
  emit(canvas, 'wheel');
  emit(canvas, 'pointerup', properties);
  emit(elements['fire-status'], 'pointerdown', properties);
  emit(elements['fire-status'], 'pointerup', properties);
  assert.equal(pickCount, 0);
  click();
  assert.equal(simulation.selected, picked);
  assert.equal(elements['start-fire'].disabled, false);
  picked = 23 * 64 + 31;
  click();
  assert.equal(simulation.selected, picked);
  picked = 0;
  click();
  assert.equal(simulation.selected, 23 * 64 + 31);
  emit(elements['place-ignition'], 'click');
  const count = pickCount;
  click();
  assert.equal(pickCount, count);
  emit(elements['start-fire'], 'click');
  assert.equal(elements['place-ignition'].disabled, true);
  assert.equal(canvas.classList.contains('placing-ignition'), false);
  click();
  assert.equal(pickCount, count);
  emit(elements['reset-simulation'], 'click');
  assert.equal(simulation.selected, null);
  assert.equal(elements['place-ignition'].disabled, false);
  assert.equal(elements['place-ignition'].attributes['aria-pressed'], 'false');
  ui.dispose();
  emit(elements['place-ignition'], 'click');
  click();
  assert.equal(pickCount, count);
});
