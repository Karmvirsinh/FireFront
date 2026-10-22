import assert from 'node:assert/strict';
import test from 'node:test';
import { Vector3 } from 'three';
import { createFixedMap } from '../src/world/createFixedMap.js';
import { createFixedMapDefinition } from '../src/world/createFixedMapDefinition.js';
import { normalizeMap, getCameraBounds } from '../src/world/mapContract.js';
import { createEvacuationSimulation } from '../src/simulation/createEvacuationSimulation.js';
import { createScene } from '../src/rendering/createScene.js';
import { createApplication } from '../src/app/createApplication.js';
import { measureScenario } from '../scripts/measurePacing.js';

function smallMap() {
  const map = { name: 'Synthetic test map', width: 12, height: 8, cellSize: 0.5,
    cells: Array.from({ length: 96 }, () => ({ terrain: 'route', fuelType: 'none', walkable: true })),
    start: { x: 1, z: 2 }, safeZone: { x: 10, z: 5 }, spawnCells: [25, 26, 37],
    rendering: { decorationBounds: { x0: 2, x1: 8, z0: 1, z1: 6 },
      labels: [{ text: 'START', x: 1, z: 1, width: 1.2 }, { text: 'SAFE', x: 10, z: 6, width: 1.2 }] },
  };
  for (const index of [0, 56]) map.cells[index] = { terrain: 'obstacle', fuelType: 'none', walkable: false };
  map.cells[53] = { terrain: 'vegetation', fuelType: 'grass', walkable: false };
  return map;
}

function emit(target, type, props = {}) {
  const event = new Event(type, { cancelable: true });
  Object.assign(event, props);
  target.dispatchEvent(event);
  return event;
}
class Element extends EventTarget {
  constructor() {
    super(); this.listeners = new Map(); this.style = {}; this.attributes = {}; this.textContent = '';
    const classes = new Set();
    this.classList = { add: (v) => classes.add(v), remove: (v) => classes.delete(v),
      toggle(v, on) { if (on) classes.add(v); else classes.delete(v); } };
  }
  addEventListener(type, callback, options) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(callback); super.addEventListener(type, callback, options);
  }
  removeEventListener(type, callback, options) {
    this.listeners.get(type)?.delete(callback); super.removeEventListener(type, callback, options);
  }
  listenerCount() { return [...this.listeners.values()].reduce((n, set) => n + set.size, 0); }
  setAttribute(name, value) { this.attributes[name] = value; }
  setPointerCapture() {}
  releasePointerCapture() {}
  remove() { this.removed = true; }
}
function fixture(benchmark = false) {
  const saved = { window: globalThis.window, document: globalThis.document, ResizeObserver: globalThis.ResizeObserver };
  const doc = new Element(); const host = new Element(); const canvas = new Element();
  const viewport = { clientWidth: 920, clientHeight: 555 };
  const nodes = Object.fromEntries(['place-ignition', 'start-fire', 'reset-simulation', 'fire-status', 'ignition-label',
    'count-waiting', 'count-evacuating', 'count-trapped', 'count-evacuated', 'count-lost',
    'map-summary', 'population-summary', 'population-detail'].map((name) => [name, new Element()]));
  const panel = { querySelector: (id) => nodes[id.slice(1)] };
  const exports = [];
  const fps = Object.assign(new Element(), { parentElement: { append: (...items) => exports.push(...items) } });
  doc.documentElement = new Element(); doc.hidden = false; doc.hasFocus = () => true;
  doc.querySelector = panel.querySelector;
  doc.createElement = () => Object.assign(new Element(), { getContext: () => ({ fillRect() {}, fillText() {} }) });
  Object.assign(host, { devicePixelRatio: 1, innerWidth: 1280, innerHeight: 720,
    navigator: { userAgent: 'fixture', platform: 'fixture' }, matchMedia: () => ({ matches: true }) });
  Object.assign(canvas, { ownerDocument: doc, parentElement: viewport, clientWidth: 920, clientHeight: 555,
    getRootNode: () => doc, getBoundingClientRect: () => ({ left: 31, top: 87,
      width: viewport.clientWidth, height: viewport.clientHeight }) });
  const observers = new Set();
  class Observer {
    constructor(callback) { this.callback = callback; }
    observe() { observers.add(this); }
    disconnect() { observers.delete(this); }
  }
  globalThis.window = host; globalThis.document = doc; globalThis.ResizeObserver = Observer;
  const loops = new Set(); const renderers = []; const events = [];
  let peakLoops = 0; let disposedResources = 0;
  function rendererFactory() {
    events.push('construct');
    // Every previous renderer must be disposed before a replacement is constructed.
    assert.ok(renderers.every((renderer) => renderer.disposed));
    const renderer = { disposed: false, loop: null, draws: 0, tracked: new Set(), released: new Set(),
      setPixelRatio(ratio) { this.ratio = ratio; },
      setSize(width, height) { canvas.width = width * this.ratio; canvas.height = height * this.ratio; },
      setAnimationLoop(callback) {
        loops.delete(this); this.loop = callback;
        if (callback) loops.add(this);
        peakLoops = Math.max(peakLoops, loops.size);
      },
      render(scene, camera) {
        this.scene = scene; this.camera = camera; this.draws += 1;
        scene.traverse((object) => {
          // Sprite quad geometry is shared by Three.js itself, not owned by a map session.
          for (const resource of [object, object.isSprite ? null : object.geometry, object.material, object.material?.map]) {
            if (resource?.addEventListener && !this.tracked.has(resource)) {
              this.tracked.add(resource); resource.addEventListener('dispose', () => { disposedResources += 1; this.released.add(resource); });
            }
          }
        });
      },
      getContext: () => ({ getExtension: () => null, getParameter: () => 'fixture' }),
      dispose() { assert.equal(this.loop, null); this.disposed = true; events.push('dispose'); },
    };
    renderers.push(renderer); return renderer;
  }
  let failNext = false;
  const app = createApplication({ canvas, panel, fpsElement: fps, initialMap: createFixedMapDefinition(),
    buildInfo: { productionBuild: false }, benchmark, doc, host }, {
    sceneFactory(...args) {
      if (failNext) { failNext = false; throw new Error('controlled renderer failure'); }
      args[5] = { ...args[5], createRenderer: rendererFactory };
      return createScene(...args);
    },
  });
  let time = 0;
  const tick = () => { time += 50; renderers.at(-1).loop?.(time); };
  tick();
  return { app, doc, host, canvas, viewport, nodes, observers, loops, renderers, events, exports, tick,
    get peakLoops() { return peakLoops; }, get disposedResources() { return disposedResources; },
    fail() { failNext = true; },
    close() { app.dispose(); Object.assign(globalThis, saved); },
  };
}

