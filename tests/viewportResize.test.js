import assert from 'node:assert/strict';
import test from 'node:test';
import { PerspectiveCamera } from 'three';
import { createViewportResize } from '../src/rendering/createViewportResize.js';

test('embedded viewport resize updates buffer, projection and framing; cleanup disconnects observation', () => {
  const host = new EventTarget();
  host.devicePixelRatio = 3;
  host.innerWidth = 1920; // Must not use the browser's full dimensions.
  host.innerHeight = 1080;
  const viewport = { clientWidth: 920, clientHeight: 560 };
  const camera = new PerspectiveCamera(45, 1, 0.1, 500);
  const sizes = [];
  const ratios = [];
  const aspects = [];
  let observer;
  class Observer {
    constructor(callback) { this.callback = callback; observer = this; }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
  }
  const stop = createViewportResize(viewport, {
    setPixelRatio: (ratio) => ratios.push(ratio),
    setSize: (...size) => sizes.push(size),
  }, camera, { frameMap: (aspect) => aspects.push(aspect) }, host, Observer);
  assert.equal(observer.target, viewport);
  assert.deepEqual(sizes.at(-1), [920, 560, false]);
  assert.equal(ratios.at(-1), 2);
  const projection = camera.projectionMatrix.clone();
  // Container rearrangement without a window event (e.g. responsive panel layout).
  viewport.clientWidth = 336;
  viewport.clientHeight = 330;
  observer.callback();
  assert.deepEqual(sizes.at(-1), [336, 330, false]);
  assert.equal(camera.aspect, 336 / 330);
  assert.equal(aspects.at(-1), camera.aspect);
  assert.ok(!camera.projectionMatrix.equals(projection));
  host.devicePixelRatio = 1;
  host.dispatchEvent(new Event('resize'));
  assert.equal(ratios.at(-1), 1);
  viewport.clientWidth = viewport.clientHeight = 0;
  observer.callback();
  assert.deepEqual(sizes.at(-1), [1, 1, false]);
  stop();
  assert.equal(observer.disconnected, true);
  const count = sizes.length;
  host.dispatchEvent(new Event('resize'));
  assert.equal(sizes.length, count);
});
