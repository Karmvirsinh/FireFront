import assert from 'node:assert/strict';
import test from 'node:test';
import { createFireSimulation } from '../src/simulation/createFireSimulation.js';
import { getNavigationHazards } from '../src/simulation/getNavigationHazards.js';
import { isConnected } from '../src/world/isConnected.js';
import { FIRE_CONFIG } from '../src/simulation/fireConfig.js';
import { createFixedMap } from '../src/world/createFixedMap.js';

function mapOf(...rows) {
  return { width: rows[0].length, height: rows.length,
    cells: rows.join('').split('').map((type) => ({ fuelType: { b: 'brush', g: 'grass', '.': 'none' }[type],
      walkable: type !== 'b' })) };
}
function run(map, selected = 0, config = FIRE_CONFIG) {
  const simulation = createFireSimulation(map, config);
  assert.equal(simulation.select(selected), true);
  assert.equal(simulation.start(), true);
  return simulation;
}
function advance(simulation, seconds, fps = 20) {
  for (let i = 0; i < Math.round(seconds * fps); i += 1) simulation.advance(1 / fps);
}

test('adjacent fuel ignites after exposure delay; fuel amount affects duration, not delay', () => {
  for (const type of ['b', 'g']) {
    const simulation = run(mapOf(`b${type}`));
    advance(simulation, 0.95);
    assert.equal(simulation.cells[1].state, 'unburned');
    assert.ok(Math.abs(simulation.cells[1].exposure - 0.95) < 1e-9);
    simulation.advance(0.05);
    assert.equal(simulation.cells[1].state, 'burning');
    assert.equal(simulation.cells[1].fuel, type === 'b' ? 6 : 4);
    assert.equal(simulation.cells[1].exposure, 0);
  }
  const twoSources = run(mapOf('bgb'));
  twoSources.cells[2].state = 'burning'; // Arrange two existing burning neighbors.
  advance(twoSources, 0.5);
  assert.equal(twoSources.cells[1].state, 'burning');
});

test('no diagonal-only spread, row wrapping, or jumping a nonfuel gap', () => {
  for (const map of [mapOf('b.', '.b'), mapOf('b.b'), mapOf('.b', 'b.')]) {
    const selected = map.cells.findIndex((cell) => cell.fuelType !== 'none');
    const simulation = run(map, selected);
    advance(simulation, 20);
    assert.equal(simulation.cells.filter((cell) => cell.state !== 'unburned').length, 1);
    assert.ok(simulation.cells.filter((_, i) => i !== selected).every((cell) => cell.exposure === 0));
  }
});

test('incomplete exposure resets without burning sources; hot/cool never spread', () => {
  const simulation = run(mapOf('bg'), 0, { ...FIRE_CONFIG,
    fuelByType: { ...FIRE_CONFIG.fuelByType, brush: 0.25 } });
  advance(simulation, 0.25);
  assert.equal(simulation.cells[0].state, 'burned-hot');
  assert.ok(simulation.cells[1].exposure > 0);
  simulation.advance(0.05);
  assert.equal(simulation.cells[1].exposure, 0);
  advance(simulation, 10);
  assert.equal(simulation.cells[0].state, 'burned-cool');
  assert.equal(simulation.cells[1].state, 'unburned');
});

test('a snapshot prevents same-step cascades and new cells retain full fuel', () => {
  const simulation = run(mapOf('bbbb'), 0, { ...FIRE_CONFIG, ignitionExposure: 0.05 });
  simulation.advance(0.05);
  assert.deepEqual(simulation.cells.map((cell) => cell.state), ['burning', 'burning', 'unburned', 'unburned']);
  assert.equal(simulation.cells[1].fuel, 6);
  simulation.advance(0.05);
  assert.equal(simulation.cells[2].state, 'burning');
  assert.equal(simulation.cells[3].state, 'unburned');
});

test('exhausted cells cannot reignite beside a burning neighbor', () => {
  const simulation = run(mapOf('gb'));
  advance(simulation, 4);
  assert.equal(simulation.cells[0].state, 'burned-hot');
  assert.equal(simulation.cells[1].state, 'burning');
  assert.equal(simulation.eligible(0), false);
  advance(simulation, 6);
  assert.equal(simulation.cells[0].state, 'burned-cool');
  assert.equal(simulation.cells[0].fuel, 0);
  assert.equal(simulation.cells[0].exposure, 0);
});

test('reverse logical iteration order gives identical per-step results', () => {
  const map = mapOf('bgbb', 'bb.b', 'gbbb');
  // Reflect both axes: each logical cell is visited in the reverse order, but
  // retains the same edge-sharing neighbors and fuel. Compare after every step.
  const reversedMap = { ...map, cells: map.cells.slice().reverse() };
  const forward = run(map, 1);
  const reverse = run(reversedMap, map.cells.length - 2);
  for (let step = 0; step < 300; step += 1) {
    forward.advance(0.05);
    reverse.advance(0.05);
    assert.deepEqual(forward.cells, reverse.cells.slice().reverse());
  }
});

test('spread reset/replay is repeatable across ordinary rendering intervals and clears exposure', () => {
  const map = createFixedMap();
  const original = structuredClone(map);
  const selected = 32 * 64 + 32;
  const simulation = run(map, selected);
  advance(simulation, 7.5, 30);
  const outcome = structuredClone(simulation.cells);
  assert.ok(outcome.some((cell) => cell.exposure > 0));
  assert.ok(outcome.filter((cell) => cell.state !== 'unburned').length > 1);
  for (const fps of [20, 60, 144]) {
    simulation.reset();
    assert.ok(simulation.cells.every((cell) => cell.state === 'unburned' && cell.exposure === 0
      && cell.hotRemaining === 0));
    simulation.select(selected);
    simulation.start();
    advance(simulation, 7.5, fps);
    assert.deepEqual(simulation.cells, outcome);
  }
  assert.deepEqual(map, original);
});

test('fixed-map spread makes bare road passages unsafe via buffers without burning roads', () => {
  const map = createFixedMap();
  const simulation = run(map, 32 * 64 + 32);
  const reached = new Set();
  for (let step = 0; step < 800; step += 1) {
    simulation.advance(0.05);
    const unsafe = getNavigationHazards(simulation);
    for (const route of map.routes) {
      const { section } = route;
      let allHazardous = true;
      for (let z = section.z0; z <= section.z1; z += 1) for (let x = section.x0; x <= section.x1; x += 1) {
        allHazardous &&= Boolean(unsafe[z * map.width + x]);
      }
      if (allHazardous) reached.add(route.id);
    }
  }
  assert.deepEqual([...reached].sort(), ['A', 'B']);
  assert.ok(map.cells.every((cell, i) => cell.terrain !== 'route'
    || (simulation.cells[i].state === 'unburned' && simulation.cells[i].fuel === 0)));
  assert.equal(isConnected(map, map.start, map.safeZone, getNavigationHazards(simulation)), true);
  assert.ok(simulation.cells.every((cell, i) => map.cells[i].fuelType === 'none'
    ? cell.state === 'unburned' : cell.state === 'burned-cool'));
  assert.deepEqual(map, createFixedMap());
});
