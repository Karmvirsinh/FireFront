import assert from 'node:assert/strict';
import test from 'node:test';
import { PerspectiveCamera, Vector3 } from 'three';
import { createCameraControls } from '../src/rendering/createCameraControls.js';

function emit(target, type, properties = {}) {
  const event = new Event(type, { cancelable: true });
  Object.assign(event, properties);
  target.dispatchEvent(event);
  return event;
}

function fixture() {
  // Exercise the actual installed OrbitControls with a small DOM event stand-in.
  const document = new EventTarget();
  const canvas = new EventTarget();
  Object.assign(canvas, {
    style: {}, ownerDocument: document, clientWidth: 1280, clientHeight: 720,
    getRootNode: () => document,
    setPointerCapture() {}, releasePointerCapture() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
  });
  const keyboard = new EventTarget();
  const camera = new PerspectiveCamera(45, 1280 / 720, 0.1, 100);
  camera.position.set(7, 6, 9);
  camera.lookAt(0, 0, 0);
  const navigation = createCameraControls(camera, canvas, keyboard);
  const { controls } = navigation;
  function drag(button, dx, dy, modifiers = {}) {
    const properties = { pointerId: 1, pointerType: 'mouse', button,
      clientX: 500, clientY: 300, ...modifiers };
    emit(canvas, 'pointerdown', properties);
    emit(document, 'pointermove', { ...properties, clientX: 500 + dx, clientY: 300 + dy });
    emit(document, 'pointerup', properties);
    navigation.update();
  }
  return { canvas, keyboard, camera, navigation, controls, drag };
}

function closeVector(actual, expected) {
  assert.ok(actual.distanceTo(expected) < 1e-9, `${actual.toArray()} != ${expected.toArray()}`);
}

test('mouse bindings, ground/zoom limits, bounded pan, and combined reset', () => {
  const f = fixture();
  try {
    const initial = f.camera.position.clone();
    f.drag(0, 120, 80);
    f.drag(0, 120, 80, { ctrlKey: true });
    closeVector(f.camera.position, initial);
    f.drag(1, 120, 80);
    assert.ok(f.camera.position.distanceTo(initial) > 0.1);
    closeVector(f.controls.target, new Vector3());
    const offset = f.camera.position.clone().sub(f.controls.target);
    f.drag(2, 20000, 20000);
    assert.ok(f.controls.target.length() > 0);
    assert.ok(Math.abs(f.controls.target.x) <= 3 && Math.abs(f.controls.target.z) <= 3);
    assert.equal(f.controls.target.y, 0);
    closeVector(f.camera.position.clone().sub(f.controls.target), offset);
    for (const deltaY of [-10000, 10000]) {
      emit(f.canvas, 'wheel', { deltaY, deltaMode: 0, clientX: 500, clientY: 300 });
      f.navigation.update();
      assert.ok(f.controls.getDistance() >= 6 - 1e-9 && f.controls.getDistance() <= 22 + 1e-9);
      assert.ok(Math.abs(f.controls.getDistance() - (deltaY < 0 ? 6 : 22)) < 1e-9);
    }
    for (const dy of [-20000, 20000]) {
      f.drag(1, 0, dy);
      assert.ok(f.controls.getPolarAngle() >= Math.PI / 12 - 1e-9);
      assert.ok(f.controls.getPolarAngle() <= 5 * Math.PI / 12 + 1e-9);
      assert.ok(f.camera.position.y > 0);
    }
    f.camera.zoom = 1.5;
    emit(f.keyboard, 'keydown', { key: 'r' });
    closeVector(f.camera.position, initial);
    closeVector(f.controls.target, new Vector3());
    assert.equal(f.camera.zoom, 1);
    f.navigation.update();
    closeVector(f.camera.position, initial);
  } finally { f.navigation.dispose(); }
});

test('reset ignores editable targets, composition and modifier shortcuts', () => {
  const f = fixture();
  try {
    f.drag(1, 120, 80);
    const moved = f.camera.position.clone();
    const ignored = [
      { ctrlKey: true }, { altKey: true }, { metaKey: true }, { isComposing: true },
      ...['INPUT', 'TEXTAREA', 'SELECT'].map((tagName) => ({ composedPath: () => [{ tagName }] })),
      { composedPath: () => [{ isContentEditable: true }] },
    ];
    for (const properties of ignored) {
      const event = emit(f.keyboard, 'keydown', { key: 'r', ...properties });
      assert.equal(event.defaultPrevented, false);
      closeVector(f.camera.position, moved);
    }
    const reset = emit(f.keyboard, 'keydown', { key: 'R', shiftKey: true });
    assert.equal(reset.defaultPrevented, true);
    closeVector(f.camera.position, new Vector3(7, 6, 9));
  } finally { f.navigation.dispose(); }
});

test('context menu is prevented on canvas; cleanup removes pointer/wheel/reset listeners', () => {
  const f = fixture();
  assert.equal(emit(f.canvas, 'contextmenu').defaultPrevented, true);
  assert.equal(emit(new EventTarget(), 'contextmenu').defaultPrevented, false);
  f.drag(1, 120, 80);
  const moved = f.camera.position.clone();
  f.navigation.dispose();
  assert.equal(emit(f.canvas, 'contextmenu').defaultPrevented, false);
  emit(f.canvas, 'wheel', { deltaY: -1000, deltaMode: 0 });
  emit(f.keyboard, 'keydown', { key: 'r' });
  f.drag(1, 100, 100);
  closeVector(f.camera.position, moved);
});
