import assert from 'node:assert/strict';
import test from 'node:test';
import { createFixedMap } from '../src/world/createFixedMap.js';
import { createFireSimulation, isHazardous } from '../src/simulation/createFireSimulation.js';
import { FIRE_CONFIG } from '../src/simulation/fireConfig.js';

const grass = 23 * 64 + 31;
const brush = 32 * 64 + 31;
function advanceSeconds(simulation, seconds, fps = 60) {
  for (let i = 0; i < Math.round(seconds * fps); i += 1) simulation.advance(1 / fps);
}

test('eligibility and movable single selection reject fuel-free cells without mutation', () => {
  const simulation = createFireSimulation(createFixedMap());
  const initial = structuredClone(simulation.cells);
  assert.equal(simulation.start(), false);
  for (const index of [null, -1, 4096, 0.5, 0, 32 * 64 + 9]) {
    assert.equal(simulation.select(index), false);
  }
  assert.equal(simulation.select(grass), true);
  assert.equal(simulation.select(brush), true);
  assert.equal(simulation.selected, brush);
  assert.equal(simulation.select(0), false);
  assert.equal(simulation.selected, brush);
  assert.deepEqual(simulation.cells, initial);
  assert.equal(simulation.start(), true);
  assert.equal(simulation.select(grass), false);
  assert.equal(simulation.start(), false);
  assert.equal(simulation.cells.filter((cell) => cell.state === 'burning').length, 1);
});

test('isolated fuel exhaustion, hot cooling, base walkability, and no reignition', () => {
  for (const [index, duration, walkable] of [[grass, 4, true], [brush, 6, false]]) {
    // Isolate lifecycle boundaries; neighboring propagation has separate tests.
    const simulation = createFireSimulation(createFixedMap(), { ...FIRE_CONFIG, ignitionExposure: Infinity });
    simulation.select(index);
    simulation.start();
    assert.equal(isHazardous(simulation.cells[index]), true);
    advanceSeconds(simulation, duration - 0.05, 20);
    assert.equal(simulation.cells[index].state, 'burning');
    simulation.advance(0.05);
    assert.deepEqual(simulation.cells[index], {
      state: 'burned-hot', fuel: 0, hotRemaining: 5, exposure: 0, walkable,
    });
    assert.equal(isHazardous(simulation.cells[index]), true);
    advanceSeconds(simulation, 4.95, 20);
    assert.equal(simulation.cells[index].state, 'burned-hot');
    simulation.advance(0.05);
    assert.equal(simulation.cells[index].state, 'burned-cool');
    assert.equal(simulation.cells[index].hotRemaining, 0);
    assert.equal(isHazardous(simulation.cells[index]), false);
    assert.equal(simulation.cells[index].walkable, walkable);
    assert.equal(simulation.eligible(index), false);
    assert.equal(simulation.start(), false);
    assert.equal(simulation.cells.filter((cell) => cell.state !== 'unburned').length, 1);
  }
});

test('reset restores independent initial state/timers/selection and a repeatable run', () => {
  const map = createFixedMap();
  const original = structuredClone(map);
  const simulation = createFireSimulation(map);
  const initial = structuredClone(simulation.cells);
  simulation.select(grass);
  simulation.start();
  advanceSeconds(simulation, 9);
  const completed = structuredClone(simulation.cells);
  simulation.reset();
  assert.equal(simulation.selected, null);
  assert.equal(simulation.started, false);
  assert.deepEqual(simulation.cells, initial);
  assert.deepEqual(map, original);
  simulation.select(grass);
  simulation.start();
  advanceSeconds(simulation, 9);
  assert.deepEqual(simulation.cells, completed);
  assert.deepEqual(map, original);
  simulation.reset();
  simulation.select(grass);
  simulation.start();
  simulation.advance(0.049);
  simulation.reset();
  simulation.select(grass);
  simulation.start();
  simulation.advance(0.001);
  assert.equal(simulation.cells[grass].fuel, 4, 'reset must discard partial-step time');
});

test('ordinary frame rates produce identical state, fuel and timers', () => {
  const outcomes = [];
  for (const fps of [20, 30, 60, 144]) {
    const simulation = createFireSimulation(createFixedMap());
    simulation.select(brush);
    simulation.start();
    advanceSeconds(simulation, 7, fps);
    outcomes.push(simulation.cells);
  }
  for (const outcome of outcomes) assert.deepEqual(outcome, outcomes[0]);
});

test('long gaps drop excess time and invalid intervals do not advance', () => {
  const simulation = createFireSimulation(createFixedMap());
  simulation.select(brush);
  simulation.start();
  simulation.advance(120);
  assert.ok(Math.abs(simulation.cells[brush].fuel - (6 - FIRE_CONFIG.maxFrameSeconds)) < 1e-9);
  const before = structuredClone(simulation.cells);
  for (const delta of [NaN, Infinity, -1, 0]) simulation.advance(delta);
  assert.deepEqual(simulation.cells, before);
  simulation.advance(0.05);
  assert.ok(Math.abs(simulation.cells[brush].fuel - 5.7) < 1e-9);
});

test('configuration controls cooling duration and reset restores an in-progress run', () => {
  const simulation = createFireSimulation(createFixedMap(), { ...FIRE_CONFIG, coolingSeconds: 1 });
  simulation.select(grass);
  simulation.start();
  advanceSeconds(simulation, 4.5);
  assert.equal(simulation.cells[grass].state, 'burned-hot');
  simulation.reset();
  assert.equal(simulation.cells[grass].fuel, 4);
  assert.equal(simulation.cells[grass].hotRemaining, 0);
  simulation.select(grass);
  simulation.start();
  advanceSeconds(simulation, 5);
  assert.equal(simulation.cells[grass].state, 'burned-cool');
});