test('map contract validates explicit spawns/endpoints/cells and owns a reset-safe data snapshot', () => {
  const input = smallMap(); const map = normalizeMap(input);
  assert.equal(map.width, 12); assert.equal(map.height, 8);
  assert.equal(map.vegetationPatch, undefined); assert.equal(map.zones, undefined);
  input.cells[53].fuelType = 'none'; input.spawnCells[0] = 0;
  assert.equal(map.cells[53].fuelType, 'grass'); assert.equal(map.spawnCells[0], 25);
  const simulation = createEvacuationSimulation(map);
  assert.equal(simulation.agents.agents.length, 3);
  assert.deepEqual(simulation.agents.agents.map((a) => a.cell), [25, 26, 37]);
  simulation.select(53); simulation.start();
  for (let i = 0; i < 500; i += 1) simulation.advance(0.05);
  assert.equal(simulation.agents.counts().evacuated, 3);
  simulation.reset(); assert.equal(simulation.agents.counts().waiting, 3);
  assert.equal(map.cells[53].fuelType, 'grass');
  for (const change of [
    (m) => { m.width = 0; }, (m) => m.cells.pop(), (m) => { delete m.cells[1]; }, (m) => { m.start.x = -1; },
    (m) => { m.safeZone.z = 8; }, (m) => { m.spawnCells = []; },
    (m) => { m.spawnCells = [0]; }, (m) => { m.spawnCells = [1.5]; }, (m) => { m.spawnCells = new Array(3); },
    (m) => { m.cells[1].fuelType = 'unknown'; },
    (m) => { m.rendering.decorationBounds.x1 = 20; },
    (m) => { m.rendering.labels[0].width = -1; }, (m) => { m.rendering.labels = new Array(2); },
    (m) => { m.zones = { start: { x0: -1, x1: 2, z0: 0, z1: 3 } }; },
  ]) { const invalid = smallMap(); change(invalid); assert.throws(() => normalizeMap(invalid)); }
});

test('fixed adapter preserves authored cells, exact default spawns and both scenario timelines', () => {
  const raw = createFixedMap(); const adapted = createFixedMapDefinition();
  for (const key of Object.keys(raw)) assert.deepEqual(adapted[key], raw[key]);
  const old = createEvacuationSimulation(raw); const next = createEvacuationSimulation(adapted);
  assert.deepEqual(next.agents.agents, old.agents.agents);
  for (const ignition of [[32, 32], [32, 25]]) {
    const expected = measureScenario(createEvacuationSimulation(raw), raw, ignition);
    const actual = measureScenario(createEvacuationSimulation(adapted), adapted, ignition);
    assert.deepEqual(actual, expected);
    assert.equal(actual.evacuationComplete, ignition[1] === 32 ? 60.8 : 47.35);
  }
});

