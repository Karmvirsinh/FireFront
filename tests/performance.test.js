import assert from 'node:assert/strict';
import test from 'node:test';
import { createFrameCapture, createFpsSampler } from '../src/performance/frameMetrics.js';
import { benchmarkBlockers } from '../src/performance/benchmarkConditions.js';
import { createPerformanceReadout } from '../src/performance/createPerformanceReadout.js';

function info() {
  return { build: { productionBuild: true }, viewport: { width: 1280, height: 720 },
    canvas: { cssWidth: 922, cssHeight: 555, bufferWidth: 922, bufferHeight: 555 },
    devicePixelRatio: 1, visible: true, focused: true, reducedMotion: false, cameraDefault: true,
    grid: { width: 64, height: 64 }, population: 20, graphics: { renderer: 'physical GPU' } };
}

test('FPS sampler counts actual intervals, publishes once per second and resets its baseline', () => {
  const values = [];
  const meter = createFpsSampler((value) => values.push(value));
  for (let i = 0; i <= 99; i += 1) meter.frame(i * 10);
  assert.equal(values.length, 0);
  meter.frame(1000);
  assert.deepEqual(values, [100]);
  meter.reset();
  meter.frame(500000);
  meter.frame(500500);
  assert.equal(values.length, 1);
  meter.frame(501000);
  assert.deepEqual(values, [100, 2]);
});

test('60-second capture reports totals, real dips and nearest-rank p95 without simulation capping', () => {
  const capture = createFrameCapture(0);
  capture.frame(500);
  capture.frame(1000); // First second is deliberately poor despite a good overall average.
  let result;
  for (let i = 1; i <= 3540; i += 1) result = capture.frame(1000 + i * 1000 / 60);
  assert.equal(result.durationSeconds, 60);
  assert.equal(result.renderedFrames, 3542);
  assert.ok(Math.abs(result.averageFps - 3542 / 60) < 1e-9);
  assert.equal(result.lowestOneSecondFps, 2);
  assert.equal(result.windowsBelow30, 1);
  assert.ok(Math.abs(result.p95FrameTimeMs - 1000 / 60) < 1e-8);
  assert.equal(capture.frame(70000), result, 'completed result is immutable');
  const stall = createFrameCapture(0, 1000);
  stall.frame(10);
  assert.equal(stall.frame(1000).p95FrameTimeMs, 990);
});

test('benchmark conditions flag invalid viewport, animation, focus, camera and software renderer', () => {
  assert.deepEqual(benchmarkBlockers(info()), []);
  const invalid = { ...info(), build: { productionBuild: false }, viewport: { width: 900, height: 600 },
    focused: false, reducedMotion: true, cameraDefault: false, population: 10,
    graphics: { renderer: 'ANGLE SwiftShader software' } };
  assert.equal(benchmarkBlockers(invalid).length, 7);
});

function fixture(benchmark = false) {
  let now = 0;
  const doc = Object.assign(new EventTarget(), { hidden: false, elements: [], createElement() {
    const element = { textContent: '', remove() { this.removed = true; } };
    this.elements.push(element); return element;
  } });
  const element = { textContent: '', parentElement: { append() {} } };
  const host = new EventTarget();
  const canvas = new EventTarget();
  const environment = info();
  let counts = { waiting: 20, evacuating: 0, trapped: 0, evacuated: 0, lost: 0 };
  const simulation = { started: false, selected: 2080, time: 0, agents: { counts: () => counts } };
  const view = createPerformanceReadout({ element, canvas, simulation, benchmark, doc, host,
    environment: () => environment, clock: { now: () => now } });
  return { doc, element, host, canvas, environment, simulation, view,
    tick(value) { now = value; view.frame(now); }, setCounts(value) { counts = value; },
    report() { return JSON.parse(doc.elements[1].textContent); } };
}

test('hidden-tab return clears FPS sampling; simulation reset is independent; disposal cleans listeners', () => {
  const f = fixture();
  for (let i = 0; i <= 100; i += 1) f.tick(i * 10);
  assert.equal(f.element.textContent, 'FPS: 100.0');
  f.simulation.started = false; f.view.changed();
  assert.equal(f.element.textContent, 'FPS: 100.0');
  f.doc.hidden = true; f.doc.dispatchEvent(new Event('visibilitychange'));
  f.tick(50000);
  assert.equal(f.element.textContent, 'FPS: paused');
  f.doc.hidden = false; f.doc.dispatchEvent(new Event('visibilitychange'));
  f.tick(100000);
  assert.equal(f.element.textContent, 'FPS: …');
  for (let i = 1; i <= 50; i += 1) f.tick(100000 + i * 20);
  assert.equal(f.element.textContent, 'FPS: 50.0');
  assert.equal(f.doc.elements.length, 0, 'no benchmark DOM or report on normal pages');
  f.view.dispose(); f.doc.hidden = true; f.doc.dispatchEvent(new Event('visibilitychange')); f.tick(200000);
  assert.equal(f.element.textContent, 'FPS: 50.0');
});

test('opt-in captures two full wall-clock runs, waits for evacuation, preserves counts and exports JSON', () => {
  const f = fixture(true);
  for (let i = 0; i <= 500; i += 1) f.tick(i * 10);
  for (let run = 0; run < 2; run += 1) {
    const start = 5000 + run * 61000;
    f.simulation.started = true;
    f.setCounts({ waiting: 0, evacuating: 20, trapped: 0, evacuated: 0, lost: 0 });
    f.view.changed();
    for (let i = 1; i <= 6000; i += 1) f.tick(start + i * 10);
    const captured = f.report().runs[run];
    assert.equal(captured.valid, true);
    assert.equal(captured.metrics.averageFps, 100);
    assert.equal(captured.metrics.durationSeconds, 60);
    assert.equal(captured.countsAt60Seconds.evacuating, 20);
    assert.equal(captured.finalCounts, undefined, 'wait beyond capture for scenario completion');
    f.setCounts({ waiting: 0, evacuating: 0, trapped: 0, evacuated: 20, lost: 0 });
    f.tick(start + 61000);
    assert.equal(f.report().runs[run].finalCounts.evacuated, 20);
    f.simulation.started = false; f.view.changed();
  }
  assert.equal(f.report().runs.length, 2);
  assert.equal(f.report().runs[0].capture, undefined, 'internal capture state is not exported');
  f.view.dispose();
  assert.ok(f.doc.elements.every((element) => element.removed));
});

test('hidden/focus/resize/gesture interruptions and premature reset invalidate opt-in measurements', () => {
  const f = fixture(true);
  f.tick(0); f.tick(5000);
  f.simulation.started = true; f.view.changed();
  f.doc.hidden = true; f.doc.dispatchEvent(new Event('visibilitychange'));
  f.host.dispatchEvent(new Event('blur'));
  f.host.dispatchEvent(new Event('resize'));
  f.canvas.dispatchEvent(new Event('wheel'));
  assert.equal(f.report().runs[0].valid, false);
  assert.equal(f.report().runs[0].issues.length, 4);
  f.simulation.started = false; f.view.changed();
  assert.equal(f.report().runs[0].issues.length, 5);
  assert.equal(f.report().runs[0].metrics, undefined);
  f.view.dispose();
});
