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

function fixture(mapBounds = null) {
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
  const navigation = createCameraControls(camera, canvas, keyboard, mapBounds);
  navigation.frameMap(camera.aspect);
  const { controls } = navigation;
  function drag(button, dx, dy, modifiers = {}) {
    const properties = { pointerId: 1, pointerType: 'mouse', button,
      clientX: 500, clientY: 300, ...modifiers };
    emit(canvas, 'pointerdown', properties);
    emit(document, 'pointermove', { ...properties, clientX: 500 + dx, clientY: 300 + dy });
    emit(document, 'pointerup', properties);
    navigation.update();
  }
  return { canvas, document, keyboard, camera, navigation, controls, drag };
}

function closeVector(actual, expected) {
  assert.ok(actual.distanceTo(expected) < 1e-9, `${actual.toArray()} != ${expected.toArray()}`);
}

test('useful-area framing keeps markers visible, reset identical, and navigation bounds unchanged', () => {
  const f = fixture({ worldWidth: 32, worldDepth: 32,
    framing: { width: 29, depth: 16, centerX: 0, centerZ: 1 } });
  try {
    for (const aspect of [1280 / 720, 1440 / 900, 640 / 360, 360 / 640]) {
      f.camera.aspect = aspect;
      f.camera.updateProjectionMatrix();
      f.navigation.frameMap(aspect);
      emit(f.keyboard, 'keydown', { key: 'r' });
      const initial = f.camera.position.clone();
      f.camera.updateMatrixWorld();
      // Enclose the entire useful ground area and the endpoint sprite extents.
      for (const x of [-14.5, 14.5]) for (const z of [-7, 9]) {
        const projected = new Vector3(x, 1.4, z).project(f.camera);
        assert.ok(Math.abs(projected.x) < 0.94 && Math.abs(projected.y) < 0.94);
      }
      assert.equal(f.controls.minDistance, 16);
      const halfAngle = Math.min(Math.PI / 8, Math.atan(Math.tan(Math.PI / 8) * aspect));
      assert.ok(Math.abs(f.controls.maxDistance - Math.hypot(32, 32) / 2
        / Math.sin(halfAngle) * 1.08 * 1.5) < 1e-9);
      f.drag(1, 120, 80);
      f.drag(2, 20000, 20000);
      assert.ok(Math.abs(f.controls.target.x) <= 8 && Math.abs(f.controls.target.z) <= 8);
      emit(f.keyboard, 'keydown', { key: 'r' });
      closeVector(f.camera.position, initial);
      closeVector(f.controls.target, new Vector3(0, 0, 1));
    }
  } finally { f.navigation.dispose(); }
});

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

test('map framing fits both axes, adapts reset on resize, and scales navigation bounds', () => {
  const f = fixture({ worldWidth: 32, worldDepth: 32 });
  try {
    const radius = Math.hypot(32, 32) / 2;
    assert.ok(f.controls.getDistance() * Math.sin(Math.PI / 8) > radius);
    assert.equal(f.controls.minDistance, 16);
    f.drag(2, 20000, 20000);
    assert.ok(Math.abs(f.controls.target.x) <= 8 && Math.abs(f.controls.target.z) <= 8);
    const navigated = f.camera.position.clone();
    f.navigation.frameMap(360 / 640);
    closeVector(f.camera.position, navigated);
    emit(f.keyboard, 'keydown', { key: 'r' });
    closeVector(f.controls.target, new Vector3());
    const horizontalHalfAngle = Math.atan(Math.tan(Math.PI / 8) * 360 / 640);
    assert.ok(f.controls.getDistance() * Math.sin(horizontalHalfAngle) > radius);
    assert.ok(f.controls.maxDistance > f.controls.getDistance());
    const narrowView = f.camera.position.clone();
    f.navigation.frameMap(1280 / 720);
    assert.ok(f.camera.position.length() < narrowView.length());
  } finally { f.navigation.dispose(); }
});

test('canvas owns outside drags; release/cancel/focus loss retire them; panel cannot initiate', () => {
  for (const [button, buttons] of [[2, 2], [1, 4]]) {
    const f = fixture();
    const panel = new EventTarget();
    const pointer = { pointerId: 7, pointerType: 'mouse', button, buttons,
      clientX: 500, clientY: 300 };
    const move = (heldButtons = buttons) => emit(f.document, 'pointermove',
      { ...pointer, buttons: heldButtons, clientX: 1400, clientY: 800 }); // Outside canvas.
    try {
      emit(panel, 'pointerdown', pointer);
      const initial = f.camera.position.clone();
      move();
      closeVector(f.camera.position, initial);
      emit(f.canvas, 'pointerdown', pointer);
      move();
      assert.ok(f.camera.position.distanceTo(initial) > 0.1, 'held canvas drag continues outside');
      emit(f.document, 'pointerup', { ...pointer, buttons: 0 });
      const released = f.camera.position.clone();
      move();
      closeVector(f.camera.position, released);

      for (const cancel of [
        () => emit(f.canvas, 'pointercancel', pointer),
        () => emit(f.canvas, 'lostpointercapture', pointer),
        () => emit(f.keyboard, 'blur'),
        () => { f.document.hidden = true; emit(f.document, 'visibilitychange'); f.document.hidden = false; },
        () => move(0), // Release outside browser: next mouse move reports no held button.
      ]) {
        emit(f.keyboard, 'keydown', { key: 'r' });
        emit(f.canvas, 'pointerdown', pointer);
        cancel();
        const stopped = f.camera.position.clone();
        emit(panel, 'pointerdown', pointer);
        move();
        closeVector(f.camera.position, stopped);
        f.drag(1, 50, 40);
        assert.ok(f.camera.position.distanceTo(stopped) > 0.1, 'fresh orbit still works after cancellation');
      }
    } finally { f.navigation.dispose(); }
    const disposed = f.camera.position.clone();
    emit(f.keyboard, 'blur'); emit(f.canvas, 'lostpointercapture', pointer);
    f.drag(2, 50, 40);
    closeVector(f.camera.position, disposed);
  }
});