test('synthetic map metadata drives labels, decoration bounds, framing and offset picking across sizes', () => {
  const f = fixture();
  try {
    f.app.replaceMap(smallMap()); f.tick();
    assert.match(f.nodes['map-summary'].textContent, /12×8/);
    assert.match(f.nodes['population-summary'].textContent, /3 agents/);
    assert.equal(f.nodes['count-waiting'].textContent, '3');
    const renderer = f.renderers.at(-1);
    const labels = renderer.scene.children[0].children.filter((object) => object.isSprite);
    assert.deepEqual(labels.map((label) => label.userData.text), ['START', 'SAFE']);
    for (let i = 0; i < labels.length; i += 1) {
      const item = smallMap().rendering.labels[i];
      assert.deepEqual(labels[i].position.toArray(), [(item.x + 0.5 - 6) * 0.5, 0.35, (item.z + 0.5 - 4) * 0.5]);
    }
    const rocks = renderer.scene.children[0].children.find((object) => object.isInstancedMesh
      && object.material.color.getHex() === 0x687276);
    assert.equal(rocks.count, 1, 'out-of-bounds decorative rock at (0,0) is excluded');
    const bounds = getCameraBounds(f.app.current.map);
    assert.equal(bounds.worldWidth, 6); assert.equal(bounds.worldDepth, 4);
    for (const [width, height] of [[920, 555], [360, 640], [1280, 360]]) {
      f.viewport.clientWidth = width; f.viewport.clientHeight = height;
      f.canvas.clientWidth = width; f.canvas.clientHeight = height;
      for (const observer of f.observers) observer.callback();
      emit(f.host, 'keydown', { key: 'r' }); f.tick();
      const camera = renderer.camera; camera.updateMatrixWorld();
      for (const label of labels) {
        const point = label.position.clone().project(camera);
        assert.ok(Math.abs(point.x) < 1 && Math.abs(point.y) < 1, 'label fits default overview');
      }
      for (const index of [25, 70, 53]) {
        const point = new Vector3((index % 12 + 0.5 - 6) * 0.5, 0,
          (Math.floor(index / 12) + 0.5 - 4) * 0.5).project(camera);
        assert.ok(Math.abs(point.x) < 1 && Math.abs(point.y) < 1);
        assert.equal(f.app.current.view.pickCell(31 + (point.x + 1) * width / 2,
          87 + (1 - point.y) * height / 2), index);
      }
      assert.equal(camera.aspect, width / height);
    }
  } finally { f.close(); }
});

test('repeated real scene/control replacement releases loops, observers, GPU resources and UI bindings', () => {
  const f = fixture(true);
  try {
    for (let i = 0; i < 6; i += 1) {
      const old = f.app.current; const renderer = f.renderers.at(-1); const staleFrame = renderer.loop;
      const keyCount = f.host.listeners.get('keydown').size;
      const invalid = smallMap(); invalid.spawnCells = [0];
      assert.throws(() => f.app.replaceMap(invalid)); assert.equal(f.app.current, old);
      emit(f.canvas, 'pointerdown', { pointerId: 100 + i, pointerType: 'mouse',
        button: i % 2 === 0 ? 2 : 1, buttons: i % 2 === 0 ? 2 : 4, clientX: 400, clientY: 300 });
      f.app.replaceMap(i % 2 === 0 ? smallMap() : createFixedMapDefinition()); f.tick();
      assert.equal(renderer.disposed, true);
      const oldTime = old.simulation.time; const draws = renderer.draws;
      staleFrame(100000); assert.equal(old.simulation.time, oldTime); assert.equal(renderer.draws, draws);
      assert.equal(f.loops.size, 1); assert.equal(f.observers.size, 1);
      assert.equal(f.host.listeners.get('keydown').size, keyCount);
      assert.equal(f.doc.listeners.get('visibilitychange').size, 2,
        'one FPS visibility handler and one camera gesture-cancellation handler');
      assert.equal(f.exports.filter((element) => !element.removed).length, 2);
      emit(f.host, 'keydown', { key: 'i' });
      assert.equal(f.nodes['place-ignition'].attributes['aria-pressed'], 'true', 'one shortcut handler, one toggle');
      emit(f.nodes['reset-simulation'], 'click');
      assert.equal(f.nodes['place-ignition'].attributes['aria-pressed'], 'false');
      assert.equal(f.nodes['count-waiting'].textContent, String(f.app.current.map.spawnCells.length));
    }
    assert.equal(f.peakLoops, 1); assert.ok(f.disposedResources > 100);
    for (const renderer of f.renderers.slice(0, -1)) {
      for (const resource of renderer.tracked) {
        if (resource.isBufferGeometry || resource.isMaterial || resource.isTexture || resource.isInstancedMesh) {
          assert.ok(renderer.released.has(resource), `tracked resource not disposed: ${resource.type} ${resource.name ?? ''}`);
        }
      }
    }
    assert.deepEqual(f.events.slice(0, 5), ['construct', 'dispose', 'construct', 'dispose', 'construct']);
    f.app.dispose(); f.app.dispose();
    assert.equal(f.loops.size, 0); assert.equal(f.observers.size, 0);
    assert.equal(f.canvas.listenerCount(), 0); assert.equal(f.host.listenerCount(), 0);
    assert.equal(f.doc.listenerCount(), 0);
    assert.equal(f.exports.filter((element) => !element.removed).length, 0);
    assert.equal(f.canvas.style.cursor, 'auto');
    assert.throws(() => f.app.replaceMap(smallMap()), /disposed/);
  } finally { f.close(); }
});

