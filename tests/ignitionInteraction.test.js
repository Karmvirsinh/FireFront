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

test('embedded picking follows canvas offsets and scrolling without changing the selected logical cell', () => {
  const map = createFixedMap();
  const camera = new PerspectiveCamera(45, 1, 0.1, 500);
  camera.position.set(0, 40, 30);
  camera.lookAt(0, 0, 1);
  camera.updateMatrixWorld();
  let rect;
  const picker = createGroundPicker(camera, { getBoundingClientRect: () => rect }, map);
  for (rect of [
    { left: 17, top: 110, width: 910, height: 500 },
    { left: 13, top: 140, width: 334, height: 320 },
    { left: 13, top: -120, width: 334, height: 320 },
  ]) {
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    for (const [x, z] of [[32, 32], [31, 26], [32, 24]]) {
      const point = new Vector3((x + 0.5 - 32) * 0.5, 0, (z + 0.5 - 32) * 0.5).project(camera);
      assert.equal(picker(rect.left + (point.x + 1) / 2 * rect.width,
        rect.top + (1 - point.y) / 2 * rect.height), z * 64 + x);
    }
    assert.equal(picker(rect.left - 1, rect.top + rect.height / 2), null);
    assert.equal(picker(rect.left + rect.width, rect.top + rect.height / 2), null);
  }
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

test('I shares placement toggle, guards keys/typing/locks, never selects or starts, and cleans up', () => {
  const canvas = element();
  const keyboard = new EventTarget();
  const elements = Object.fromEntries(['place-ignition', 'start-fire', 'reset-simulation', 'fire-status']
    .map((name) => [name, element()]));
  const simulation = createFireSimulation(createFixedMap());
  const ui = createIgnitionControls(canvas, { querySelector: (id) => elements[id.slice(1)] },
    simulation, () => { assert.fail('keyboard must never pick a cell'); },
    () => { assert.fail('toggle must never change simulation state'); }, keyboard);
  function key(props = {}, path = []) {
    const event = new Event('keydown', { cancelable: true });
    Object.assign(event, { key: 'i', composedPath: () => path, ...props });
    keyboard.dispatchEvent(event);
    return event;
  }
  const placing = () => elements['place-ignition'].attributes['aria-pressed'];
  try {
    assert.equal(key().defaultPrevented, true);
    assert.equal(placing(), 'true');
    assert.equal(canvas.style.cursor, 'crosshair');
    assert.equal(simulation.selected, null);
    assert.equal(simulation.started, false);
    for (const props of [{ repeat: true }, { ctrlKey: true }, { altKey: true }, { metaKey: true },
      { isComposing: true }, { key: 'r' }, { key: 'x' }]) {
      assert.equal(key(props).defaultPrevented, false);
      assert.equal(placing(), 'true');
    }
    for (const path of [[{ tagName: 'INPUT' }], [{ tagName: 'TEXTAREA' }], [{ tagName: 'SELECT' }],
      [{ isContentEditable: true }], [{ tagName: 'SPAN' }, { isContentEditable: true }]]) {
      assert.equal(key({}, path).defaultPrevented, false);
      assert.equal(placing(), 'true');
    }
    const prevented = new Event('keydown', { cancelable: true });
    Object.assign(prevented, { key: 'i', composedPath: () => [] });
    prevented.preventDefault();
    keyboard.dispatchEvent(prevented);
    assert.equal(placing(), 'true');
    key({ key: 'I' });
    assert.equal(placing(), 'false');
    emit(elements['place-ignition'], 'click');
    assert.equal(placing(), 'true');
    key();
    assert.equal(placing(), 'false');
    // Respect independently disabled UI even before fire has started.
    elements['place-ignition'].disabled = true;
    assert.equal(key().defaultPrevented, false);
    assert.equal(placing(), 'false');
    elements['place-ignition'].disabled = false;
    simulation.select(32 * 64 + 32);
    key();
    key();
    assert.equal(simulation.selected, 32 * 64 + 32);
    assert.equal(simulation.started, false);
    simulation.start();
    ui.refresh();
    assert.equal(elements['place-ignition'].disabled, true);
    key();
    assert.equal(placing(), 'false');
    // The run lock remains authoritative even if a stale UI were enabled.
    elements['place-ignition'].disabled = false;
    key();
    assert.equal(placing(), 'false');
    simulation.reset();
    ui.refresh();
    key();
    assert.equal(placing(), 'true');
  } finally { ui.dispose(); }
  assert.equal(key().defaultPrevented, false);
  assert.equal(canvas.style.cursor, 'auto');
  assert.equal(canvas.classList.contains('placing-ignition'), false);
});
test('toggle, panel isolation, gesture guards, start lock, reset and cleanup', () => {
  const canvas = element();
  const elements = Object.fromEntries(['place-ignition', 'start-fire', 'reset-simulation', 'fire-status']
    .map((name) => [name, element()]));
  const panel = { querySelector: (selector) => elements[selector.slice(1)] };
  const simulation = createFireSimulation(createFixedMap());
  let picked = 32 * 64 + 31;
  let pickCount = 0;
  const ui = createIgnitionControls(canvas, panel, simulation, () => { pickCount += 1; return picked; }, () => {}, new EventTarget());
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
  picked = 26 * 64 + 31;
  click();
  assert.equal(simulation.selected, picked);
  picked = 0;
  click();
  assert.equal(simulation.selected, 26 * 64 + 31);
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