test('failed replacement construction leaves no old scene or half-active session and permits recovery', () => {
  const f = fixture();
  try {
    f.fail(); assert.throws(() => f.app.replaceMap(smallMap()), /controlled renderer failure/);
    assert.equal(f.app.current, null); assert.equal(f.loops.size, 0); assert.equal(f.observers.size, 0);
    assert.equal(f.canvas.listenerCount(), 0); assert.equal(f.host.listenerCount(), 0);
    assert.equal(f.doc.listenerCount(), 0);
    f.app.replaceMap(smallMap()); f.tick();
    assert.equal(f.loops.size, 1); assert.equal(f.app.current.simulation.agents.counts().waiting, 3);
  } finally { f.close(); }
});


test('camera-only R and simulation reset remain distinct after replacement', () => {
  const f = fixture();
  try {
    f.app.replaceMap(smallMap()); f.tick();
    const current = f.app.current;
    const camera = f.renderers.at(-1).camera;
    const overview = camera.position.clone();
    emit(f.canvas, 'wheel', { deltaY: -120, deltaMode: 0, clientX: 400, clientY: 300 });
    f.tick();
    const zoomed = camera.position.clone();
    assert.ok(zoomed.distanceTo(overview) > 0.01);
    current.simulation.select(53); emit(f.nodes['start-fire'], 'click'); f.tick(); f.tick();
    assert.equal(current.simulation.started, true);
    emit(f.nodes['reset-simulation'], 'click');
    assert.equal(current.simulation.started, false); assert.equal(current.simulation.selected, null);
    assert.equal(current.simulation.time, 0); assert.equal(current.simulation.agents.counts().waiting, 3);
    assert.ok(camera.position.distanceTo(zoomed) < 1e-9, 'simulation reset keeps the camera');
    current.simulation.select(53); emit(f.nodes['start-fire'], 'click'); f.tick(); f.tick();
    const time = current.simulation.time;
    emit(f.host, 'keydown', { key: 'r' });
    assert.ok(camera.position.distanceTo(overview) < 1e-9);
    assert.equal(current.simulation.started, true); assert.equal(current.simulation.selected, 53);
    assert.equal(current.simulation.time, time, 'R changes no simulation state');
  } finally { f.close(); }
});


test('off-center relevant regions remain valid default/reset targets within navigation limits', () => {
  const f = fixture();
  try {
    const map = { width: 40, height: 16, cellSize: 0.5,
      cells: Array.from({ length: 640 }, () => ({ terrain: 'obstacle', fuelType: 'none', walkable: false })),
      start: { x: 1, z: 2 }, safeZone: { x: 3, z: 4 }, spawnCells: [81] };
    map.cells[81].walkable = true; map.cells[163].walkable = true;
    f.app.replaceMap(map); f.tick();
    assert.equal(f.app.current.view.performanceInfo().cameraDefault, true);
    const renderer = f.renderers.at(-1);
    const overview = renderer.camera.position.clone();
    emit(f.canvas, 'wheel', { deltaY: 120, deltaMode: 0 }); f.tick();
    emit(f.host, 'keydown', { key: 'r' }); f.tick();
    assert.ok(renderer.camera.position.distanceTo(overview) < 1e-9);
    assert.equal(f.app.current.view.performanceInfo().cameraDefault, true);
  } finally { f.close(); }
});
